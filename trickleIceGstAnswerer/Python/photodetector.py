# run this at the beginning to synchronize the NTP servers
# sudo systemctl restart ntp

# Run this to confirm the NTP srvers are synchronized
# ntpq -p


import gpiod
import time
from flask import Flask, request
import threading

app = Flask(__name__)

# Lists to store LED ON timestamps and photodetector events
led_events = []
photodetector_events = []

# Locks for thread safety
data_lock = threading.Lock()

# Set up the GPIO chip and line
chip = gpiod.Chip('gpiochip1')
line = chip.get_line(94)  # Replace with your GPIO line number

# Request the line as input with rising edge detection
line.request(consumer="photodetector", type=gpiod.LINE_REQ_EV_RISING_EDGE)

# Debounce time in microseconds
DEBOUNCE_TIME_US = 200_000  # 200 ms
last_event_time_us = 0

def gpio_monitor():
    global last_event_time_us
    print("Monitoring photodetector for rising edge...")

    try:
        while True:
            # Wait for the rising edge event
            if line.event_wait(sec=10):
                event = line.event_read()
                # Get timestamp in microseconds
                event_time_us = time.time_ns() // 1000

                # Debounce logic
                if (event_time_us - last_event_time_us) > DEBOUNCE_TIME_US:
                    last_event_time_us = event_time_us
                    print(f"Light detected at: {event_time_us} microseconds")

                    # Add photodetector event to the list
                    with data_lock:
                        photodetector_events.append({'timestamp': event_time_us})

                else:
                    # Ignore bounce events
                    pass
            else:
                # No event detected within the timeout
                pass

    except KeyboardInterrupt:
        print("Exiting GPIO monitor")

    finally:
        # Clean up
        line.release()
        chip.close()

# Function to calculate latency by matching events from the lists
def latency_calculator():
    print("Latency calculator started")
    while True:
        with data_lock:
            # Remove any LED events older than a certain threshold (optional)
            current_time_us = time.time_ns() // 1000
            TIMEOUT_US = 2_000_000  # 2 seconds
            led_events[:] = [event for event in led_events if current_time_us - event['timestamp'] <= TIMEOUT_US]
            photodetector_events[:] = [event for event in photodetector_events if current_time_us - event['timestamp'] <= TIMEOUT_US]

            # Try to find matching events
            for led_event in led_events:
                # Find the first photodetector event that occurred after the LED event
                matching_photodetector_events = [event for event in photodetector_events if event['timestamp'] >= led_event['timestamp']]
                # print(f"LED event: {led_event}, Photodetector events: {matching_photodetector_events}")
                if matching_photodetector_events:
                    photodetector_event = matching_photodetector_events[0]

                    latency_us = photodetector_event['timestamp'] - led_event['timestamp']
                    latency_us = latency_us // 1000  # Convert to milliseconds
                    print(f"Latency: {latency_us} milliseconds")

                    

                    # Remove matched events from the lists
                    led_events.clear()
                    photodetector_events.clear()
                    # led_events.remove(led_event)
                    # photodetector_events.remove(photodetector_event)
                    break  # Move to the next iteration after processing one pair

        time.sleep(0.01)  # Sleep briefly to avoid busy waiting

# Flask route to receive the LED timestamp
@app.route('/timestamp', methods=['POST'])
def receive_timestamp():
    timestamp_us = request.form.get('timestamp_us')
    if timestamp_us:
        led_timestamp = int(timestamp_us)
        with data_lock:
            led_events.append({'timestamp': led_timestamp})
        print(f"Received LED ON timestamp: {led_timestamp} microseconds")
        return 'Timestamp received', 200
    else:
        return 'Invalid data', 400

if __name__ == '__main__':
    # Start GPIO monitoring in a separate thread
    gpio_thread = threading.Thread(target=gpio_monitor, daemon=True)
    gpio_thread.start()

    # Start latency calculator in a separate thread
    latency_thread = threading.Thread(target=latency_calculator, daemon=True)
    latency_thread.start()

    # Run Flask server
    app.run(host='0.0.0.0', port=5000)

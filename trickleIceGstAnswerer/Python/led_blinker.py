# sudo systemctl restart ntp

import gpiod
import time
import requests


# Set up the GPIO chip and line
chip = gpiod.Chip('gpiochip1')  # Adjust based on your setup
line = chip.get_line(93)        # Replace 88 with your GPIO line number

#set up the other board networking
BOARD2_IP = '192.168.1.44'  # Example IP address

# Request the line as output
line.request(consumer="led_blinker", type=gpiod.LINE_REQ_DIR_OUT)

print("Starting LED blinking every 3 seconds...")

try:
    while True:
        # Log the timestamp
        timestamp_us = time.time_ns() // 1000  # Microseconds since epoch
        
        # Turn the LED ON
        line.set_value(1)
        
        print(f"LED ON at {timestamp_us} microseconds")

        # Send the timestamp to Board 2
        try:
            response = requests.post(f'http://{BOARD2_IP}:5000/timestamp', data={'timestamp_us': timestamp_us})
            if response.status_code == 200:
                print("Timestamp sent to Board 2")
            else:
                print(f"Failed to send timestamp: {response.status_code}")
        except Exception as e:
            print(f"Error sending timestamp: {e}")

        # Keep the LED ON for 100 ms
        time.sleep(0.1)
        # Turn the LED OFF
        line.set_value(0)
        # Wait for the remainder of the 3-second interval
        time.sleep(2.9)  # Total period is 3 seconds (0.1 + 2.9)

except KeyboardInterrupt:
    print("Exiting program")

finally:
    # Clean up
    line.release()
    chip.close()

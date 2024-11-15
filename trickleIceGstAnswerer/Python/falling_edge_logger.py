# make sure to run the following to initialize the ntp time sync
# sudo apt-get install ntp
# sudo systemctl enable ntp
# sudo systemctl start ntp

import gpiod
import time
from flask import Flask, request
import threading

app = Flask(__name__)

# Set up the GPIO chip and line (pin)
chip = gpiod.Chip('gpiochip1')  # This might vary based on your board's GPIO chip (use gpiodetect to verify, then use gpioinfo gpiochip1 to get line number)
line = chip.get_line(94)        # This corresponds to GPIO pin 18.


# Shared variable to store the LED ON timestamp
led_on_timestamp_us = None

# Debounce time in microseconds (e.g., 200,000 us = 200 ms)
DEBOUNCE_TIME_US = 200_000
last_event_time = 0

# Configure the line as input with falling edge detection
# The `request` function takes the consumer name and request flags
line.request(consumer="falling_edge_logger", type=gpiod.LINE_REQ_EV_FALLING_EDGE)

print("Monitoring GPIO for falling edge...")


    try:
        while True:
            # Wait for the falling edge event (timeout set to 10 seconds)
            if line.event_wait(sec=10):
                event = line.event_read()
                # Get the timestamp in nanoseconds and convert to microseconds
                timestamp_us = event.sec * 1_000_000 + event.nsec // 1000
                if (timestamp_us - last_event_time) > DEBOUNCE_TIME_US:
                    print(f"Valid falling edge detected at: {timestamp_us} microseconds")
                    print(f"Time since last event: {timestamp_us - last_event_time} microseconds")
                    last_event_time = timestamp_us
                else:
                    pass  # Ignore event (debounce)
            else:
                print("No event detected in the last 10 seconds.")

    except KeyboardInterrupt:
        print("Exiting program")

    finally:
        # Clean up when done
        line.release()
        chip.close()

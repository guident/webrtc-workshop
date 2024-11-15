# Define the compiler
CC = g++

# Define the target executable
TARGET = pcmAnswerer

# Define the source files
SRCS = pcmAnswerer.cpp pcmAnswererHub.cpp  \
	wssStateMachine.cpp Statemachine/pcmStartState.cpp \
	Statemachine/pcmConnectingState.cpp \
	Statemachine/pcmConnectedState.cpp \
	Statemachine/pcmEngagingState.cpp \
	Statemachine/pcmEngagedState.cpp

# Define the object files
OBJS = pcmAnswerer.o pcmAnswererHub.o \
	wssStateMachine.o Statemachine/pcmStartState.o \
	Statemachine/pcmConnectingState.o \
	Statemachine/pcmConnectedState.o \
	Statemachine/pcmEngagingState.o \
	Statemachine/pcmEngagedState.o

# Define the pkg-config packages
PKG_CONFIG_PACKAGES = gstreamer-1.0 gtk+-3.0 \
libsoup-3.0 gstreamer-webrtc-1.0 json-glib-1.0 gstreamer-sdp-1.0


# Define the Boost packages
# BOOST_LIBS = -lboost_system -lboost_thread -lssl -lcrypto -lpthread -lboost_filesystem

# Define the compiler flags using pkg-config and include Boost headers
CFLAGS = `pkg-config --cflags $(PKG_CONFIG_PACKAGES)` -I/usr/include

# Define the linker flags using pkg-config and Boost libraries
LDFLAGS = `pkg-config --libs $(PKG_CONFIG_PACKAGES)` -L/usr/lib $(BOOST_LIBS)

# Rule to build the target executable
$(TARGET): $(OBJS)
	$(CC) -o $(TARGET) $(OBJS) $(LDFLAGS)

# Rule to build the object files
%.o: %.cpp
	$(CC) $(CFLAGS) -c -o $@ $<

# Rule for cleaning up
clean:
	rm -f $(TARGET) $(OBJS) >/dev/null 2>&1


install:
	sudo cp ./pcmAnswerer /usr/local/bin/ >/dev/null 2>&1




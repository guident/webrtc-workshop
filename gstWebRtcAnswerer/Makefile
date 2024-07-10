

INCLUDES=-I/usr/include/libsoup-2.4 -I/usr/include/libxml2 -I/usr/include/json-glib-1.0 -I/usr/include/glib-2.0 -I/usr/lib/aarch64-linux-gnu/glib-2.0/include

GST_INCLUDES=-I/usr/local/gstreamer-1.18.6/include/gstreamer-1.0 -I/usr/include/glib-2.0 -I/usr/lib/aarch64-linux-gnu/glib-2.0/include

LIBS=-L/usr/local/gstreamer-1.18.6/lib/aarch64-linux-gnu -lgstwebrtc-1.0 -lgstsdp-1.0 -lgstrtp-1.0 -lgstbase-1.0 -lgstreamer-1.0 -lgobject-2.0 -lglib-2.0 -lsoup-2.4 -ljson-glib-1.0 -lgio-2.0

GstWebRtcAnswerer:	main.o GstWebRtcEndpointHub.o Log.o GstEndpointStartState.o GstEndpointConnectingState.o GstEndpointConnectedState.o GstEndpointEngagingState.o GstEndpointEngagedState.o
	g++ -o GstWebRtcAnswerer main.o GstWebRtcEndpointHub.o Log.o GstEndpointStartState.o GstEndpointConnectingState.o GstEndpointConnectedState.o GstEndpointEngagingState.o GstEndpointEngagedState.o -lpthread ${LIBS}

main.o:	Log.h GstEndpointStartState.h main.cpp
	g++ -c ${INCLUDES} ${GST_INCLUDES} -o main.o main.cpp 

Log.o:	Log.h Log.cpp 
	g++ -c -o Log.o Log.cpp

GstWebRtcEndpointHub.o: 	Log.h GstEndpointState.h GstWebRtcEndpointHub.h GstWebRtcEndpointHub.cpp
	g++ -c ${INCLUDES} ${GST_INCLUDES} -o GstWebRtcEndpointHub.o GstWebRtcEndpointHub.cpp

GstEndpointStartState.o: GstEndpointState.h GstEndpointStartState.h GstEndpointStartState.cpp
	g++ -c ${INCLUDES} ${GST_INCLUDES} -o GstEndpointStartState.o GstEndpointStartState.cpp

GstEndpointConnectingState.o: GstEndpointState.h GstEndpointConnectingState.h GstEndpointConnectingState.cpp
	g++ -c ${INCLUDES} ${GST_INCLUDES} -o GstEndpointConnectingState.o GstEndpointConnectingState.cpp

GstEndpointConnectedState.o: GstEndpointState.h GstEndpointConnectedState.h GstEndpointConnectedState.cpp
	g++ -c ${INCLUDES} ${GST_INCLUDES} -o GstEndpointConnectedState.o GstEndpointConnectedState.cpp

GstEndpointEngagingState.o: GstEndpointState.h GstEndpointEngagingState.h GstEndpointEngagingState.cpp
	g++ -c ${INCLUDES} ${GST_INCLUDES} -o GstEndpointEngagingState.o GstEndpointEngagingState.cpp

GstEndpointEngagedState.o: GstEndpointEngagedState.h GstEndpointEngagedState.h GstEndpointEngagedState.cpp
	g++ -c ${INCLUDES} ${GST_INCLUDES} -o GstEndpointEngagedState.o GstEndpointEngagedState.cpp

clean:
	rm -f *.o GstWebRtcAnswerer >/dev/null 2>&1

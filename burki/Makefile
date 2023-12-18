

GstWebRtcAnswerer:	main.o GstWebRtcEndpointHub.o Log.o GstEndpointStartState.o GstEndpointConnectingState.o GstEndpointConnectedState.o GstEndpointEngagingState.o GstEndpointEngagedState.o
	g++ -o GstWebRtcAnswerer main.o GstWebRtcEndpointHub.o Log.o GstEndpointStartState.o GstEndpointConnectingState.o GstEndpointConnectedState.o GstEndpointEngagingState.o GstEndpointEngagedState.o -lpthread `pkg-config --libs glib-2.0 libsoup-2.4 json-glib-1.0 gstreamer-1.0 gstreamer-webrtc-1.0 gstreamer-sdp-1.0 gtk+-3.0`

main.o:	Log.h GstEndpointStartState.h main.cpp
	g++ -c `pkg-config --cflags glib-2.0 libsoup-2.4 json-glib-1.0 gstreamer-1.0 gtk+-3.0` -o main.o main.cpp 

Log.o:	Log.h Log.cpp 
	g++ -c -o Log.o Log.cpp

GstWebRtcEndpointHub.o: 	Log.h GstEndpointState.h GstWebRtcEndpointHub.h GstWebRtcEndpointHub.cpp
	g++ -c `pkg-config --cflags glib-2.0 libsoup-2.4 json-glib-1.0 gstreamer-1.0 gtk+-3.0` -o GstWebRtcEndpointHub.o GstWebRtcEndpointHub.cpp

GstEndpointStartState.o: GstEndpointState.h GstEndpointStartState.h GstEndpointStartState.cpp
	g++ -c `pkg-config --cflags glib-2.0 libsoup-2.4 json-glib-1.0 gstreamer-1.0 gtk+-3.0` -o GstEndpointStartState.o GstEndpointStartState.cpp

GstEndpointConnectingState.o: GstEndpointState.h GstEndpointConnectingState.h GstEndpointConnectingState.cpp
	g++ -c `pkg-config --cflags glib-2.0 libsoup-2.4 json-glib-1.0 gstreamer-1.0 gtk+-3.0` -o GstEndpointConnectingState.o GstEndpointConnectingState.cpp

GstEndpointConnectedState.o: GstEndpointState.h GstEndpointConnectedState.h GstEndpointConnectedState.cpp
	g++ -c `pkg-config --cflags glib-2.0 libsoup-2.4 json-glib-1.0 gstreamer-1.0 gtk+-3.0` -o GstEndpointConnectedState.o GstEndpointConnectedState.cpp

GstEndpointEngagingState.o: GstEndpointState.h GstEndpointEngagingState.h GstEndpointEngagingState.cpp
	g++ -c `pkg-config --cflags glib-2.0 libsoup-2.4 json-glib-1.0 gstreamer-1.0 gtk+-3.0` -o GstEndpointEngagingState.o GstEndpointEngagingState.cpp

GstEndpointEngagedState.o: GstEndpointEngagedState.h GstEndpointEngagedState.h GstEndpointEngagedState.cpp
	g++ -c `pkg-config --cflags glib-2.0 libsoup-2.4 json-glib-1.0 gstreamer-1.0 gtk+-3.0` -o GstEndpointEngagedState.o GstEndpointEngagedState.cpp

clean:
	rm -f *.o GstWebRtcAnswerer >/dev/null 2>&1

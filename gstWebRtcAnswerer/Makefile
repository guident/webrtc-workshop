

INCLUDES=-I/usr/include/libsoup-2.4 -I/usr/include/libxml2 -I/usr/include/json-glib-1.0 -I/usr/include/glib-2.0 -I/usr/lib/aarch64-linux-gnu/glib-2.0/include

GST_INCLUDES=-I/usr/local/gstreamer-1.18.6/include/gstreamer-1.0 -I/usr/include/glib-2.0 -I/usr/lib/aarch64-linux-gnu/glib-2.0/include

LIBS=-lgstreamer-1.0 -lgstsdp-1.0 -lsoup-2.4 -ljson-glib-1.0 -lgio-2.0 -lgobject-2.0 -lglib-2.0

GstWebRtcAnswerer:	main.o GstWebRtcEndpointHub.o Log.o GstEndpointStartState.o GstEndpointConnectingState.o
	g++ -o GstWebRtcAnswerer main.o GstWebRtcEndpointHub.o Log.o GstEndpointStartState.o GstEndpointConnectingState.o -lpthread ${LIBS}

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

clean:
	rm -f *.o GstWebRtcAnswerer >/dev/null 2>&1

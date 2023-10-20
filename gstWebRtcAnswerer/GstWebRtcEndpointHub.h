#pragma once

#include <string>
#include <memory>

#include <glib.h>
#include <glib-unix.h>
#include <gst/gst.h>
#include <libsoup/soup.h>
#include <gst/sdp/sdp.h>

#define GST_USE_UNSTABLE_API
#include <gst/webrtc/webrtc.h>

#define SERVERURL "wss://guident.bluepepper.us:8848"




typedef void (*OSDTYPE)(SoupWebsocketConnection *, gpointer);
typedef void (*OWMTYPE)(SoupWebsocketConnection *, SoupWebsocketDataType, GBytes *, gpointer);
typedef void (*OWPTYPE)(SoupWebsocketConnection *, GBytes *, gpointer);

typedef void (*ONNTYPE)(GstElement *, gpointer);
typedef void (*OICTYPE)(GstElement *, guint, gchar *, gpointer);
typedef void (*OIGSNTYPE)(GstElement *, GParamSpec *, gpointer);
typedef void (*ONTTYPE)(GstElement *, GstWebRTCRTPTransceiver *, gpointer);
typedef void (*OISTYPE)(GstElement *, GstPad *, GstElement *);
typedef void (*ODISTYPE)(GstElement *, GstPad *, GstElement *);



namespace guident {


class GstEndpointState;


class GstWebRtcEndpointHub {

friend class GstEndpointStartState;
friend class GstEndpointConnectingState;
friend class GstEndpointConnectingState;
friend class GstEndpointConnectedState;
friend class GstEndpointEngagingState;
friend class GstEndpointEngagedState;

public:

	~GstWebRtcEndpointHub();

	static GstWebRtcEndpointHub * Instance();

	void onWssServerConnected(SoupSession * conn, GAsyncResult * res, SoupMessage * msg);
	void onWssServerDisconnected(SoupWebsocketConnection * conn, gpointer userData);
	void onWebsocketMessage(SoupWebsocketConnection * conn, SoupWebsocketDataType type, GBytes * message, gpointer userData);
	void onWebsocketPong(SoupWebsocketConnection * conn, GBytes * message, gpointer userData);

	void onClockTick();

	void cancelConnection();
	void closeConnection();
	void resetEverything();

	void init();
	void run();

        void onNegotiationNeeded(GstElement * element, gpointer offerSdpFreeAfterUse);
	void onIceCandidate(GstElement * webrtc, guint mlineindex, gchar * candidate, gpointer userData);
        void onIceGatheringStateNotify(GstElement * webrtc, GParamSpec * pspec, gpointer userData);
        void onNewTransceiver(GstElement * webrtc, GstWebRTCRTPTransceiver * trans, gpointer userData);
        void onIncomingStream(GstElement * webrtc, GstPad * pad, GstElement * pipe);
	void onDecodedIncomingStream(GstElement * decodebin, GstPad * pad, GstElement * pipe);
	void onOfferSet(GstPromise * promise, gpointer userData);
	void onAnswerCreated(GstPromise * promise, gpointer userData);
	void onAnswerSet(GstPromise * promise, gpointer userData);
        void onDataChannel();


private:

	GstWebRtcEndpointHub();

	void connectToServerAsync();

	void sendSdpAnswerThroughWss(const char * sdp);

	void constructWebRtcPipeline();

	void startDroppingSomeFrames();
	void stopDroppingFrames();
	void forceIdrFrame();

	void setTimer(unsigned long seconds);
	void clearTimer();

	void transition(const std::shared_ptr<GstEndpointState> newState);

	static GstWebRtcEndpointHub * __instance;

	std::shared_ptr<GstEndpointState> __state;

	// GLib
	GMainLoop * mainLoop;

	// wss stuff
	SoupWebsocketConnection * websocketConnection;
	SoupSession * preconnectSession;

	// webrtc
	GstElement * pipelineBinElement = NULL;
	std::string engagementOfferSdp;
	bool negotiationDone;

	time_t lastPongReceived;
	time_t connectionAttemptStartedAt;

	guint timerId;
	unsigned long long clockSecondsTicked;
	unsigned long long deadlineTimerTicks;

	bool __initialized;
};

}

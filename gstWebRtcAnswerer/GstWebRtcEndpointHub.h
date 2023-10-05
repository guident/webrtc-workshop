#pragma once

#include <string>
#include <memory>

#include <libsoup/soup.h>

#define SERVERURL "wss://guident.bluepepper.us:8848"



typedef void (*OSDTYPE)(SoupWebsocketConnection *, gpointer);
typedef void (*OWMTYPE)(SoupWebsocketConnection *, SoupWebsocketDataType, GBytes *, gpointer);
typedef void (*OWPTYPE)(SoupWebsocketConnection *, GBytes *, gpointer);



namespace guident {


class GstEndpointState;


class GstWebRtcEndpointHub {

friend class GstEndpointStartState;
friend class GstEndpointConnectingState;

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

	void init();
	void run();


	void onTimeout();

	/*
        void onConnected();

        void onOffer(std::string offerJson);

        void onNegotiationNeeded();

        void onIceGatheringStateNotify();

        void onNewTransceiver();

        void onIncomingStream();

        void onDataChannel();

        void onAnswerAck();

        void onHangup();
	*/

private:

	GstWebRtcEndpointHub();

	void connectToServerAsync();

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

	time_t lastPongReceived;
	time_t connectionAttemptStartedAt;

	guint timerId;
	unsigned long long clockSecondsTicked;
	unsigned long long deadlineTimerTicks;

	bool __initialized;
};

}

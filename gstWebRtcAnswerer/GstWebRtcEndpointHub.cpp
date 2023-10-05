#include <cstdio>
#include <functional>

#include <glib.h>
#include <glib-unix.h>
#include <gst/gst.h>
#include <libsoup/soup.h>


#include "Log.h"
#include "GstEndpointStartState.h"
#include "GstWebRtcEndpointHub.h"


using namespace guident;


GstWebRtcEndpointHub * GstWebRtcEndpointHub::__instance = NULL;


GstWebRtcEndpointHub::GstWebRtcEndpointHub() : __state(new GstEndpointStartState()), mainLoop(NULL), websocketConnection(NULL), preconnectSession(NULL), lastPongReceived(0L), connectionAttemptStartedAt(0L), 
			timerId(0), clockSecondsTicked(0LL), deadlineTimerTicks(0LL), __initialized(false) {
}


GstWebRtcEndpointHub * GstWebRtcEndpointHub::Instance() {
	if ( __instance == NULL ) {
		__instance = new GstWebRtcEndpointHub();
	}
	return(__instance);
}


GstWebRtcEndpointHub::~GstWebRtcEndpointHub() {

}



void GstWebRtcEndpointHub::init() {
	if ( __initialized ) return;
	__state->onEnter();
	__initialized = true;
}


void GstWebRtcEndpointHub::run() {

	Log::Inst().log("GstWebRtcEndpointHub::run(): Instantiating main loop.");
	mainLoop = g_main_loop_new (NULL, FALSE);
        g_assert (mainLoop != NULL);

	Log::Inst().log("GstWebRtcEndpointHub::run(): Starting timer.");
	auto ott = [](void * userData) -> int { GstWebRtcEndpointHub::Instance()->onClockTick(); return(0); };
	timerId = g_timeout_add(1000, ((GSourceFunc)ott), NULL);

	Log::Inst().log("GstWebRtcEndpointHub::run(): Running main loop.");

	g_main_loop_run (mainLoop);
        g_main_loop_unref (mainLoop);
}


void GstWebRtcEndpointHub::connectToServerAsync() {

        SoupLogger *logger;
        SoupMessage *message;
        SoupSession *session;

        lastPongReceived = 0;
        connectionAttemptStartedAt = time(NULL);

        const char *https_aliases[] = { "wss", NULL };

        session = soup_session_new_with_options (SOUP_SESSION_SSL_STRICT, FALSE, 
                SOUP_SESSION_SSL_USE_SYSTEM_CA_FILE, TRUE,
                SOUP_SESSION_HTTPS_ALIASES, https_aliases, NULL);

        logger = soup_logger_new (SOUP_LOGGER_LOG_BODY, -1);
        soup_session_add_feature (session, SOUP_SESSION_FEATURE (logger));
        g_object_unref (logger);

        message = soup_message_new(SOUP_METHOD_GET, SERVERURL);

	Log::Inst().log("GstWebRtcEndpontHub::connectToServerAsync(): Starting WSS connection attempt to server URL: <<%08X>>.", session);

        preconnectSession = session;

	//auto owsc = [](SoupSession * conn, GAsyncResult * res, SoupMessage * msg) { GstWebRtcEndpointHub::Instance()->onWssServerConnected(conn, res, msg); };
	auto owsc = [](GObject * conn, GAsyncResult * res, gpointer msg) { GstWebRtcEndpointHub::Instance()->onWssServerConnected((SoupSession *)conn, res, (SoupMessage *)msg); };
        soup_session_websocket_connect_async (session, message, NULL, NULL, NULL, (GAsyncReadyCallback)owsc, message);

}


void GstWebRtcEndpointHub::closeConnection() {
	Log::Inst().log("GstWebRtcEndpointHub::closeConnection(): Closing connection to server.");
        if ( websocketConnection != NULL ) {
                soup_websocket_connection_close (websocketConnection, 1000, "");
        }
}


void GstWebRtcEndpointHub::cancelConnection() {
	Log::Inst().log("GstWebRtcEndpointHub::cancelConnection(): Cancelling connection attempt to server.");
        if ( preconnectSession != NULL ) {
                soup_session_abort(preconnectSession);
                preconnectSession = NULL;
        }
}




void GstWebRtcEndpointHub::onWssServerConnected(SoupSession * session, GAsyncResult * res, SoupMessage * msg) {

	GError *error = NULL;

	Log::Inst().log("GstWebRtcEndpointHub::onWssServerConnected(): Async Connection attempt finished. <<%08X>>, Attempting WSS exchange.", session);

        websocketConnection = soup_session_websocket_connect_finish (session, res, &error);
        preconnectSession = NULL;

        if (error) {
		Log::Inst().log("GstWebRtcEndpointHub::onWssServerConnected(): WSS exchange failed. Disconnecting from server.");
                g_error_free (error);
                if ( websocketConnection ) {
                        g_object_unref(websocketConnection);
                }
                websocketConnection = NULL;
                this->__state->onDisconnected();
                return;
        }

        g_assert_nonnull (websocketConnection);

	Log::Inst().log("GstWebRtcEndpointHub::onWssServerConnected(): WSS exchange is complete, connection is up, signalling server connection is ready.");

        soup_websocket_connection_set_keepalive_interval(websocketConnection, 10);

	auto osd = [](SoupWebsocketConnection * conn, gpointer userData){ GstWebRtcEndpointHub::Instance()->onWssServerDisconnected(conn, userData); };
        g_signal_connect (websocketConnection, "closed", G_CALLBACK((OSDTYPE)osd), NULL);
	auto owm = [](SoupWebsocketConnection * conn, SoupWebsocketDataType type, GBytes * msg, gpointer userData){ GstWebRtcEndpointHub::Instance()->onWebsocketMessage(conn, type, msg, userData); };
        g_signal_connect (websocketConnection, "message", G_CALLBACK((OWMTYPE)owm), NULL);
	auto owp = [](SoupWebsocketConnection * conn, GBytes * msg, gpointer userData){ GstWebRtcEndpointHub::Instance()->onWebsocketPong(conn, msg, userData); };
        g_signal_connect (websocketConnection, "pong", G_CALLBACK((OWPTYPE)owp), NULL);

	Log::Inst().log("GstWebRtcEndpointHub::onWssServerConnected(): Callbacks are connnected to signals.");

	this->__state->onConnected();

}




void GstWebRtcEndpointHub::onWssServerDisconnected(SoupWebsocketConnection * conn, gpointer userData) {
	Log::Inst().log("GstWebRtcEndpontHub::onWssServerDisconnected(): WSS connection is disconnected!");
	if ( websocketConnection ) {
		g_object_unref(websocketConnection);
	}
	websocketConnection = NULL;
	this->__state->onDisconnected();
	return;
}



void GstWebRtcEndpointHub::onWebsocketMessage(SoupWebsocketConnection * conn, SoupWebsocketDataType type, GBytes * message, gpointer userData) {
	Log::Inst().log("GstWebRtcEndpointHub::onWebsocketMessage(): GOT A MESSAGE!!!!");

	gchar * text = NULL;

        switch (type) {

        case SOUP_WEBSOCKET_DATA_BINARY:
		Log::Inst().log("GstWebRtcEndpointHub::onWebsocketMessage(): Binary message has arrived from the server?! Ignoring.");
                return;

        case SOUP_WEBSOCKET_DATA_TEXT:{
                gsize size;
                const gchar *data = (gchar *)g_bytes_get_data (message, &size);
                /* Convert to NULL-terminated string */
                text = g_strndup (data, size);
                break;
        }

        default:
                g_assert_not_reached ();
        }


	if ( text != NULL ) Log::Inst().log("GstWebRtcEndpointHub::onWebsocketMessage(): Message from server: <<%s>>.\n", text);
	g_free(text);
}



void GstWebRtcEndpointHub::onWebsocketPong(SoupWebsocketConnection * conn, GBytes * message, gpointer userData) {
	Log::Inst().log("GstWebRtcEndpointHub::onWebsocketPong(): GOT A PONG!!!!");
        lastPongReceived = time(NULL);
}




void GstWebRtcEndpointHub::onClockTick() {
	Log::Inst().log("GstWebRtcEndpointHub::onClockTick(): clock ticked!");
	if ( timerId > 0 ) {
                g_source_remove(timerId);
        }
        timerId = 0;
	clockSecondsTicked++;
	if ( deadlineTimerTicks > 0LL && deadlineTimerTicks <= clockSecondsTicked ) {
		deadlineTimerTicks = 0LL;
		this->__state->onTimeout();
	}
	auto ott = [](void * userData) -> int { GstWebRtcEndpointHub::Instance()->onClockTick(); return(0); };
        timerId = g_timeout_add(1000, (GSourceFunc)ott, NULL);
}




void GstWebRtcEndpointHub::transition(const std::shared_ptr<GstEndpointState> newState) {
	Log::Inst().log("GstWebRtcEndpointHub::transition(): Transitionng from state <<%s>> to state <<%s>>.", __state->getStateName(), newState->getStateName());
	__state->onExit();
	__state = newState;
	__state->onEnter();
}



void GstWebRtcEndpointHub::setTimer(unsigned long seconds) {
	if ( seconds == 0L || seconds > 300 ) {
		Log::Inst().log("GstWebRtcEndpointHub::setTimer(): Oops bad vale for setting timer: <<%lu>>.", seconds);
		return;
	}
	if ( deadlineTimerTicks != 0LL ) {
		Log::Inst().log("GstWebRtcEndpointHub::setTimer(): Warning! Timer was already set!!");
	}	
	deadlineTimerTicks = clockSecondsTicked + seconds;
}



void GstWebRtcEndpointHub::clearTimer() {
	deadlineTimerTicks = 0LL;
}

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
			timerId(0), clockSecondsTicked(0LL), deadlineTimerTicks(0LL), __initialized(false), pipelineBinElement(NULL), negotiationDone(false), firstAnswerHasBeenSent(false), __audioIsTurnedOn(false) {
}


GstWebRtcEndpointHub * GstWebRtcEndpointHub::Instance() {
	if ( __instance == NULL ) {
		__instance = new GstWebRtcEndpointHub();
	}
	return(__instance);
}


GstWebRtcEndpointHub::~GstWebRtcEndpointHub() {
	if ( pipelineBinElement != NULL ) {
		gst_object_unref(pipelineBinElement);
		pipelineBinElement = NULL;
	}
}



void GstWebRtcEndpointHub::init() {
	if ( __initialized ) return;
	__state->onEnter();
	__initialized = true;
	gst_init (NULL, NULL);
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
	websocketConnection = NULL;
}


void GstWebRtcEndpointHub::cancelConnection() {
	Log::Inst().log("GstWebRtcEndpointHub::cancelConnection(): Cancelling connection attempt to server.");
        if ( preconnectSession != NULL ) {
                soup_session_abort(preconnectSession);
                preconnectSession = NULL;
        }
}



void GstWebRtcEndpointHub::resetEverything() {

	if ( pipelineBinElement != NULL ) {
		gst_element_set_state (GST_ELEMENT (pipelineBinElement), GST_STATE_PAUSED);
		g_clear_object(&pipelineBinElement);
		g_object_unref(pipelineBinElement);
		pipelineBinElement = NULL;
	}
        Log::Inst().log("GstWebRtcEndpointHub::resetEverything(): Pipeline has been reset.");

	GstWebRtcEndpointHub::Instance()->closeConnection();

        Log::Inst().log("GstWebRtcEndpointHub::resetEverything(): Closing WSS connection.");

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

        switch (type) {

        case SOUP_WEBSOCKET_DATA_BINARY:
		Log::Inst().log("GstWebRtcEndpointHub::onWebsocketMessage(): Binary message has arrived from the server?! Ignoring.");
                return;

        case SOUP_WEBSOCKET_DATA_TEXT:{
                gsize size;
                const gchar *data = (gchar *)g_bytes_get_data (message, &size);
                /* Convert to NULL-terminated string */
		gchar * offer = g_strndup(data, size);
		if ( size > 50 ) {
			engagementOfferSdp = std::string(offer);
			Log::Inst().log("GstWebRtcEndpointHub::onWebsocketMessage(): Got a message, starts with: <<%s>>. Looks like an offer, going to construct the pipeline.", engagementOfferSdp.substr(0, 20).c_str());
			this->__state->onOfferReceived();
		} else {
			Log::Inst().log("GstWebRtcEndpointHub::onWebsocketMessage(): Oops, this doesn't look like an SDP OFFER, starts with: <<%s>>.", engagementOfferSdp.substr(0, 20).c_str());
		}
                break;
        }

        default:
                g_assert_not_reached ();
        }
}




void GstWebRtcEndpointHub::sendSdpAnswerThroughWss(const char * sdp) {

	if ( sdp == NULL || strlen(sdp) < 20 ) return;

	Log::Inst().log("GstWebRtcEndpointHub::sendSdpAnswerThroughWss(): Sending SDP answer message.");

	soup_websocket_connection_send_text(websocketConnection, sdp);
}









void GstWebRtcEndpointHub::onWebsocketPong(SoupWebsocketConnection * conn, GBytes * message, gpointer userData) {
	Log::Inst().log("GstWebRtcEndpointHub::onWebsocketPong(): GOT A PONG!!!!");
        lastPongReceived = time(NULL);
}




void GstWebRtcEndpointHub::onClockTick() {
	//Log::Inst().log("GstWebRtcEndpointHub::onClockTick(): clock ticked!");
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





void GstWebRtcEndpointHub::onNegotiationNeeded(GstElement * webrtc, gpointer offerSdpFreeAfterUse) {

	Log::Inst().log("GstWebRtcEndpointHub::onNegotiationNeeded(): Pipeline has signalled need to exchange SDP offer/answer.");

        if ( negotiationDone ) {
                Log::Inst().log("GstWebRtcEndpointHub::onNegotiationNeeded(): Has already been done, Exiting.");
                return;
        }
        negotiationDone = TRUE;

        GstSDPMessage *sdp = NULL;

        GstSDPResult ret = gst_sdp_message_new (&sdp);
        g_assert_cmphex (ret, ==, GST_SDP_OK);
        ret = gst_sdp_message_parse_buffer ((guint8 *) offerSdpFreeAfterUse, strlen ((const char *)offerSdpFreeAfterUse), sdp);
        g_assert_cmphex (ret, ==, GST_SDP_OK);

	// AA: DELETE
	gchar *sdp_str = gst_sdp_message_as_text(sdp);
    	if (sdp_str) {
        	Log::Inst().log("GstWebRtcEndpointHub::onNegotiationNeeded(): Received SDP offer:\n%s", sdp_str);
        	g_free(sdp_str);
    	} else {
        	Log::Inst().log("GstWebRtcEndpointHub::onNegotiationNeeded(): Failed to convert SDP message to text.");
    	}
        
	g_free(offerSdpFreeAfterUse);

        GstWebRTCSessionDescription *offer = NULL;
        GstPromise * promise = NULL;

        offer = gst_webrtc_session_description_new (GST_WEBRTC_SDP_TYPE_OFFER, sdp);
        g_assert_nonnull (offer);

        Log::Inst().log("GstWebRtcEndpointHub::onNegotiationNeeded(): Setting received offer SDP with promise \"onOfferSet\" for when it's done.");

        /* Set remote description on our pipeline */
        {
		auto oos = [](GstPromise * p, gpointer data){ GstWebRtcEndpointHub::Instance()->onOfferSet(p, data); };
                promise = gst_promise_new_with_change_func((GstPromiseChangeFunc)oos, webrtc, NULL);
                g_signal_emit_by_name (webrtc, "set-remote-description", offer, promise);
        }
        gst_webrtc_session_description_free (offer);

}




void GstWebRtcEndpointHub::onOfferSet(GstPromise * promise, gpointer userData) {

        Log::Inst().log("GstWebRtcEndpointHub::onOfferSet(): Remote offer has been set.");

	//const GstStructure * reply = gst_promise_get_reply(promise);
	//char * mike = gst_structure_to_string(reply);
	//Log::Inst().log("GstWebRtcEndpointHub::onOfferSet(): <<%s>>.", mike);

        gst_promise_unref (promise);

	GstElement * webrtc = (GstElement *)userData;

	if ( webrtc == NULL ) {
		Log::Inst().log("GstWebRtcEndpointHub::onAnswerCreated(): Ooops, erro retrieving webrtc element.");
		return;
	}

        Log::Inst().log("GstWebRtcEndpointHub::onOfferSet(): Creating answer SDP with promise \"onAnswerCreated\" for when it's done.");

	auto oac = [](GstPromise * p, gpointer data){ GstWebRtcEndpointHub::Instance()->onAnswerCreated(p, data); };
        GstPromise * newPromise = gst_promise_new_with_change_func ((GstPromiseChangeFunc)oac, webrtc, NULL);
        g_signal_emit_by_name (webrtc, "create-answer", NULL, newPromise);

}




/* Answer created by our pipeline, to be sent to the peer */
void GstWebRtcEndpointHub::onAnswerCreated (GstPromise * promise, gpointer userData) {

        Log::Inst().log("GstWebRtcEndpointHub::onAnswerCreated(): Answer has been created.");

        GstWebRTCSessionDescription * answer = NULL;
        const GstStructure *reply;

	GstElement * webrtc = (GstElement *)userData;

	if ( webrtc == NULL ) {
		Log::Inst().log("GstWebRtcEndpointHub::onAnswerCreated(): Ooops, error retrieving webrtc element.");
		return;
	}

        g_assert_cmphex (gst_promise_wait (promise), ==, GST_PROMISE_RESULT_REPLIED);
        reply = gst_promise_get_reply (promise);
        gst_structure_get (reply, "answer", GST_TYPE_WEBRTC_SESSION_DESCRIPTION, &answer, NULL);
        gst_promise_unref (promise);

        Log::Inst().log("GstWebRtcEndpointHub::onAnswerCreated(): Setting answer SDP with promise \"onAnswerSet\" for when it's done.");

        //promise = gst_promise_new ();
	auto oas = [](GstPromise * p, gpointer data){ GstWebRtcEndpointHub::Instance()->onAnswerSet(p, data); };
        GstPromise * newPromise = gst_promise_new_with_change_func((GstPromiseChangeFunc)oas, webrtc, NULL);
        g_signal_emit_by_name (webrtc, "set-local-description", answer, newPromise);
        //gst_promise_interrupt (promise);
        //gst_promise_unref (promise);

        gst_webrtc_session_description_free (answer);
}


void GstWebRtcEndpointHub::onAnswerSet(GstPromise * promise, gpointer userData) {


        Log::Inst().log("GstWebRtcEndpointHub::onAnswerSet(): Answer SDP has been set.");
        gst_promise_unref (promise);

	//GstWebRTCSessionDescription * answer = (GstWebRTCSessionDescription *)userData;
	GstWebRTCSessionDescription * answer = NULL;

	if ( firstAnswerHasBeenSent ) {
        	Log::Inst().log("GstWebRtcEndpointHub::onAnswerSet(): This is a renegotiation.");
		
                g_object_get(this->webrtcElement, "local-description", &answer, NULL);

		char buffer[10000];
		memset(buffer, 0, 10000);

		if ( answer->sdp == NULL ) {
			printf("Oops NULL!!!!\n");
		} else {
			printf("copying answer into buffer... %lu\n", strlen(gst_sdp_message_as_text(answer->sdp)));
			strncpy(buffer, gst_sdp_message_as_text(answer->sdp), 9999);
		}

                sendSdpAnswerThroughWss((const char *)buffer);
	}

        gst_webrtc_session_description_free (answer);

}






void GstWebRtcEndpointHub::onStreamStatusMessage(GstBus * bus, GstMessage * msg, gpointer userData) {

	GstStreamStatusType type;
	GstElement *owner;
	const GValue *val;
	//GstTask *task = NULL;

	gst_message_parse_stream_status (msg, &type, &owner);

	//val = gst_message_get_stream_status_object (message);

	/* see if we know how to deal with this object */
	/*
	if (G_VALUE_TYPE (val) == GST_TYPE_TASK) {
		task = g_value_get_object (val);
	}
	*/


	if ( owner != NULL ) {
		gchar * name = NULL;
		name = gst_element_get_name(owner);
		Log::Inst().log("GstWebRtcEndpointHub::onStreamStatusMessage(): Got a stream status message from <<%s>>, Type: <<%d>>", name ? name : "HUH", type);
		g_free(name);
	} else {
		Log::Inst().log("GstWebRtcEndpointHub::onStreamStatusMessage(): Oops!!!");
	}
}


void GstWebRtcEndpointHub::onErrorMessage(GstBus * bus, GstMessage * msg, gpointer userData) {

	Log::Inst().log("GstWebRtcEndpointHub::onErrorMessage(): ERROR!!");

	if ( GST_MESSAGE_TYPE(msg) == GST_MESSAGE_ERROR ) {

		GError * err = NULL;
		gchar * debugInfo = NULL;

		gst_message_parse_error(msg, &err, &debugInfo);

		Log::Inst().log("GstWebRtcEndpointHub::onErrorMessage(): Error <<%s>> from <<%s>>, Debug info: <<%s>>.", err->message, GST_OBJECT_NAME(msg->src), debugInfo ? debugInfo : "NO DEBUG INFO");

		g_error_free(err);
		g_free(debugInfo);

	} else {
		Log::Inst().log("GstWebRtcEndpointHub::onErrorMessage(): Oops, this should not happen!!");
	}

}


void GstWebRtcEndpointHub::onEndOfStreamMessage(GstBus * bus, GstMessage * msg, gpointer userData) {

	Log::Inst().log("GstWebRtcEndpointHub::onEndOfStreamMessage(): Got an end-of-stream  message. ");

}


void GstWebRtcEndpointHub::onPipelineStateChange(GstBus * bus, GstMessage * msg, gpointer userData) {

	if ( msg->type == GST_MESSAGE_ASYNC_DONE ) {
		Log::Inst().log("GstWebRtcEndpointHub::onPipelineStateChange(): Got an pipeline ASYNC DONE statechange message.");
	} else  {
		Log::Inst().log("GstWebRtcEndpointHub::onPipelineStateChange(): Got some other pipeline statechange message.");
	}

}









//static void GstWebRtcEndpointHub::onIceCandidate(GstElement * webrtc G_GNUC_UNUSED, guint mlineindex, gchar * candidate, gpointer userData G_GNUC_UNUSED) {
void GstWebRtcEndpointHub::onIceCandidate(GstElement * webrtc, guint mlineindex, gchar * candidate, gpointer userData) {
	Log::Inst().log("GstWebRtcEndpointHub::onIceCandidate(): Returned. Index: <<%d>> Candidate: <<%s>>", mlineindex, candidate ? candidate : "NULL");
}




void GstWebRtcEndpointHub::onIceGatheringStateNotify(GstElement * webrtc, GParamSpec * pspec, gpointer userData) {

	Log::Inst().log("GstWebRtcEndpointHub::onIceGatheringStateNotify(): OK!");

	GstWebRTCICEGatheringState ice_gather_state;
	const gchar *new_state = "unknown";

        g_object_get (webrtc, "ice-gathering-state", &ice_gather_state, NULL);

        switch ( ice_gather_state ) {

                case GST_WEBRTC_ICE_GATHERING_STATE_NEW:
                        new_state = "new";
                        Log::Inst().log("GstWebRtcEndpointHub::onIceGatheringStateNotify(): Ice gathering state changed to new state: \"%s\".", new_state);
                        break;

                case GST_WEBRTC_ICE_GATHERING_STATE_GATHERING:
                        Log::Inst().log("GstWebRtcEndpointHub::onIceGatheringStateNotify(): Ice gathering state changed to new state: \"%s\".", new_state);
                        new_state = "gathering";
                        break;

                case GST_WEBRTC_ICE_GATHERING_STATE_COMPLETE:
                        new_state = "complete";
                        Log::Inst().log("GstWebRtcEndpointHub::onIceGatheringStateNotify(): Ice gathering is complete. Will now construct ANSWER message and send it.");
                        {
                                GstWebRTCSessionDescription *answer = NULL;
                                g_object_get(webrtc, "local-description", &answer, NULL);

                                if ( answer != NULL ) {
					char sdpAnswerBuffer[5000];
					memset(sdpAnswerBuffer, 0, 5000);
                                        strncpy(sdpAnswerBuffer, gst_sdp_message_as_text(answer->sdp), 4999);
                                        sendSdpAnswerThroughWss((const char *)sdpAnswerBuffer);
					firstAnswerHasBeenSent = true;

                                        gst_webrtc_session_description_free (answer);

					this->__state->onEngaged();

                                } else {
                                        Log::Inst().log("GstWebRtcEndpointHub::onIceGatheringStateNotify(): Ice gathering is complete, but oops, answer SDP cannot be retrieved.");
                                }

                        }
                        break;

                default:
                        g_assert_not_reached ();
                        break;
        }

}


void GstWebRtcEndpointHub::onNewTransceiver(GstElement * webrtc, GstWebRTCRTPTransceiver * trans, gpointer userData) {
	Log::Inst().log("GstWebRtcEndpointHub::onNewTransceiver(): A new transceiver has been created. <<%d>>", trans ? trans->mline : -1);
}



void GstWebRtcEndpointHub::onIncomingStream(GstElement * webrtc, GstPad * pad, GstElement * pipe) {

	Log::Inst().log("GstWebRtcEndpointHub::onIncomingStream(): A pad has been added to the webrtcbin module for an incoming RTP stream.");

        if (GST_PAD_DIRECTION (pad) != GST_PAD_SRC) {
		Log::Inst().log("GstWebRtcEndpointHub::onIncomingStream(): Huh?. This should not happen.");
                return;
        }

        GstElement * decodebin = NULL;
        GstPad * sinkpad = NULL;

        decodebin = gst_element_factory_make ("decodebin", NULL);
	auto odis = [](GstElement * decodebin, GstPad * pad, GstElement * pipe){ GstWebRtcEndpointHub::Instance()->onDecodedIncomingStream(decodebin, pad, pipe); };
        g_signal_connect (decodebin, "pad-added", G_CALLBACK((ODISTYPE)odis), pipe);
        gst_bin_add(GST_BIN (pipe), decodebin);
        gst_element_sync_state_with_parent (decodebin);

        sinkpad = gst_element_get_static_pad (decodebin, "sink");
        gst_pad_link (pad, sinkpad);
        gst_object_unref (sinkpad);

	Log::Inst().log("GstWebRtcEndpointHub::onIncomingStream(): Linking pad to \"decodebin\" sink.");
}



void GstWebRtcEndpointHub::onDecodedIncomingStream(GstElement * decodebin, GstPad * pad, GstElement * pipe) {

	Log::Inst().log("GstWebRtcEndpointHub::onDecodedIncomingStream(): A pad has been added to the decodebin module for a decoded media stream.");

        if (GST_PAD_DIRECTION (pad) != GST_PAD_SRC) {
		Log::Inst().log("GstWebRtcEndpointHub::onDecodedIncomingStream(): Huh?. This should not happen.");
                return;
        }

        GstCaps *caps;
        const gchar *name;
        GstElement * fake = NULL;
        GstPad * sinkpad = NULL;

        GstPad *qpad;
        GstElement *q, *conv, *resample, *sink;
        GstPadLinkReturn ret;

        if (!gst_pad_has_current_caps(pad)) {
		Log::Inst().log("GstWebRtcEndpointHub::onDecodedIncomingStream(): Pad '%s' has no caps, can't do anything, ignoring.", GST_PAD_NAME (pad));
                return;
        }

        caps = gst_pad_get_current_caps (pad);
        name = gst_structure_get_name (gst_caps_get_structure (caps, 0));

	fake = gst_element_factory_make("fakesink", NULL);

	if ( fake != NULL ) {

		gst_bin_add (GST_BIN (pipe), fake);
		gst_element_sync_state_with_parent(fake);

		sinkpad = gst_element_get_static_pad (fake, "sink");

		if ( sinkpad != NULL ) {
			gst_pad_link (pad, sinkpad);
			gst_object_unref (sinkpad);

			Log::Inst().log("GstWebRtcEndpointHub::onDecodedIncomingStream(): New pad was linked to a \"fakesink\".");

		} else {

			Log::Inst().log("GstWebRtcEndpointHub::onDecodedIncomingStream(): Oops, couldnt retireve the \"fakesink\" sink pad.");

		}
	} else {
		Log::Inst().log("GstWebRtcEndpointHub::onDecodedIncomingStream(): Oops, error on gst_element_factory_create(fakesink, NULL).");
	}
}



void GstWebRtcEndpointHub::constructWebRtcPipeline() {

	GstStateChangeReturn ret;
        GError *error = NULL;

/*
#define STUN_SERVER " stun-server=stun://stun.l.google.com:19302 "
#define RTP_CAPS_OPUS "application/x-rtp,media=audio,encoding-name=OPUS,payload="
#define RTP_CAPS_VP8 "application/x-rtp,media=video,encoding-name=VP8,payload="
#define RTP_CAPS_VP9 "application/x-rtp,media=video,encoding-name=VP9,payload="
#define RTP_CAPS_H264 "application/x-rtp,media=video,encoding-name=H264,payload="
*/

#define RTP_CAPS_OPUS "application/x-rtp,media=audio,encoding-name=OPUS,payload=111"
#define RTP_CAPS_VP8 "application/x-rtp,media=video,encoding-name=VP8,payload=96"	
#define RTP_CAPS_VP9 "application/x-rtp,media=video,encoding-name=VP9,payload=98"
#define RTP_CAPS_H264 "application/x-rtp,media=video,encoding-name=H264,payload=104"
#define CAMERA_SERIAL_NUMBER "11120627"



         // VP9
	pipelineBinElement = gst_parse_launch ("webrtcbin bundle-policy=2 name=webrtcElement " 
                "audiotestsrc is-live=true wave=red-noise volume=0.1 ! audioconvert ! audioresample ! queue ! opusenc ! rtpopuspay ! "
                "queue ! capsfilter caps=" RTP_CAPS_OPUS " name=\"capsFilterBeforeWebRtcBin\" ! webrtcElement. "
		"tcambin name=cameraElement serial=\"" CAMERA_SERIAL_NUMBER "\" device-caps=\"video/x-bayer(memory:NVMM),format=pwl-rggb16H12,width=1920,height=1200,framerate=30/1\" conversion-element=3 ! "
		" video/x-raw(memory:NVMM),format=(string)NV12,width=(int)1920,height=(int)1200,framerate=(fraction)30/1 ! nvvidconv ! "
		" video/x-raw(memory:NVMM),format=(string)NV12,width=(int)1920,height=(int)1080,framerate=(fraction)30/1 ! "
		" nvv4l2vp9enc name=encoder iframeinterval=150 idrinterval=384 ! rtpvp9pay mtu=1300 pt=98 name=vp9payloader ! "
		" " RTP_CAPS_VP9 " ! webrtcElement. ", &error);
        



	if (error || (pipelineBinElement == NULL)) {
		Log::Inst().log("GstWebRtcEndpointHub::constructWebRtcPipeline(): Error on gst_parse_launch(). Returning unsuccessful.<<%s>>\n", error->message);
		g_error_free (error);
		if ( pipelineBinElement != NULL ) { 
			g_clear_object(&pipelineBinElement);
			g_object_unref(pipelineBinElement);
		}
		return;
	}

	//GstElement * webrtcElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "webrtcElement");
	webrtcElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "webrtcElement");
        g_assert_nonnull (webrtcElement);

        /* This is the gstwebrtc entry point where we create the offer and so on. It
        * will be called when the pipeline goes to PLAYING. */

        gchar * offerSdpCopy = NULL;
        offerSdpCopy = g_strndup(engagementOfferSdp.c_str(), engagementOfferSdp.size());
	auto onn = [](GstElement * webrtc, gpointer userData){ GstWebRtcEndpointHub::Instance()->onNegotiationNeeded(webrtc, userData); };
        g_signal_connect(webrtcElement, "on-negotiation-needed", G_CALLBACK((ONNTYPE)onn), offerSdpCopy);

        /* We need to transmit this ICE candidate to the browser via the websockets
        * signalling server. Incoming ice candidates from the browser need to be
        * added by us too, see on_server_message() */

	auto oic = [](GstElement * webrtc, guint mlineIndex, gchar * candidate, gpointer userData){ GstWebRtcEndpointHub::Instance()->onIceCandidate(webrtc, mlineIndex, candidate, userData); };
        g_signal_connect (webrtcElement, "on-ice-candidate", G_CALLBACK((OICTYPE)oic), NULL);
	auto oigsn = [](GstElement * webrtc, GParamSpec * pspec, gpointer userData){ GstWebRtcEndpointHub::Instance()->onIceGatheringStateNotify(webrtc, pspec, userData); };
        g_signal_connect (webrtcElement, "notify::ice-gathering-state",  G_CALLBACK((OIGSNTYPE)oigsn), NULL);
	auto ont = [](GstElement * webrtc, GstWebRTCRTPTransceiver * trans, gpointer userData){ GstWebRtcEndpointHub::Instance()->onNewTransceiver(webrtc, trans, userData); };
        g_signal_connect (webrtcElement, "on-new-transceiver",  G_CALLBACK((ONTTYPE)ont), NULL);

        gst_element_set_state (pipelineBinElement, GST_STATE_READY);

	Log::Inst().log("GstWebRtcEndpointHub::constructWebRtcPipeline(): Gstreamer pipeline constructed and set to READY state and all signals connected to callbacks.");

	GArray *transceivers = NULL;
	GstWebRTCRTPTransceiver *trans = NULL;
	g_signal_emit_by_name (webrtcElement, "get-transceivers", &transceivers);
	int I;
        for ( I = 0; I < transceivers->len; I++ ) {
		trans = g_array_index (transceivers, GstWebRTCRTPTransceiver *, I);
		if ( trans->mline == 1 ) {
			GstCaps * caps;
			
			/*
			caps = gst_caps_from_string(
        "application/x-rtp,media=video,encoding-name=VP8,clock-rate=90000;"
        "application/x-rtp,media=video,encoding-name=red,clock-rate=90000;"
        "application/x-rtp,media=video,encoding-name=ulpfec,clock-rate=90000"
    );
    			*/

			//caps = gst_caps_from_string ("application/x-rtp,media=video,encoding-name=VP9,clock-rate=90000");
			caps = gst_caps_from_string ("application/x-rtp,media=video,encoding-name=VP9,payload=98,clock-rate=90000");
			//caps = gst_caps_from_string ("application/x-rtp,media=video,encoding-name=H264,payload=104,clock-rate=90000,packetization-mode=(string)0,profile-level-id=(string)42001f");
			trans->codec_preferences = gst_caps_ref(caps);
			gst_caps_unref(caps);
			/*
			g_object_set(trans,
    				"fec-type", GST_WEBRTC_FEC_TYPE_ULP_RED,
    				"fec-percentage", 10,
    				"do-nack", FALSE,
    				NULL);
				*/
			//g_object_set(trans, "fec-type", GST_WEBRTC_FEC_TYPE_ULP_RED, "fec-percentage", 10, "do-nack", FALSE, NULL);
			//g_object_set(trans, "do-nack", FALSE, NULL);
			//trans->do_nack = FALSE;
			//trans->fec_type = GST_WEBRTC_FEC_TYPE_ULP_RED;
		} else if ( trans->mline == 0 ) {
			GstCaps * caps;
			caps = gst_caps_from_string ("application/x-rtp,media=audio,payload=111,clock-rate=48000,encoding-name=OPUS,encoding-params=(string)2,minptime=(string)10,useinbandfec=(string)1,rtcp-fb-transport-cc=true");
			trans->codec_preferences = gst_caps_ref(caps);
			gst_caps_unref(caps);
		}
		Log::Inst().log("GstWebRtcEndpointHub::constructWebRtcPipeline(): Transceiver: <<%d>>, Directon: <<%d>>, MLine: <<%d>>, Codecs: <<%s>>.", I, trans->direction, trans->mline, gst_caps_to_string(trans->codec_preferences));
        }


	/* Incoming streams will be exposed via this signal */

	auto ois = [](GstElement * webrtc, GstPad * pad, GstElement * pipe){ GstWebRtcEndpointHub::Instance()->onIncomingStream(webrtc, pad, pipe); };
        g_signal_connect (webrtcElement, "pad-added", G_CALLBACK((OISTYPE)ois), pipelineBinElement);

        /* Lifetime is the same as the pipeline itself */
        gst_object_unref (webrtcElement);


	// bus messages

	/* get the bus, we need to install a sync handler */
	GstBus * pipelineBus = gst_pipeline_get_bus (GST_PIPELINE (pipelineBinElement));
	gst_bus_enable_sync_message_emission (pipelineBus);
	gst_bus_add_signal_watch (pipelineBus);

	auto ossm = [](GstBus * bus, GstMessage * msg,  gpointer ptr){ GstWebRtcEndpointHub::Instance()->onStreamStatusMessage(bus, msg, ptr); };
        g_signal_connect(pipelineBus, "sync-message::stream-status", G_CALLBACK((OSSMTYPE)ossm), NULL);

	auto oem = [](GstBus * bus, GstMessage * msg,  gpointer ptr){ GstWebRtcEndpointHub::Instance()->onErrorMessage(bus, msg, ptr); };
        g_signal_connect(pipelineBus, "message::error", G_CALLBACK((OEMTYPE)oem), NULL);

	auto oeosm = [](GstBus * bus, GstMessage * msg,  gpointer ptr){ GstWebRtcEndpointHub::Instance()->onEndOfStreamMessage(bus, msg, ptr); };
        g_signal_connect(pipelineBus, "message::eos", G_CALLBACK((OEOSMTYPE)oeosm), NULL);

	auto opsc = [](GstBus * bus, GstMessage * msg,  gpointer ptr){ GstWebRtcEndpointHub::Instance()->onPipelineStateChange(bus, msg, ptr); };
        g_signal_connect(pipelineBus, "message::state-change", G_CALLBACK((OPSCTYPE)opsc), NULL);


	Log::Inst().log("GstWebRtcEndpintHub::constructWebRtcPipeline(): Attempting to set pipeline to \"PLAYING\" state.");
        ret = gst_element_set_state (GST_ELEMENT (pipelineBinElement), GST_STATE_PLAYING);
        if ( ret == GST_STATE_CHANGE_FAILURE ) {
                if (pipelineBinElement) {
			g_clear_object(&pipelineBinElement);
			g_object_unref(pipelineBinElement);
			pipelineBinElement = NULL;
		}
		Log::Inst().log("GstWebRtcEndpointHub::constructWebRtcPipeline(): Error on gst_element_set_state(). Unable to switch pipeline to \"PLAYING\" state. Returning unsuccessful.");
                return;
        }
	Log::Inst().log("GstWebRtcEndpointHub::constructWebRtcPipeline(): Pipeline has been set to \"PLAYING\" state. <<%d>>", ret);


	__audioIsTurnedOn = true;

	return;
}



void GstWebRtcEndpointHub::replaceOfferForRenegotiation() {

	Log::Inst().log("GstWebRtcEndpointHub::replaceOfferForRenegotiation(): Setting up the new offer.");

        GstSDPMessage *sdp = NULL;

        GstSDPResult ret = gst_sdp_message_new (&sdp);
        g_assert_cmphex (ret, ==, GST_SDP_OK);
        ret = gst_sdp_message_parse_buffer ((guint8 *) engagementOfferSdp.c_str(), engagementOfferSdp.size(), sdp);
        g_assert_cmphex (ret, ==, GST_SDP_OK);

	// AA: DELETE
	gchar *sdp_str = gst_sdp_message_as_text(sdp);
    	if (sdp_str) {
        	Log::Inst().log("GstWebRtcEndpointHub::replaceOfferForRenegotiation(): Received SDP offer:\n%s", sdp_str);
        	g_free(sdp_str);
    	} else {
        	Log::Inst().log("GstWebRtcEndpointHub::onNegotiationNeeded(): Failed to convert SDP message to text.");
    	}
        
        GstWebRTCSessionDescription *offer = NULL;
        GstPromise * promise = NULL;

        offer = gst_webrtc_session_description_new (GST_WEBRTC_SDP_TYPE_OFFER, sdp);
        g_assert_nonnull (offer);

        Log::Inst().log("GstWebRtcEndpointHub::replaceOfferForRenegotiation(): Setting received offer SDP with promise \"onOfferSet\" for when it's done.");

        /* Set remote description on our pipeline */
        {
		auto oos = [](GstPromise * p, gpointer data){ GstWebRtcEndpointHub::Instance()->onOfferSet(p, data); };
		GstElement * webrtcElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "webrtcElement");
        	g_assert_nonnull (webrtcElement);
                promise = gst_promise_new_with_change_func((GstPromiseChangeFunc)oos, webrtcElement, NULL);
                g_signal_emit_by_name (webrtcElement, "set-remote-description", offer, promise);
        }
        gst_webrtc_session_description_free (offer);

        Log::Inst().log("GstWebRtcEndpointHub::replaceOfferForRenegotiation(): Done setting offer.");

	/*
	gchar * offerSdpCopy = NULL;
	offerSdpCopy = g_strndup(engagementOfferSdp.c_str(), engagementOfferSdp.size());
	auto onn = [](GstElement * webrtc, gpointer userData){ GstWebRtcEndpointHub::Instance()->onNegotiationNeeded(webrtc, userData); };
	GstElement * webrtcElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "webrtcElement");
        g_assert_nonnull (webrtcElement);
	g_signal_connect(webrtcElement, "on-negotiation-needed", G_CALLBACK((ONNTYPE)onn), offerSdpCopy);
	*/

}



/*
void GstWebRtcEndpointHub::onNegotiationNeededForRenegotiation(GstElement * webrtc, gpointer offerSdpFreeAfterUse) {


}
*/



void GstWebRtcEndpointHub::turnOffAudioInWebRtcPipeline() {

	GstStateChangeReturn ret = gst_element_set_state ((GstElement *)pipelineBinElement, GST_STATE_PAUSED);
	Log::Inst().log("turnOffAudioInWebRtcPipeline(): Pausing the pipeline. <<%d>>", ret);

	Log::Inst().log("turnOffAudioInWebRtcPipeline(): Getting the capsfilter from the pipeline.");

        GstElement * capsFilterElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "capsFilterBeforeWebRtcBin");
        g_assert(capsFilterElement != NULL);

	Log::Inst().log("turnOffAudioInWebRtcPipeline(): Getting the webrtc element from the pipeline.");

        GstElement * webrtcElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "webrtcElement");
        g_assert(webrtcElement != NULL);

	gst_element_unlink(capsFilterElement, webrtcElement);

	GstElement * fakesinkElement = gst_element_factory_make("fakesink", "parkTheAudioHere");
        g_assert(fakesinkElement != NULL);

	gst_bin_add (GST_BIN (pipelineBinElement), fakesinkElement);

	gst_element_link(capsFilterElement, fakesinkElement);

	ret = gst_element_set_state ((GstElement *)pipelineBinElement, GST_STATE_READY);
	Log::Inst().log("turnOffAudioInWebRtcPipeline(): Readying the pipeline. <<%d>>", ret);

	GArray *transceivers = NULL;
        GstWebRTCRTPTransceiver *trans = NULL;
        g_signal_emit_by_name (webrtcElement, "get-transceivers", &transceivers);
        int I;
        for ( I = 0; I < transceivers->len; I++ ) {
                trans = g_array_index (transceivers, GstWebRTCRTPTransceiver *, I);
		Log::Inst().log("turnOffAudioInWebRtcPipeline(): Got a transceiver. %d %d", trans->mline, trans->direction);
	}

	ret = gst_element_set_state ((GstElement *)pipelineBinElement, GST_STATE_PLAYING);
	Log::Inst().log("turnOffAudioInWebRtcPipeline(): Starting the pipeline. %d", ret);

	__audioIsTurnedOn = false;

}



void GstWebRtcEndpointHub::turnOnAudioInWebRtcPipeline() {

	GstStateChangeReturn ret = gst_element_set_state ((GstElement *)pipelineBinElement, GST_STATE_PAUSED);
	Log::Inst().log("turnOnAudioInWebRtcPipeline(): Pausing the pipeline. <<%d>>", ret);

	Log::Inst().log("turnOnAudioInWebRtcPipeline(): Getting the capsfilter from the pipeline.");

        GstElement * capsFilterElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "capsFilterBeforeWebRtcBin");
        g_assert(capsFilterElement != NULL);

	Log::Inst().log("turnOnAudioInWebRtcPipeline(): Getting the park element from the pipeline.");

        GstElement * fakesinkElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "parkTheAudioHere");
        g_assert(fakesinkElement != NULL);

	Log::Inst().log("turnOnAudioInWebRtcPipeline(): Getting the webrtc element from the pipeline.");

        GstElement * webrtcElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "webrtcElement");
        g_assert(webrtcElement != NULL);

	gst_element_unlink(capsFilterElement, fakesinkElement);

	gst_element_link(capsFilterElement, webrtcElement);

	ret = gst_element_set_state ((GstElement *)pipelineBinElement, GST_STATE_READY);
	Log::Inst().log("turnOnAudioInWebRtcPipeline(): Readying the pipeline. <<%d>>", ret);

	GArray *transceivers = NULL;
        GstWebRTCRTPTransceiver *trans = NULL;
        g_signal_emit_by_name (webrtcElement, "get-transceivers", &transceivers);
        int I;
        for ( I = 0; I < transceivers->len; I++ ) {
                trans = g_array_index (transceivers, GstWebRTCRTPTransceiver *, I);
		Log::Inst().log("turnOnAudioInWebRtcPipeline(): Got a transceiver. %d %d", trans->mline, trans->direction);
	}

	ret = gst_element_set_state ((GstElement *)pipelineBinElement, GST_STATE_PLAYING);
	Log::Inst().log("turnOnAudioInWebRtcPipeline(): Starting the pipeline. %d", ret);

	__audioIsTurnedOn = true;
}





void GstWebRtcEndpointHub::startDroppingSomeFrames() {

	/*
        GstElement * dropFramesElement = NULL;
        dropFramesElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "dropFramesElement");
        g_assert(dropFramesElement != NULL );

        g_object_set (G_OBJECT (dropFramesElement), "drop-probability", 0.01, NULL);
	*/

}


void GstWebRtcEndpointHub::stopDroppingFrames() {

	/*
        GstElement * dropFramesElement = NULL;
        dropFramesElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "dropFramesElement");
        g_assert(dropFramesElement != NULL );

        g_object_set (G_OBJECT (dropFramesElement), "drop-probability", 0.00, NULL);
	*/

}


/*
void GstWebRtcEndpointHub::restartCamera() {

	// hi andy!

}
*/


void GstWebRtcEndpointHub::forceIdrFrame() {

        GstElement * encoderElement = NULL;
        encoderElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "encoder");
        g_assert(encoderElement != NULL );

        g_signal_emit_by_name (G_OBJECT (encoderElement), "force-IDR");
}




/*
void GstWebRtcEndpointHub::forceIDR() {

	Log::Inst().log("GstWebRtcEndpointHub::forceIDR(): Getting the encoder element from the pipeline.");

        GstElement * encoderElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "encoder");
        g_assert(encoderElement != NULL);

	GstFlowReturn ret;
	g_signal_emit_by_name (encoderElement, "force-IDR", NULL, &ret);

	Log.Inst().log("GstWebRtcEndpointHub::forceIDR(): Setting the camera element's state to null.");

	gst_element_set_state (cameraElement, GST_STATE_NULL);

	Log.Inst().log("GstWebRtcEndpointHub::forceIDR(): Removing the camera element from the pipeline.");

	// remove unlinks automatically 
	gst_bin_remove (GST_BIN (pipelineBinElement), cameraElement);
	Log.Inst().log("GstWebRtcEndpointHub::forceIDR(): Unref the old camera element.");
	g_object_unref(cameraElement);

	GstElement * capsElement;

        capsElement = gst_bin_get_by_name(pipeline, "capsElement");
        g_assert(capsElement != NULL);

	Log::Inst().log("GstWebRtcEndpointHub::forceIDR(): Creating new camera element.");

	GstElement * newCameraElement = NULL;
	newCameraElement = constructCameraGstElement(currentCameraIdInMainPosition, cameraSensorMode, 0);
	if ( newCameraElement == NULL ) {
		return;
	}

	Log.Inst().log("GstWebRtcEndpointHub::forceIDR(): Adding the new camera element to the pipeline.");

	gst_bin_add (GST_BIN (pipeline), newCameraElement);

	Log.Inst().log("GstWebRtcEndpointHub::forceIDR(): Linking the new camera element to the caps filter main and the rest of the pipeline.");

	gst_element_link_many (newCameraElement, videoRawCapsFilterElement, NULL);

	Log.Inst().log("GstWebRtcEndpointHub::forceIDR(): Setting the new camera elements state to PLAY.");

	gst_element_set_state (newCameraElement, GST_STATE_PLAYING);

	Log::Inst().log("GstWebRtcEndpointHub::forceIDR(): Exiting.");

	return;
}
*/

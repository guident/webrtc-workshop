#include "wssStateMachine.h"
#include "pcmAnswererHub.h"
#include <cstdio>
#include <functional>
#include <cstdlib>
#include <ctime>
#include <glib.h>
#include <glib-unix.h>
#include <gst/gst.h>
#include <thread>


#include <libsoup/soup.h>
#include <json-glib/json-glib.h>
#include <iostream>
#include <string>


WssStateMachine * WssStateMachine::__instance = NULL;

WssStateMachine::WssStateMachine(): 
    authAccessToken(""),
    // io_context_(),
    isAuthenticated(false),
    myEndpointId("33"),
    myConnectionId(""),
    peerConnectionId(""),
    defaultLongitude(-80.1001748),
    defaultLatitude(26.3834684),
    currentLatitude(defaultLatitude),
    currentLongitude(defaultLongitude),
    randomLatLonCounter(0),
    lastPongReceived(0L),
    connectionAttemptStartedAt(0L),
    pipelineBinElement(NULL),
    webrtcElement(NULL),
    negotiationDone(false),
    statusNotifyTimerId(0),
    pad_name("sink_0"),
    selector(NULL) {

    printf("WssStateMachine::WssStateMachine(): Constructing WssStateMachine...\n");
    srand(static_cast<unsigned int>(time(0)));
    statusNotifyTimerId = g_timeout_add_seconds(5, [](gpointer user_data) -> gboolean {
    static_cast<WssStateMachine*>(user_data)->onStatusNotifyTimerTimeout();
    return TRUE;
    }, this);
}

WssStateMachine::~WssStateMachine() {
    // io_context_.stop();
    if (statusNotifyTimerId != 0) {
        g_source_remove(statusNotifyTimerId);
    }
}

WssStateMachine *WssStateMachine::Instance() {
    if (__instance == NULL) {
        __instance = new WssStateMachine();
    }
    return __instance;
}


void WssStateMachine::start() {
    printf("WssStateMachine::start(): Starting State Machine()");
}

GstElement * WssStateMachine::getPipeline() {
    return(pipelineBinElement);
}

/*
std::pair<double, double> WssStateMachine::getNextRandomLatLon() {
    
    if (randomLatLonCounter >= 25) {
        currentLatitude = defaultLatitude;
        currentLongitude = defaultLongitude;
        randomLatLonCounter = 0;
    } else {
        currentLatitude += static_cast<float>(rand()) / RAND_MAX * 0.002f - 0.001f;
        currentLongitude += static_cast<float>(rand()) / RAND_MAX * 0.001f - 0.0005f;
        randomLatLonCounter++;
    }
    return std::make_pair(currentLatitude, currentLongitude);
}
*/



/* -------------------------------------------------------------------------- */
/*                               MARK: Websocket                              */
/* -------------------------------------------------------------------------- */



void WssStateMachine::authenticate() {
    
    printf("WssStateMachine::authenticate(): Authenticating...\n");
    auto session = soup_session_new();
    auto message = soup_message_new("POST", "http://dev.bluepepper.us:8081/handler");

    if (!message) {
        std::cerr << "WssStateMachine::authenticate(): Failed to create message" << std::endl;
        return;
    }

    // Create JSON request body
    JsonBuilder *builder = json_builder_new();
    json_builder_begin_object(builder);
    json_builder_set_member_name(builder, "action");
    json_builder_add_string_value(builder, "auth");
    json_builder_set_member_name(builder, "auth");
    json_builder_begin_object(builder);
    json_builder_set_member_name(builder, "uniqueId");
    json_builder_add_string_value(builder, PcmAnswererHub::Instance()->vehicleUuid.c_str());
    json_builder_set_member_name(builder, "password");
    json_builder_add_string_value(builder, PcmAnswererHub::Instance()->password.c_str());
    json_builder_end_object(builder);
    json_builder_end_object(builder);

    JsonGenerator *gen = json_generator_new();
    JsonNode *root = json_builder_get_root(builder);
    json_generator_set_root(gen, root);
    gchar *requestBody = json_generator_to_data(gen, NULL);

    // Debugging: Print the request body
    printf("Request Body: %s\n", requestBody);

    // Set request body
    // soup_message_set_request(message, "application/json", SOUP_MEMORY_TAKE, requestBody, strlen(requestBody));
    GBytes *body_bytes = g_bytes_new(requestBody, strlen(requestBody));
    GInputStream *input_stream = g_memory_input_stream_new_from_bytes(body_bytes);
    soup_message_set_request_body(message, "application/json", input_stream, -1);
    g_object_unref(input_stream);
    g_bytes_unref(body_bytes);


    // Set headers
    // soup_message_headers_set_content_type(message->request_headers, "application/json", NULL);
    SoupMessageHeaders *headers = soup_message_get_request_headers(message);
    soup_message_headers_append(headers, "Content-Type", "application/json");

    // Send the request synchronously
    // auto status = soup_session_send_message(session, message);
    GError *error = NULL;
    GInputStream *response_stream = soup_session_send(session, message, NULL, &error); 

    // Debugging: Print the response status and body
    // printf("Response Status: %d\n", status);
    // if (message->response_body->data) {
    //     printf("Response Body: %s\n", message->response_body->data);
    // }

    




    // Handle the response
    // if (status == SOUP_STATUS_OK || status == SOUP_STATUS_ACCEPTED) {
    //     const char *responseBody = message->response_body->data;
    //     std::cout << "WssStateMachine::authenticate(): onload: <<" << responseBody << ">>" << std::endl;

    //     JsonParser *parser = json_parser_new();
    //     if (json_parser_load_from_data(parser, responseBody, -1, NULL)) {
    //         JsonNode *rootNode = json_parser_get_root(parser);
    //         JsonObject *rootObj = json_node_get_object(rootNode);

    //         if (json_object_has_member(rootObj, "data")) {
    //             JsonObject *dataObj = json_object_get_object_member(rootObj, "data");
    //             if (json_object_has_member(dataObj, "access_token")) {
    //                 authAccessToken = json_object_get_string_member(dataObj, "access_token");
    //             }
    //         }
    //     }

    //     g_object_unref(parser);

    //     if (!authAccessToken.empty()) {
    //         isAuthenticated = true;
    //         std::cout << "WssStateMachine::authenticate(): Authentication [SUCCESSFUL]: Got this access token!! <<" << authAccessToken << ">>" << std::endl;
    //         connectWss();
    //     } else {
    //         std::cout << "WssStateMachine::authenticate(): onload: Oops!!" << std::endl;
    //     }
    // } else {
    //     std::cout << "WssStateMachine::authenticate(): Error: " << status << std::endl;
    // }

    // // Cleanup
    // g_object_unref(message);
    // g_object_unref(session);
    // json_node_free(root);
    // g_object_unref(builder);
    // g_object_unref(gen);



    if (error) {
        std::cerr << "WssStateMachine::authenticate(): Error in request: " << error->message << std::endl;
        g_error_free(error);
    } else if (response_stream) {
        // Read the response data
        gsize size;
        gchar *response_data = (gchar *)g_malloc(4096); // Cast the return value of g_malloc to gchar*
        size = g_input_stream_read(response_stream, response_data, 4096, NULL, &error);

        if (error) {
            std::cerr << "WssStateMachine::authenticate(): Error reading response: " << error->message << std::endl;
            g_error_free(error);
        } else {
            printf("Response Body: %.*s\n", (int)size, response_data);

            int status = soup_message_get_status(message);
            if (status == SOUP_STATUS_OK || status == SOUP_STATUS_ACCEPTED) {
                std::cout << "WssStateMachine::authenticate(): onload: <<" << response_data << ">>" << std::endl;

                // Handle JSON parsing and token extraction here
                JsonParser *parser = json_parser_new();
                if (json_parser_load_from_data(parser, response_data, size, NULL)) {
                    JsonNode *rootNode = json_parser_get_root(parser);
                    JsonObject *rootObj = json_node_get_object(rootNode);

                    if (json_object_has_member(rootObj, "data")) {
                        JsonObject *dataObj = json_object_get_object_member(rootObj, "data");
                        if (json_object_has_member(dataObj, "access_token")) {
                            authAccessToken = json_object_get_string_member(dataObj, "access_token");
                        }
                    }
                }

                g_object_unref(parser);

                if (!authAccessToken.empty()) {
                    isAuthenticated = true;
                    std::cout << "WssStateMachine::authenticate(): Authentication [SUCCESSFUL]: Got this access token!! <<" << authAccessToken << ">>" << std::endl;
                    connectWss();
                } else {
                    std::cout << "WssStateMachine::authenticate(): onload: Oops!!" << std::endl;
                }
            } else {
                std::cout << "WssStateMachine::authenticate(): Error: " << status << std::endl;
            }
        }

        g_free(response_data);
        g_object_unref(response_stream);
    }

    // Cleanup
    g_object_unref(message);
    g_object_unref(session);
    json_node_free(root);
    g_object_unref(builder);
    g_object_unref(gen);
}





void WssStateMachine::connectWss() {
    printf("WssStateMachine::connectWss(): Attempting wss connection...\n");
    lastPongReceived = 0;
    connectionAttemptStartedAt = time(NULL);

    const char *https_aliases[] = { "wss", NULL };

    session = soup_session_new();
    g_object_set(session,
                 "tls-interaction", NULL,
                 "use-system-ca-file", TRUE,
                 "https-aliases", https_aliases,
                 NULL);

    logger = soup_logger_new(SOUP_LOGGER_LOG_BODY);
    soup_session_add_feature(session, SOUP_SESSION_FEATURE(logger));
    g_object_unref(logger);

    message = soup_message_new(SOUP_METHOD_GET, WSS_URL);
    preconnectSession = session;

    soup_session_websocket_connect_async(
        session,
        message,
        NULL,   
        NULL,     
        0,        
        NULL,     
        WssStateMachine::onWssServerConnected, 
        this
    );
}



void WssStateMachine::closeConnection() {
    printf("WssStateMachine::closeConnection(): Closing connection to server.\n");
    if ( websocketConnection != NULL ) {
        soup_websocket_connection_close (websocketConnection, 1000, "");
    }
    websocketConnection = NULL;
}



void WssStateMachine::cancelConnection() {
    
    printf("WssStateMachine::cancelConnection(): Cancelling connection attempt to server.\n");
    if ( preconnectSession != NULL ) {
        soup_session_abort(preconnectSession);
        preconnectSession = NULL;
    }
}



void WssStateMachine::resetEverything() {

    printf("WssStateMachine::resetEverything(): resetting pipeline to null and closing WSS.\n");

    if ( pipelineBinElement != NULL ) {
        // gst_element_set_state (GST_ELEMENT (pipelineBinElement), GST_STATE_PAUSED); // make NULL
        gst_element_set_state (GST_ELEMENT (pipelineBinElement), GST_STATE_NULL);
        g_clear_object(&pipelineBinElement);
        g_object_unref(pipelineBinElement);
        pipelineBinElement = NULL;
    }
    printf("WssStateMachine::resetEverything(): Pipeline has been reset.\n");

    PcmAnswererHub::Instance()->closeConnection();

    printf("WssStateMachine::resetEverything(): Closing WSS connection.\n");

}



void WssStateMachine::resetWebrtcPipeline() {

    if (pipelineBinElement != NULL) {

        // Set the entire pipeline to the NULL state to allow all elements to clean up
        GstStateChangeReturn ret = gst_element_set_state(pipelineBinElement, GST_STATE_NULL);

        if (ret == GST_STATE_CHANGE_FAILURE) {
            g_warning("Failed to set pipeline to NULL state.");
        } else {
            // Wait for the state change to complete
            gst_element_get_state(pipelineBinElement, NULL, NULL, GST_CLOCK_TIME_NONE);

            // Unref the pipeline
            printf("WssStateMachine::resetWebrtcPipeline(): unrefing pipelineBinElement.\n");
            gst_object_unref(pipelineBinElement);
            pipelineBinElement = NULL;
            webrtcElement = NULL;
            negotiationDone = false;

        }
    }

    printf("WssStateMachine::resetWebrtcPipeline(): Pipeline has been reset.\n");

}




void WssStateMachine::onWssServerConnected(GObject *conn, GAsyncResult *res, gpointer userData) {
    
    WssStateMachine *self = static_cast<WssStateMachine*>(userData);
    GError *error = NULL;

    self->websocketConnection = soup_session_websocket_connect_finish (SOUP_SESSION(conn), res, &error);
    self->preconnectSession = NULL;

    if (error) {
        std::cout << "WssStateMachine::onWssServerConnected(): Oops! exception." << &error << std::endl;
        g_error_free (error);
        if (self->websocketConnection) {
            g_object_unref(self->websocketConnection);
        }
        self->websocketConnection = NULL;
        // this->__state->onDisconnected();
        PcmAnswererHub::Instance()->getState()->onDisconnected();
        return;
    }

    g_assert_nonnull (self->websocketConnection);

    soup_websocket_connection_set_keepalive_interval(self->websocketConnection, 10);

    g_signal_connect (self->websocketConnection, "closed", G_CALLBACK(onWssServerDisconnected), self);
    g_signal_connect (self->websocketConnection, "message", G_CALLBACK(onWebsocketMessage), self);
    g_signal_connect (self->websocketConnection, "pong", G_CALLBACK(onWebsocketPong), self);

    // this->__state->onConnected();
    PcmAnswererHub::Instance()->getState()->onConnected();

}



void WssStateMachine::onWssServerDisconnected(SoupWebsocketConnection *conn, gpointer userData) {
    
    printf("WssStateMachine::onWssServerDisconnected(): Connection closed\n");
    WssStateMachine *self = static_cast<WssStateMachine*>(userData);
    self->websocketConnection = nullptr;
}



void WssStateMachine::onWebsocketMessage(SoupWebsocketConnection *conn, SoupWebsocketDataType type, GBytes *msg, gpointer userData) {
    
    WssStateMachine *self = static_cast<WssStateMachine*>(userData);

    switch (type) {
        case SOUP_WEBSOCKET_DATA_BINARY:
            printf("WssStateMachine::onWebsocketMessage(): Binary message has arrived from the server?! Ignoring.");
            return;

        case SOUP_WEBSOCKET_DATA_TEXT: {
            gsize size;
            const gchar *data = static_cast<const gchar*>(g_bytes_get_data(msg, &size));
            printf("WssStateMachine::OnWebsocketMessage(): Got a message! <<%.*s>>\n", (int)size, data);

            /* Convert to NULL-terminated string */
            gchar * offer = g_strndup(data, size);

            JsonParser *parser = json_parser_new();
            if (!json_parser_load_from_data(parser, offer, -1, NULL)) {
                printf("Failed to parse JSON message.\n");
                g_object_unref(parser);
                g_free(offer);
                return;
            }

            JsonNode *root = json_parser_get_root(parser);
            JsonObject *root_obj = json_node_get_object(root);

            // Access specific attributes
													     

	    if ( json_object_get_string_member(root_obj, "peerConnectionId") != NULL ) {
            	self->peerConnectionId = std::string(json_object_get_string_member(root_obj, "peerConnectionId"));
	    }
            const gchar *message_type = json_object_get_string_member(root_obj, "messageType");
            const gchar *endpoint_type = json_object_get_string_member(root_obj, "endpointType");
            const gchar *event_type = json_object_get_string_member(root_obj, "eventType");
            
            if ( strcmp(message_type, GuidentMessageTypes::NOTIFY) == 0 && strcmp(event_type, GuidentMsgEventTypes::CONNECTED) == 0 ) {
                printf("WssStateMachine::onWebsocketMessage(): Connected to server!\n");
                self->myConnectionId = std::string(json_object_get_string_member(root_obj, "connectionId"));
		        PcmAnswererHub::Instance()->setEngagementConnectionId("");
                self->sendWssMessage(GuidentMessageTypes::REGISTER);
            }

            if ( strcmp(message_type, GuidentMessageTypes::NOTIFY) == 0 && strcmp(event_type, GuidentMsgEventTypes::ICE_CANDIDATE) == 0 ) {
                const char *eventData = json_object_get_string_member(root_obj, "eventData");
                printf("WssStateMachine::onWebsocketMessage(): Got an ICE CANDIDATE!!! <<%s>>\n", eventData);

                // Since eventData is a plain string, we don't need to parse it as JSON
                const char* candidateStr = eventData;

                // Assuming m-line-index is known or always 0
                guint sdpMLineIndex = 0; // Update this if you have the correct index

                // Add the ICE candidate to webrtcbin
                if (self->webrtcElement != NULL) {
                    printf("WssStateMachine::onWebsocketMessage(): Adding ICE candidate to webrtcbin.\n");
                    g_signal_emit_by_name(self->webrtcElement, "add-ice-candidate", sdpMLineIndex, candidateStr);
                    printf("WssStateMachine::onWebsocketMessage(): Succesfully Added an ICE candidate to webrtcbin.\n");
                } else {
                    printf("WssStateMachine::onWebsocketMessage(): webrtcElement is NULL, cannot add ICE candidate.\n");
                }
            }


            if ( strcmp(message_type, GuidentMessageTypes::ENGAGE_OFFER) == 0 ) {

            	JsonObject *sessiondescription_obj = json_object_get_object_member(root_obj, "sessiondescription");
            	if (sessiondescription_obj) {
                    if (json_object_has_member(sessiondescription_obj, "sdp")) {
                    	const gchar *sdp = json_object_get_string_member(sessiondescription_obj, "sdp");
                    	self->engagementOfferSdp = std::string(sdp);
                    	printf("WssStateMachine::onWebsocketMessage(): Got an ENGAGE-OFFER message with SDP, contents: <<%s>>.\n", self->engagementOfferSdp.substr(0, 20).c_str());
		        PcmAnswererHub::Instance()->setEngagementConnectionId(self->peerConnectionId.c_str());
                    	PcmAnswererHub::Instance()->getState()->onOfferReceived();
                    } else {
                        printf("WssStateMachine::onWebsocketMessage(): SDP field not found in session description.\n");
                    }
                } else {
                    printf("WssStateMachine::onWebsocketMessage(): sessiondescription object not found.\n");
                }
	    }


            /* Catch disengagement to return to the advertisement screen */
            printf("Current State: <<%s>>\tNext State: <<%s>>\n", PcmAnswererHub::Instance()->getState()->getStateName(), message_type);
            printf("MessageType: strcmp <<%d>>\n", strcmp(message_type, GuidentMessageTypes::DISENGAGE) );
            // if (PcmAnswererHub::Instance()->getState()->getStateName() == "ENGAGED" && strcmp(message_type, GuidentMessageTypes::DISENGAGE) == 0) {
            if (strcmp(message_type, GuidentMessageTypes::DISENGAGE) == 0) {
                printf("WssStateMachine::onWebsocketMessage(): Got a DISENGAGE.\n");

		PcmAnswererHub::Instance()->setEngagementConnectionId("");
                PcmAnswererHub::Instance()->getState()->onDisengaged();


            }


            break;
        }

        default:
            g_assert_not_reached ();
    }

}

// // Method to handle incoming ICE candidates
// void onIceCandidateReceived(const char * eventData) {
//      console.log("WssStateMachine::onIceCandidateReceived(): Adding Ice Candidate\n");
//   try {
//     // Parse the ICE candidate data
//     const candidateData = JSON.parse(eventData);

//     // Create an RTCIceCandidate object
//     const iceCandidate = new RTCIceCandidate({
//       candidate: candidateData.candidate,
//       sdpMid: candidateData.sdpMid,
//       sdpMLineIndex: candidateData.sdpMLineIndex,
//     });

//     // Check if remote description is set
//     if (this.peerConnection.remoteDescription) {
//       // Add the candidate immediately
//       this.peerConnection.addIceCandidate(iceCandidate)
//         .then(() => {
//           console.log('ICE candidate successfully added.');
//         })
//         .catch(error => {
//           console.error('Error adding ICE candidate:', error);
//         });
//     } else {
//       // Queue the candidate to add later
//       this.iceCandidateQueue.push(iceCandidate);
//     }
//   } catch (error) {
//     console.error('Error parsing ICE candidate data:', error);
//   }
// }




void WssStateMachine::onStatusNotifyTimerTimeout() {
    
        std::cout << "WssStateMachine::onStatusNotifyTimerTimout(): every 5 seconds" << std::endl;
        // std::cout << "statusNotifyTimer():: dataChannelObject: <<" << dataChannelObject << " >>." << std::endl;

        const char* stateName = PcmAnswererHub::Instance()->getState()->getStateName();
        printf("WssStateMachine::onStatusNotifyTimerTimeout(): stateName is: <<%s>>\n", stateName);

        if ( strcmp(stateName, "CONNECTED") == 0 || strcmp(stateName, "ENGAGED" ) == 0) {
            printf("WssStateMachine::onStatusNotifyTimerTimeout(): Sending Message...\n");
            sendWssMessage(GuidentMessageTypes::NOTIFY);
        } 

}



void WssStateMachine::sendWssMessage(const std::string &messageType, const std::string &destinationId) {
    


    JsonBuilder *builder = json_builder_new();
    json_builder_begin_object(builder);

    json_builder_set_member_name(builder, "messageType");
    json_builder_add_string_value(builder, messageType.c_str());

    json_builder_set_member_name(builder, "connectionId");
    json_builder_add_string_value(builder, myConnectionId.c_str());

    if (!destinationId.empty()) {
        json_builder_set_member_name(builder, "peerConnectionId");
        json_builder_add_string_value(builder, destinationId.c_str());
    }

    if (myEndpointId) {
        json_builder_set_member_name(builder, "endpointId");
        json_builder_add_string_value(builder, myEndpointId);
    }

    json_builder_set_member_name(builder, "endpointType");
    json_builder_add_string_value(builder, GuidentMsgEndpointTypes::VEHICLE);

    json_builder_set_member_name(builder, "name");
    json_builder_add_string_value(builder, NAME);

    if (messageType == "register") {
        json_builder_set_member_name(builder, "credential");
        json_builder_add_string_value(builder, PcmAnswererHub::Instance()->password.c_str());

        json_builder_set_member_name(builder, "authenticationUsername");
        json_builder_add_string_value(builder, PcmAnswererHub::Instance()->vehicleUuid.c_str());

        json_builder_set_member_name(builder, "authenticationToken");
        json_builder_add_string_value(builder, authAccessToken.c_str());
    }

    if (messageType == "notify") {
        json_builder_set_member_name(builder, "eventType");
        json_builder_add_string_value(builder, "status");

        //std::pair<double, double> location = getNextRandomLatLon();

	/*
        json_builder_set_member_name(builder, "location");
        json_builder_begin_object(builder);
        json_builder_set_member_name(builder, "lat");
        json_builder_add_double_value(builder, location.first);
        json_builder_set_member_name(builder, "lng");
        json_builder_add_double_value(builder, location.second);
        json_builder_set_member_name(builder, "speed");
        json_builder_add_double_value(builder, 23.0);
        json_builder_set_member_name(builder, "heading");
        json_builder_add_double_value(builder, 45.0);
	*/

        json_builder_end_object(builder);
    }

    // if (messageType == "engage-offer" || messageType == "engage-answer") {
    //     if (pc != nullptr) {
    //         json_builder_set_member_name(builder, "sessiondescription");
    //         json_builder_add_string_value(builder, pc->localDescription.c_str());
    //     }
    // }

    json_builder_set_member_name(builder, "sessiondescription");
    json_builder_add_string_value(builder, "");

    json_builder_set_member_name(builder, "sequence");
    json_builder_add_int_value(builder, localMessageSequence++);

    json_builder_end_object(builder);

    JsonGenerator *gen = json_generator_new();
    JsonNode *root = json_builder_get_root(builder);
    json_generator_set_root(gen, root);
    gchar *messageStr = json_generator_to_data(gen, NULL);

    // Debugging: Print the JSON message
    std::cout << "WssStateMachine::sendWssMessage(): Sending: <<" << messageStr << ">>." << std::endl;

    // Send the message over the WebSocket connection
    if (websocketConnection) {
        soup_websocket_connection_send_text(websocketConnection, messageStr);
        // soup_websocket_connection_send_text(websocketConnection, sdp);
    } else {
        std::cerr << "WssStateMachine::sendWssMessage(): WebSocket connection is not established." << std::endl;
    }

    // Cleanup
    g_free(messageStr);
    json_node_free(root);
    g_object_unref(builder);
    g_object_unref(gen);
}




void WssStateMachine::sendWssIceCandidateMessage(guint mLineIndex, const gchar * candidate) {

	if ( mLineIndex > 7 ) return;
	if ( candidate == NULL ) return;

	std::string engagedId = PcmAnswererHub::Instance()->getEngagementConnectionId();

	if ( engagedId.empty() ) return;


    JsonBuilder *builder = json_builder_new();
    json_builder_begin_object(builder);

    json_builder_set_member_name(builder, "messageType");
    json_builder_add_string_value(builder, "notify");

    json_builder_set_member_name(builder, "connectionId");
    json_builder_add_string_value(builder, myConnectionId.c_str());

    json_builder_set_member_name(builder, "peerConnectionId");
    json_builder_add_string_value(builder, engagedId.c_str());

    printf("MIKEMADETHIS... THESE ARE THE DAMN CONNECTION IDS: <<%s>>, peer: <<%s>>\n", myConnectionId, engagedId.c_str());

    if (myEndpointId) {
        json_builder_set_member_name(builder, "endpointId");
        json_builder_add_string_value(builder, myEndpointId);
    }

    json_builder_set_member_name(builder, "endpointType");
    json_builder_add_string_value(builder, GuidentMsgEndpointTypes::VEHICLE);

    json_builder_set_member_name(builder, "name");
    json_builder_add_string_value(builder, NAME);


    json_builder_set_member_name(builder, "eventType");
    json_builder_add_string_value(builder, "ice-candidate");

    json_builder_set_member_name(builder, "eventData");
    json_builder_begin_object(builder);
    json_builder_set_member_name(builder, "m-line-index");
    json_builder_add_int_value(builder, mLineIndex);
    json_builder_set_member_name(builder, "ice-candidate");
    json_builder_add_string_value(builder, candidate);
    json_builder_end_object(builder);

    json_builder_set_member_name(builder, "sequence");
    json_builder_add_int_value(builder, localMessageSequence++);

    json_builder_end_object(builder);

    JsonGenerator *gen = json_generator_new();
    JsonNode *root = json_builder_get_root(builder);
    json_generator_set_root(gen, root);
    gchar *messageStr = json_generator_to_data(gen, NULL);

    // Debugging: Print the JSON message
    std::cout << "WssStateMachine::sendWssIceCandidateMessage(): Sending: <<" << messageStr << ">>." << std::endl;

    // Send the message over the WebSocket connection
    if (websocketConnection) {
        soup_websocket_connection_send_text(websocketConnection, messageStr);
        // soup_websocket_connection_send_text(websocketConnection, sdp);
    } else {
        std::cerr << "WssStateMachine::sendWssIceCandidateMessage(): WebSocket connection is not established." << std::endl;
    }

    // Cleanup
    g_free(messageStr);
    json_node_free(root);
    g_object_unref(builder);

}



void WssStateMachine::onWebsocketPong(SoupWebsocketConnection *conn, GBytes *msg, gpointer userData) {
    
    printf("WssStateMachine::OnWebsocketPong(): Got a pong!\n");
    WssStateMachine *self = static_cast<WssStateMachine*>(userData);
    self->lastPongReceived = time(NULL);
}



void WssStateMachine::sendSdpAnswerThroughWss(const char * sdp) {

    if ( sdp == NULL || strlen(sdp) < 20 ) return;

    printf("WssStateMachine::sendSdpAnswerThroughWss(): Sending SDP answer message.<<%s>>\n", sdp);

    soup_websocket_connection_send_text(websocketConnection, sdp);
}



/* -------------------------------------------------------------------------- */
/*                                MARK: WebRTC                                */
/* -------------------------------------------------------------------------- */



/* -------------------------------------------------------------------------- */
/*              MARK: Static functions to call instance functions             */
/* -------------------------------------------------------------------------- */

void WssStateMachine::onNegotiationNeededStatic(GstElement * webrtc, gpointer userData) {
    printf("WssStateMachine::onNegotiationNeededStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(userData);
    self->onNegotiationNeeded(webrtc, nullptr);
}

void WssStateMachine::onOfferSetStatic(GstPromise * promise, gpointer userData) {
    printf("WssStateMachine::onOfferSetStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(userData);
    self->onOfferSet(promise, nullptr);
}

void WssStateMachine::onAnswerCreatedStatic(GstPromise * promise, gpointer userData) {
    printf("WssStateMachine::onAnswerCreatedStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(userData);
    self->onAnswerCreated(promise, nullptr);
}

void WssStateMachine::onAnswerSetStatic(GstPromise * promise, gpointer userData) {
    printf("WssStateMachine::onAnswerSetStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(userData);
    self->onAnswerSet(promise, nullptr);
}

void WssStateMachine::onIceCandidateStatic(GstElement * webrtc, guint mlineIndex, gchar * candidate, gpointer userData) {
    printf("WssStateMachine::onIceCandidateStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(userData);
    self->onIceCandidate(webrtc, mlineIndex, candidate, nullptr);
}

void WssStateMachine::onIceGatheringStateNotifyStatic(GstElement * webrtc, GParamSpec * pspec, gpointer userData) {
    printf("WssStateMachine::onIceGatheringStateNotifyStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(userData);
    self->onIceGatheringStateNotify(webrtc, pspec, nullptr);
}

void WssStateMachine::onNewTransceiverStatic(GstElement * webrtc, GstWebRTCRTPTransceiver * trans, gpointer userData) {
    printf("WssStateMachine::onNewTransceiverStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(userData);
    self->onNewTransceiver(webrtc, trans, nullptr);
}

void WssStateMachine::onIncomingStreamStatic(GstElement * webrtc, GstPad * pad, WssStateMachine * hub) {
    printf("WssStateMachine::onIncomingStreamStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(hub);
    self->onIncomingStream(webrtc, pad, hub);
}

/*
void WssStateMachine::onDecodedIncomingStreamStatic(GstElement * decodebin, GstPad * pad, WssStateMachine * hub) {
    printf("WssStateMachine::onDecodedIncomingStreamStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(hub);
    self->onDecodedIncomingStream(decodebin, pad, hub);
}
*/

void WssStateMachine::onStreamStatusMessageStatic(GstBus * bus, GstMessage * msg, gpointer userData) {
    printf("WssStateMachine::onStreamStatusMessageStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(userData);
    self->onStreamStatusMessage(bus, msg, nullptr);
}

void WssStateMachine::onErrorMessageStatic(GstBus * bus, GstMessage * msg, gpointer userData) {
    printf("WssStateMachine::onErrorMessageStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(userData);
    self->onErrorMessage(bus, msg, nullptr);
}

void WssStateMachine::onEndOfStreamMessageStatic(GstBus * bus, GstMessage * msg, gpointer userData) {
    printf("WssStateMachine::onEndOfStreamMessageStatic(): I have been called\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(userData);
    self->onEndOfStreamMessage(bus, msg, nullptr);
}



void WssStateMachine::onDatachannelCreatedStatic(GstElement *webrtcbin, GstWebRTCDataChannel *dc, gpointer user_data) {
    printf("WssStateMachine::onDatachannelCreatedStatic(): message incoming .\n");
    WssStateMachine *self = static_cast<WssStateMachine *>(user_data);
    self->onDataChannelCreated(webrtcbin, dc, nullptr);
}

void WssStateMachine::on_data_channel_message_string_static(GstWebRTCDataChannel *channel, gchar *message, gpointer user_data) {
    // g_print("Received message: %s\n", message);
    WssStateMachine *self = static_cast<WssStateMachine *>(user_data);
    self->on_data_channel_message_string(channel, message, nullptr);

    // Process the received message as needed
}

// void WssStateMachine::sendSignalingMessageStatic(const gchar* message, gpointer user_data) {
//     WssStateMachine *self = static_cast<WssStateMachine *>(user_data);
//     self->sendSignalingMessage(message, nullptr);
// }


/* -------------------------------------------------------------------------- */
/*       MARK: Instance functions used for constructing WebRTC pipeline       */
/* -------------------------------------------------------------------------- */

void WssStateMachine::onDataChannelCreated(GstElement *webrtcbin, GstWebRTCDataChannel *dc, gpointer user_data) {
    //logic here
    g_signal_connect(dc, "on-message-string",G_CALLBACK(on_data_channel_message_string_static),this);
    // g_signal_connect(dc, "on-message-data",G_CALLBACK(on_data_channel_message_data),NULL); //uncomment for binary messages
}

void WssStateMachine::on_data_channel_message_string(GstWebRTCDataChannel *channel, gchar *message, gpointer user_data) {
    g_print("Received message: %s\n", message);


}


void WssStateMachine::onNegotiationNeeded(GstElement *webrtc, gpointer offerSdpFreeAfterUse) {
    
    printf("WssStateMachine::onNegotiationNeeded(): Pipeline has signalled need to exchange SDP offer/answer.\n");

    printf("WssStateMachine::onNegotiationNeeded(): negotiationDone = <<%s>>.\n", negotiationDone == true ? "true" : "false" );
    if (negotiationDone == true) {
        printf("WssStateMachine::onNegotiationNeeded(): Negotiation already done. Exiting.\n");
        return;
    }
    negotiationDone = true;

    GstSDPMessage *sdp = NULL;

    const char *offerSdp = engagementOfferSdp.c_str();  

    // get session description only // is it only
    

    if (!offerSdp) {
        printf("WssStateMachine::onNegotiationNeeded(): offerSdp is null, exiting.\n");
        return;
    }

    printf("SDP Offer:\n<<%s>>\n", offerSdp);

    GstSDPResult ret = gst_sdp_message_new(&sdp);
    if (ret != GST_SDP_OK) {
        printf("Failed to create new SDP message.\n");
        return;
    }

    ret = gst_sdp_message_parse_buffer((guint8 *)offerSdp, strlen(offerSdp), sdp);
    if (ret != GST_SDP_OK) {
        printf("Failed to parse SDP offer buffer.\n");
        gst_sdp_message_free(sdp);
        return;
    }

    GstWebRTCSessionDescription *offer = gst_webrtc_session_description_new(GST_WEBRTC_SDP_TYPE_OFFER, sdp);
    if (!offer) {
        printf("Failed to create SDP offer description.\n");
        gst_sdp_message_free(sdp);
        return;
    }
    

    GstPromise *promise = gst_promise_new_with_change_func(WssStateMachine::onOfferSetStatic, this, nullptr);
    g_signal_emit_by_name(webrtcElement, "set-remote-description", offer, promise); //AA: Investigate
    printf("WssStateMachine::onNegotiationNeeded(): Emitting signal to call onOfferSet.\n");

    gst_webrtc_session_description_free(offer);
}



void WssStateMachine::onOfferSet(GstPromise * promise, gpointer userData) {
    
    printf("WssStateMachine::onOfferSet(): Remote offer has been set.\n");

    //const GstStructure * reply = gst_promise_get_reply(promise);
    //char * mike = gst_structure_to_string(reply);
    //printf("WssStateMachine::onOfferSet(): <<%s>>.", mike);

    gst_promise_unref (promise);

    // GstElement * webrtc = (GstElement *)userData;

    if ( webrtcElement == NULL ) {
        printf("WssStateMachine::onOfferSet(): Ooops, error retrieving webrtc element.\n");
        return;
    }

    printf("WssStateMachine::onOfferSet(): Creating answer SDP with promise \"onAnswerCreated\" for when it's done.\n");

    // auto oac = [](GstPromise * p, gpointer data){ onAnswerCreated(p, data); };
    // GstPromise * newPromise = gst_promise_new_with_change_func ((GstPromiseChangeFunc)oac, webrtc, NULL);
    // g_signal_emit_by_name (webrtc, "create-answer", NULL, newPromise);

    GstPromise *newPromise = gst_promise_new_with_change_func(WssStateMachine::onAnswerCreatedStatic, this, nullptr);
    g_signal_emit_by_name(webrtcElement, "create-answer", NULL, newPromise);
}



/* Answer created by our pipeline, to be sent to the peer */
void WssStateMachine::onAnswerCreated (GstPromise * promise, gpointer userData) {

        printf("WssStateMachine::onAnswerCreated(): Answer has been created.\n");

        GstWebRTCSessionDescription * answer = NULL;
        const GstStructure *reply;

        // GstElement * webrtc = (GstElement *)userData;

        if ( webrtcElement == NULL ) {
            printf("WssStateMachine::onAnswerCreated(): Oops, error retrieving webrtc element.\n");
            return;
        }

        g_assert_cmphex (gst_promise_wait (promise), ==, GST_PROMISE_RESULT_REPLIED);
        reply = gst_promise_get_reply (promise);
        gst_structure_get (reply, "answer", GST_TYPE_WEBRTC_SESSION_DESCRIPTION, &answer, NULL);
        gst_promise_unref (promise);

        printf("WssStateMachine::onAnswerCreated(): Setting answer SDP with promise \"onAnswerSet\" for when it's done.\n");

        //promise = gst_promise_new ();
        // auto oas = [](GstPromise * p, gpointer data){ onAnswerSet(p, data); };
        // GstPromise * newPromise = gst_promise_new_with_change_func((GstPromiseChangeFunc)oas, webrtc, NULL);
        // g_signal_emit_by_name (webrtc, "set-local-description", answer, newPromise);
        //gst_promise_interrupt (promise);
        //gst_promise_unref (promise);

        GstPromise *newPromise = gst_promise_new_with_change_func(WssStateMachine::onAnswerSetStatic, this, nullptr);
        g_signal_emit_by_name(webrtcElement, "set-local-description", answer, newPromise);


        // if (answer) {
        //     const GstSDPMessage *sdp = answer->sdp;
        //     gchar *sdp_str = gst_sdp_message_as_text(sdp);
        //     // printf("WssStateMachine::onAnswerCreated(): DANIEL SDP Answer:\n%s\n", sdp_str);
        //     g_free(sdp_str);
        // } else {
        //     printf("WssStateMachine::onAnswerCreated(): Failed to get the answer SDP.\n");
        // }

        gst_webrtc_session_description_free (answer);
}


void WssStateMachine::onAnswerSet(GstPromise * promise, gpointer userData) {
    
    /*    
    GstWebRTCSessionDescription * answer = (GstWebRTCSessionDescription *)userData;

    char buffer[1000];
    memset(buffer, 0, 1000);
    strncpy(buffer, gst_sdp_message_as_text(answer->sdp), 999);
    */

    printf("WssStateMachine::onAnswerSet(): Answer SDP has been set.\n");

    if ( webrtcElement == NULL ) {
        printf("WssStateMachine::onAnswerSet(): Oops, error retrieving webrtc element.\n");
        return;
    }


    /** THIS IS A PART OF THE TRICKLE ICE MODIFICATION!! */
    /** start -- this is the stuff moved from the on-ice-gathering-state below -- we send the offer without waiting for the ice candidates */

    GstWebRTCSessionDescription *answer = NULL;
    g_object_get(webrtcElement, "local-description", &answer, NULL);

    if ( answer != NULL ) {

	printf("WssStateMachine::onAnswerSet(): Sending the SDP Answer!!");

        char sdpAnswerBuffer[5000];
        memset(sdpAnswerBuffer, 0, 5000);
        strncpy(sdpAnswerBuffer, gst_sdp_message_as_text(answer->sdp), 4999);
        const char * fullAnswer = createCompleteAnswerMessage((const char *)sdpAnswerBuffer);
        sendSdpAnswerThroughWss(fullAnswer);

        gst_webrtc_session_description_free (answer);

    } else {
	printf("WssStateMachine::onAnswerSet(): Oops, something is screwed up, can retrieve the answer!!");
    }

    /* end */

    
    gst_promise_unref (promise);

}

const char * WssStateMachine::createCompleteAnswerMessage(const char* sdp) {

    JsonBuilder *builder = json_builder_new();
    json_builder_begin_object(builder);

    json_builder_set_member_name(builder, "messageType");
    json_builder_add_string_value(builder, GuidentMessageTypes::ENGAGE_ANSWER);

    json_builder_set_member_name(builder, "endpointType");
    json_builder_add_string_value(builder, GuidentMsgEndpointTypes::VEHICLE);

    json_builder_set_member_name(builder, "eventType");
    json_builder_add_string_value(builder, GuidentMsgEventTypes::UNKNOWN);

    json_builder_set_member_name(builder, "connectionId");
    json_builder_add_string_value(builder, myConnectionId.c_str());

    json_builder_set_member_name(builder, "EndpointId");
    json_builder_add_string_value(builder, myEndpointId); 
    
    std::string engagedId = PcmAnswererHub::Instance()->getEngagementConnectionId();

    json_builder_set_member_name(builder, "peerConnectionId");
    //json_builder_add_string_value(builder, peerConnectionId.c_str());
    json_builder_add_string_value(builder, engagedId.c_str());

    json_builder_set_member_name(builder, "status");
    json_builder_add_string_value(builder, GuidentMsgStatusTypes::UNKNOWN);

    json_builder_set_member_name(builder, "sequence");
    json_builder_add_int_value(builder, localMessageSequence++);

    // Add iceServers array
    // json_builder_set_member_name(builder, "iceServers");
    // json_builder_begin_array(builder);
    // json_builder_begin_object(builder);
    // json_builder_set_member_name(builder, "urls");
    // json_builder_add_string_value(builder, "stun:guident.bluepepper.us:3478");
    // json_builder_end_object(builder);
    // json_builder_end_array(builder);

    // Add sessiondescription object
    json_builder_set_member_name(builder, "sessiondescription");
    json_builder_begin_object(builder);

 
    // const GstSDPMessage *sdp = answer->sdp;
    // gchar *sdp_str = gst_sdp_message_as_text(sdp);

    json_builder_set_member_name(builder, "type");
    json_builder_add_string_value(builder, "answer");

    json_builder_set_member_name(builder, "sdp");
    json_builder_add_string_value(builder, sdp);

    // g_free(sdp);


    json_builder_end_object(builder); 
    json_builder_end_object(builder);  

    JsonGenerator *gen = json_generator_new();
    JsonNode *root = json_builder_get_root(builder);
    json_generator_set_root(gen, root);
    gchar *answerMsgStr = json_generator_to_data(gen, NULL); 
    return((const char *)answerMsgStr);
}



void WssStateMachine::onIceCandidate(GstElement * webrtc, guint mlineindex, gchar * candidate, gpointer userData) {

    printf("WssStateMachine::onIceCandidate(): Returned. Index: <<%d>> Candidate: <<%s>>\n", mlineindex, candidate ? candidate : "NULL");

    if ( mlineindex > 7 ) return;

    if ( candidate == NULL ){
    	sendWssIceCandidateMessage(mlineindex, "");
    } else {
        sendWssIceCandidateMessage(mlineindex, candidate);
    }
    return;
}



void WssStateMachine::onIceGatheringStateNotify(GstElement * webrtc, GParamSpec * pspec, gpointer userData) {

    printf("WssStateMachine::onIceGatheringStateNotify(): OK!\n");

    GstWebRTCICEGatheringState ice_gather_state;
    const gchar *new_state = "unknown";

    g_object_get (webrtc, "ice-gathering-state", &ice_gather_state, NULL);

    switch ( ice_gather_state ) {

        case GST_WEBRTC_ICE_GATHERING_STATE_NEW:
            new_state = "new";
            printf("WssStateMachine::onIceGatheringStateNotify(): Ice gathering state changed to new state: \"%s\".\n", new_state);
            break;

        case GST_WEBRTC_ICE_GATHERING_STATE_GATHERING:
        new_state = "gathering";
            printf("WssStateMachine::onIceGatheringStateNotify(): Ice gathering state changed to new state: \"%s\".\n", new_state);
            break;

        case GST_WEBRTC_ICE_GATHERING_STATE_COMPLETE:
            new_state = "complete";
            printf("WssStateMachine::onIceGatheringStateNotify(): Ice gathering is complete. Will now construct ANSWER message and send it.\n");
            {

		/*

		   Moving this code that grabs the answer sdp and sends it out through smith to the offerer.... up to OnAnswerSet above.

                GstWebRTCSessionDescription *answer = NULL;
                g_object_get(webrtc, "local-description", &answer, NULL);

                if ( answer != NULL ) {
                    char sdpAnswerBuffer[5000];
                    memset(sdpAnswerBuffer, 0, 5000);
                    strncpy(sdpAnswerBuffer, gst_sdp_message_as_text(answer->sdp), 4999);
                    const char * fullAnswer = createCompleteAnswerMessage((const char *)sdpAnswerBuffer);
                    sendSdpAnswerThroughWss(fullAnswer);

                    gst_webrtc_session_description_free (answer);

                    // this->__state->onEngaged();
                    PcmAnswererHub::Instance()->getState()->onEngaged();

                } else {
                    printf("WssStateMachine::onIceGatheringStateNotify(): Ice gathering is complete, but oops, answer SDP cannot be retrieved.");
                }
			
		    But we still want to use this "ice-gathering-state-complete event to prompt us to transition to the engaged state:
		*/

                PcmAnswererHub::Instance()->getState()->onEngaged();

            }
            break;

        default:
            g_assert_not_reached ();
            break;
    }

}



void WssStateMachine::onNewTransceiver(GstElement * webrtc, GstWebRTCRTPTransceiver * trans, gpointer userData) {
    // printf("WssStateMachine::onNewTransceiver(): A new transceiver has been created. <<%d>>", trans ? trans->mline : -1);
    printf("WssStateMachine::onNewTransceiver(): A new transceiver has been created.\n");

   /* 
    int mlineIndex = -1;

    g_object_get(trans, "mlineindex", &mlineIndex);

    if ( mlineIndex != 0 ) {
        printf("MIKE:  mlineindex: |%d|", mlineIndex);
	return;
    }

    // Create the new GstCaps for the codec preferences
    GstCaps *caps = gst_caps_from_string("application/x-rtp,media=video,encoding-name=H264,payload=102,clock-rate=90000,packetization-mode=(string)0,profile-level-id=(string)42001f");

    if (caps != NULL) {    
        // Set the codec preferences using g_object_set
        g_object_set(trans, "codec-preferences", caps, NULL);
        printf("WssStateMachine::onNewTransceiver(): Successfully set codec preferences.\n");

        // Print the details of the caps (for debugging)
        gchar *caps_str = gst_caps_to_string(caps);
        printf("WssStateMachine::onNewTransceiver(): Codec preferences: %s\n", caps_str);
        g_free(caps_str);

        // Unref the caps after setting it
        gst_caps_unref(caps);
    } else {
        printf("WssStateMachine::onNewTransceiver(): Failed to create codec preferences.\n");
    }
    */
}


void WssStateMachine::onIncomingStream(GstElement *webrtc, GstPad *pad, WssStateMachine * hub) {
    
    printf("WssStateMachine::onIncomingStream(): A pad has been added to the webrtcbin module for an incoming RTP stream.\n");

    if (GST_PAD_DIRECTION(pad) != GST_PAD_SRC) {
        printf("WssStateMachine::onIncomingStream(): Huh? This should not happen.\n");
        return;
    }

    GstElement * fakesink = NULL;
    GstPad * sinkpad = NULL;

    fakesink = gst_element_factory_make("fakesink", NULL);
    if (!fakesink) {
        printf("WssStateMachine::onIncomingStream(): Failed to create fakesink element.\n");
        return;
    }


    g_assert_nonnull(fakesink);

    gst_bin_add(GST_BIN(this->pipelineBinElement), fakesink);
    gst_element_sync_state_with_parent(fakesink);
    
    sinkpad = gst_element_get_static_pad(fakesink, "sink");
    if (!sinkpad) {
        printf("WssStateMachine::onIncomingStream(): Failed to get sink pad from decodebin.\n");
        return;
    }

    if (gst_pad_link(pad, sinkpad) != GST_PAD_LINK_OK) {
        printf("WssStateMachine::onIncomingStream(): Failed to link pad to decodebin sink.\n");
    } else {
        printf("WssStateMachine::onIncomingStream(): Successfully linked pad to decodebin sink.\n");
    }
    printf("WssStateMachine::onIncomingStream(): unrefing sinkpad.\n");
    gst_object_unref(sinkpad);

    // g_signal_connect(decodebin, "pad-added", G_CALLBACK(WssStateMachine::onDecodedIncomingStreamStatic), this);
}






void WssStateMachine::onStreamStatusMessage(GstBus * bus, GstMessage * msg, gpointer userData) {
    
    printf("WssStateMachine::onStreamStatusMessage(): Checking for stream status messages.\n");

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
        printf("WssStateMachine::onStreamStatusMessage(): Got a stream status message from <<%s>>, Type: <<%d>>\n", name ? name : "HUH", type);
        g_free(name);
    } else {
        printf("WssStateMachine::onStreamStatusMessage(): Oops!!!\n");
    }
}



void WssStateMachine::onErrorMessage(GstBus * bus, GstMessage * msg, gpointer userData) {

    printf("WssStateMachine::onErrorMessage(): ERROR!!\n");

    if ( GST_MESSAGE_TYPE(msg) == GST_MESSAGE_ERROR ) {

        GError * err = NULL;
        gchar * debugInfo = NULL;

        gst_message_parse_error(msg, &err, &debugInfo);

        printf("WssStateMachine::onErrorMessage(): Error <<%s>> from <<%s>>, Debug info: <<%s>>.\n", err->message, GST_OBJECT_NAME(msg->src), debugInfo ? debugInfo : "NO DEBUG INFO");

        g_error_free(err);
        g_free(debugInfo);

    } else {
        printf("WssStateMachine::onErrorMessage(): Oops, this should not happen!!\n");
    }
}



void WssStateMachine::onEndOfStreamMessage(GstBus * bus, GstMessage * msg, gpointer userData) {
    printf("WssStateMachine::onEndOfStreamMessage(): HERE!!!!!!!  Not implemented.\n");

}




/* -------------------------------------------------------------------------- */
/*                     MARK: Constructing WebRTC Pipeline                     */
/* -------------------------------------------------------------------------- */





void WssStateMachine::constructWebRtcPipeline() {

    GstStateChangeReturn ret;
    GError *error = NULL;

        // #define RTP_CAPS_OPUS "application/x-rtp,media=audio,encoding-name=OPUS,payload=111"
    // #define RTP_CAPS_VP9 "application/x-rtp,media=video,encoding-name=VP9,payload=98"

    #define STUN_SERVER " stun-server=stun://stun.l.google.com:19302 "
    // #define RTP_CAPS_OPUS "application/x-rtp,media=audio,encoding-name=OPUS,payload="
    #define CAMERA_DEVICE "/dev/video1"
    #define RTP_CAPS_VP9 "application/x-rtp,media=video,encoding-name=VP9,payload="
    #define RTP_CAPS_VP8 "application/x-rtp,media=video,encoding-name=VP8,payload="
    #define RTP_CAPS_H264 "application/x-rtp,media=video,encoding-name=H264,payload="
    
    printf("mike made this!\n");

    /* h264 Software Encoder (openh264) */

    pipelineBinElement = NULL;

    printf("Creating pipeline");
        pipelineBinElement = gst_parse_launch(
        "webrtcbin bundle-policy=max-bundle name=sendrecv "
        "v4l2src device=/dev/video1 name=src ! video/x-raw,width=640,height=480,format=YUY2,framerate=30/1 ! "
        "videoconvert name=convert ! "
        "openh264enc ! video/x-h264,width=640,height=480,profile=baseline ! rtph264pay config-interval=1 pt=102 name=payloader ! "
        "application/x-rtp,media=video,encoding-name=H264,payload=102 ! sendrecv. ", &error);


    if (error || !pipelineBinElement) {
        printf("Error constructing pipeline: %s\n", error->message);
        g_clear_error(&error);
        if (pipelineBinElement) {
            gst_object_unref(pipelineBinElement);
            pipelineBinElement = NULL;
        }
        return;
    }

    // Get webrtcbin element
    webrtcElement = gst_bin_get_by_name(GST_BIN(pipelineBinElement), "sendrecv");
    if (!webrtcElement) {
        printf("Failed to get webrtcbin from pipeline\n");
        gst_object_unref(pipelineBinElement);
        pipelineBinElement = NULL;
        return;
    }

    printf("mike made this!\n");

    // Connect signals for negotiation and ICE handling
    g_signal_connect(webrtcElement, "on-data-channel", G_CALLBACK(WssStateMachine::onDatachannelCreatedStatic), this);
    g_signal_connect(webrtcElement, "on-negotiation-needed", G_CALLBACK(WssStateMachine::onNegotiationNeededStatic), this);
    g_signal_connect(webrtcElement, "on-ice-candidate", G_CALLBACK(WssStateMachine::onIceCandidateStatic), this);
    g_signal_connect(webrtcElement, "notify::ice-gathering-state", G_CALLBACK(WssStateMachine::onIceGatheringStateNotifyStatic), this);
    g_signal_connect(webrtcElement, "on-new-transceiver", G_CALLBACK(WssStateMachine::onNewTransceiverStatic), this);
    g_signal_connect(webrtcElement, "pad-added", G_CALLBACK(WssStateMachine::onIncomingStreamStatic), this);
    g_signal_connect(webrtcElement, "pad-removed", G_CALLBACK(WssStateMachine::onRemoveStreamStatic), this);

    // attach other callbacks

    GstBus *pipelineBus = gst_pipeline_get_bus(GST_PIPELINE(pipelineBinElement));
    gst_bus_enable_sync_message_emission(pipelineBus);
    gst_bus_add_signal_watch(pipelineBus);

    g_signal_connect(pipelineBus, "sync-message::stream-status", G_CALLBACK(WssStateMachine::onStreamStatusMessageStatic), this);
    g_signal_connect(pipelineBus, "message::error", G_CALLBACK(WssStateMachine::onErrorMessageStatic), this);
    g_signal_connect(pipelineBus, "message::eos", G_CALLBACK(WssStateMachine::onEndOfStreamMessageStatic), this);

    // Set pipeline to PLAYING state
    ret = gst_element_set_state(pipelineBinElement, GST_STATE_PLAYING);
    if (ret == GST_STATE_CHANGE_FAILURE) {
        printf("Failed to set pipeline to PLAYING state\n");
        gst_object_unref(pipelineBinElement);
        pipelineBinElement = NULL;
        return;
    }

    printf("Pipeline is constructed and set to PLAYING state.\n");

    return;
}





/*
// mike made this
void setEngagedConnectionId(const char * id) {

	if ( id == NULL || strlen(id) < 4 ) {
		//self->engagedConnectionId = "";
	} else {
		//self->engagedConnectionId = id;
	}
}

*/


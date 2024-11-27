#pragma once

#include <iostream>
#include <string>
#include <memory>

// #include <glib.h>
// #include <glib-unix.h>
#include <gst/gst.h>
#define GST_USE_UNSTABLE_API
#include <libsoup/soup.h>
#include <gst/sdp/sdp.h>

#include <gst/webrtc/webrtc.h>
// #include <boost/asio.hpp>
// #include <boost/bind/bind.hpp>

// #define AUTHENTICATION_SERVER
#define WSS_URL "wss://guident.bluepepper.us:8445" // 8848
#define AUTH_EMAIL "3c25ca89-3fc6-4c54-9588-fb30a363f0c5"
#define AUTH_PW "0e0qPwwGH10fpgnM"
#define NAME "gabriel"
#define CREDENTIAL "whaddaya"

// #define AUTH_ACCESS_TOKEN "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4ZmMzNjRjLTA1MDctNDg1Ni05ZTEzLTZmYmViNmM0NjBhNSIsInByb3BlcnR5X29uZSI6MjEsInByb3BlcnR5X3R3byI6MSwiaXNzdWVkX2F0IjoiMjAyNC0wNy0zMVQxNDoyOTowNy45MTY1ODYzODRaIiwiZXhwaXJlZF9hdCI6IjIwMjQtMDgtMDFUMTQ6Mjk6MDcuOTE2NTg2Mzg0WiJ9.-upm4x-c_4K8UUbR8ICzQlgaicAEKy45Xu20TyyFZLk"


namespace GuidentMessageTypes {
    constexpr const char* REGISTER = "register";
    constexpr const char* NOTIFY = "notify";
    constexpr const char* ENGAGE_OFFER = "engage-offer";
    constexpr const char* ENGAGE_ANSWER = "engage-answer";
    constexpr const char* ENGAGE_ACK = "engage-ack";
    constexpr const char* TAKEOVER = "takeover";
    constexpr const char* RELEASE = "release";
    constexpr const char* DISENGAGE = "disengage";
    constexpr const char* UNKNOWN = "unknown";
}

namespace GuidentMsgEventTypes {
    constexpr const char* CONNECTED = "connected";
    constexpr const char* REGISTERED = "registered";
    constexpr const char* REJECTED = "rejected";
    constexpr const char* ENGAGED = "engaged";
    constexpr const char* DISENGAGED = "disengaged";
    constexpr const char* TAKEN_OVER = "taken-over";
    constexpr const char* RELEASED = "released";
    constexpr const char* STATUS = "status";
    constexpr const char* ICE_CANDIDATE = "ice-candidate";
    constexpr const char* DISCONNECTED = "disconnected";
    constexpr const char* UNKNOWN = "unknown";
}

namespace GuidentMsgEndpointTypes {
    constexpr const char* VEHICLE = "vehicle";
    constexpr const char* MONITOR = "monitor";
    constexpr const char* UNKNOWN = "unknown";
}

namespace GuidentMsgStatusTypes {
    constexpr const char* UNKNOWN = "unknown";
}

class WssStateMachine {

    static WssStateMachine * __instance;

    const char* myConnectionId;
    const char* peerConnectionId;
    std::string engagedConnectionId;
    const char* myUsername;
    const char* myPassword;
    const char* myEndpointId;

    // std::string authUserEmail;
    // std::string authPassword;
    std::string authAccessToken;
    bool isAuthenticated;
    int localMessageSequence = 0;
    const gchar* pad_name;
    GstElement *selector;

    /* Localization */
    float defaultLongitude;
    float defaultLatitude;
    float currentLatitude;
    float currentLongitude;
    int randomLatLonCounter;

    /* -------------------------- MARK: GLib Variables -------------------------- */
    // GMainLoop * mainLoop;

    /* ------------------------ MARK: Websocket Variables ----------------------- */
    SoupWebsocketConnection * websocketConnection;
    SoupLogger *logger;
    SoupMessage *message;
    SoupSession *session;
    SoupSession * preconnectSession;
    time_t lastPongReceived;
    time_t connectionAttemptStartedAt;

    // boost::asio::io_context io_context_;
    // boost::asio::deadline_timer statusNotifyTimer_; 
    guint statusNotifyTimerId;

    /* ------------------------- MARK: WebRTC Variables ------------------------- */
    GstElement * pipelineBinElement;
    GstElement * webrtcElement;
    std::string engagementOfferSdp;
    bool negotiationDone;

    /* ------------------------- MARK: Static Callbacks ------------------------- */
    static void onWssServerConnected(GObject *conn, GAsyncResult *res, gpointer userData);
    static void onWssServerDisconnected(SoupWebsocketConnection *conn, gpointer userData);
    static void onWebsocketMessage(SoupWebsocketConnection *conn, SoupWebsocketDataType type, GBytes *msg, gpointer userData);
    static void onWebsocketPong(SoupWebsocketConnection *conn, GBytes *msg, gpointer userData);
    static void onNegotiationNeededStatic(GstElement * webrtc, gpointer userData);
    static void onOfferSetStatic(GstPromise * promise, gpointer userData);
    static void onAnswerCreatedStatic(GstPromise * promise, gpointer userData);
    static void onAnswerSetStatic(GstPromise * promise, gpointer userData);
    static void onIceCandidateStatic(GstElement * webrtc, guint mlineIndex, gchar * candidate, gpointer userData);
    static void onIceGatheringStateNotifyStatic(GstElement * webrtc, GParamSpec * pspec, gpointer userData);
    static void onNewTransceiverStatic(GstElement * webrtc, GstWebRTCRTPTransceiver * trans, gpointer userData);
    static void onIncomingStreamStatic(GstElement * webrtc, GstPad * pad, WssStateMachine * hub);
    //static void onDecodedIncomingStreamStatic(GstElement * decodebin, GstPad * pad, WssStateMachine * hub);
    static void onStreamStatusMessageStatic(GstBus * bus, GstMessage * msg, gpointer userData);
    static void onErrorMessageStatic(GstBus * bus, GstMessage * msg, gpointer userData);
    static void onEndOfStreamMessageStatic(GstBus * bus, GstMessage * msg, gpointer userData);

    void onStatusNotifyTimerTimeout();
    void sendWssMessage(const std::string &messageType, const std::string &destinationId = "");
    void sendWssIceCandidateMessage(guint mLineIndex, const gchar * candidate);
    // static void sendSignalingMessageStatic(const gchar* message);

    static void onDatachannelCreatedStatic(GstElement *webrtcbin, GstWebRTCDataChannel *dc, gpointer user_data);
    static void on_data_channel_message_string_static(GstWebRTCDataChannel *channel, gchar *message, gpointer user_data);
    void onDataChannelCreated(GstElement *webrtcbin, GstWebRTCDataChannel *dc, gpointer user_data);
    void on_data_channel_message_string(GstWebRTCDataChannel *channel, gchar *message, gpointer user_data);
    void switch_input_pad(GstElement *selector, const gchar *padded_name);



public:

    WssStateMachine();
    ~WssStateMachine();

    void start();

    static WssStateMachine * Instance();
    GstElement * getPipeline();
    //std::pair<double, double> getNextRandomLatLon();
    void resetEverything();
    void resetWebrtcPipeline();

    // mike made this
    //void setEngagedConnectionId(const char * id);
    
    /* ----------------------------- MARK: Websocket ---------------------------- */
    void authenticate();
    void connectWss();
    void closeConnection();
    void cancelConnection();
    void sendSdpAnswerThroughWss(const char * sdp);


    /* ------------------------------ MARK: WebRTC ------------------------------ */
    void onNegotiationNeeded(GstElement * webrtc, gpointer offerSdpFreeAfterUse);
    void onOfferSet(GstPromise * promise, gpointer userData);
    void onAnswerCreated (GstPromise * promise, gpointer userData);
    void onAnswerSet(GstPromise * promise, gpointer userData);
    const char * createCompleteAnswerMessage(const char* sdp);
    void onIceCandidate(GstElement * webrtc, guint mlineindex, gchar * candidate, gpointer userData);
    void onIceGatheringStateNotify(GstElement * webrtc, GParamSpec * pspec, gpointer userData);

    void onNewTransceiver(GstElement * webrtc, GstWebRTCRTPTransceiver * trans, gpointer userData);
    void onIncomingStream(GstElement *webrtc, GstPad *pad, WssStateMachine * hub);
    //void onDecodedIncomingStream(GstElement *decodebin, GstPad *pad, WssStateMachine * hub);
    void onStreamStatusMessage(GstBus * bus, GstMessage * msg, gpointer userData);
    void onErrorMessage(GstBus * bus, GstMessage * msg, gpointer userData);
    void onEndOfStreamMessage(GstBus * bus, GstMessage * msg, gpointer userData);

    void constructWebRtcPipeline();

};


#include "GstEndpointConnectingState.h"
#include "GstEndpointConnectedState.h"
#include "GstEndpointStartState.h"
#include "GstWebRtcEndpointHub.h"

using namespace guident;

void GstEndpointConnectingState::onEnter() {
	Log::Inst().log("ENTERING STATE %s", getStateName());
	GstWebRtcEndpointHub::Instance()->setTimer(10);
}

void GstEndpointConnectingState::onExit() {
	Log::Inst().log("EXITING STATE %s", getStateName());
}

void GstEndpointConnectingState::onConnected() {
	GstWebRtcEndpointHub::Instance()->clearTimer();
	Log::Inst().log("GstEndpointConnectingState::onConnected() CONNECTED!.");
        std::shared_ptr<GstEndpointConnectedState> newState = std::make_shared<GstEndpointConnectedState>();
        GstWebRtcEndpointHub::Instance()->transition(newState);
}

void GstEndpointConnectingState::onDisconnected() {
	GstWebRtcEndpointHub::Instance()->clearTimer();
	Log::Inst().log("GstEndpointConnectingState::onDisconnected() CONNECTION FAILED.");
        std::shared_ptr<GstEndpointStartState> newState = std::make_shared<GstEndpointStartState>();
        GstWebRtcEndpointHub::Instance()->transition(newState);
}


void GstEndpointConnectingState::onTimeout() {
	GstWebRtcEndpointHub::Instance()->clearTimer();
	Log::Inst().log("GstEndpointConnectingState::onTimeout() Timer expired.");
	GstWebRtcEndpointHub::Instance()->cancelConnection();
        std::shared_ptr<GstEndpointStartState> newState = std::make_shared<GstEndpointStartState>();
        GstWebRtcEndpointHub::Instance()->transition(newState);
}


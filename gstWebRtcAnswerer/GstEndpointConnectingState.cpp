
#include "GstEndpointConnectingState.h"
#include "GstWebRtcEndpointHub.h"

using namespace guident;

void GstEndpointConnectingState::onEnter() {
	Log::Inst().log("ENTERING STATE %s", getStateName());
}

void GstEndpointConnectingState::onExit() {
	Log::Inst().log("EXITING STATE %s", getStateName());
}

void GstEndpointConnectingState::onConnected() {
	Log::Inst().log("GstEndpointConnectingState::onConnected() CONNECTED!.");
}

void GstEndpointConnectingState::onDisconnected() {
	Log::Inst().log("GstEndpointConnectingState::onDisconnected() Disconnected.");
}

void GstEndpointConnectingState::onTimeout() {
	Log::Inst().log("GstEndpointConnectingState::onTimeout() Timer expired.");
}


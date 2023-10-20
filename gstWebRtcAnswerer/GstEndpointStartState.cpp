
#include "GstEndpointStartState.h"
#include "GstEndpointConnectingState.h"
#include "GstWebRtcEndpointHub.h"

using namespace guident;

void GstEndpointStartState::onEnter() {
	Log::Inst().log("ENTERING STATE %s", getStateName());
	GstWebRtcEndpointHub::Instance()->setTimer(5);
}

void GstEndpointStartState::onExit() {
	Log::Inst().log("EXITING STATE %s", getStateName());
}

void GstEndpointStartState::onTimeout() {
	Log::Inst().log("GstEndpointStartState::onTimeout() Timer expired. Starting connection to server.");
	GstWebRtcEndpointHub::Instance()->connectToServerAsync();
	std::shared_ptr<GstEndpointConnectingState> newState = std::make_shared<GstEndpointConnectingState>();
	GstWebRtcEndpointHub::Instance()->transition(newState);
}


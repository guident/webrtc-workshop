
#include "GstEndpointEngagingState.h"
#include "GstEndpointEngagedState.h"
#include "GstEndpointStartState.h"
#include "GstWebRtcEndpointHub.h"

using namespace guident;

void GstEndpointEngagingState::onEnter() {
	Log::Inst().log("ENTERING STATE %s", getStateName());
	GstWebRtcEndpointHub::Instance()->setTimer(20);
}

void GstEndpointEngagingState::onExit() {
	Log::Inst().log("EXITING STATE %s", getStateName());
}

void GstEndpointEngagingState::onEngaged() {
	GstWebRtcEndpointHub::Instance()->clearTimer();
	Log::Inst().log("GstEndpointEngagingState::onEngaged() ENGAGED!.");
        std::shared_ptr<GstEndpointEngagedState> newState = std::make_shared<GstEndpointEngagedState>();
        GstWebRtcEndpointHub::Instance()->transition(newState);
}

void GstEndpointEngagingState::onTimeout() {
	GstWebRtcEndpointHub::Instance()->clearTimer();
	GstWebRtcEndpointHub::Instance()->resetEverything();
	Log::Inst().log("GstEndpointEngagingState::onTimeout() OOPS, TIMEOUT, ENGAGEMENT FAILED.");
        std::shared_ptr<GstEndpointStartState> newState = std::make_shared<GstEndpointStartState>();
        GstWebRtcEndpointHub::Instance()->transition(newState);
}


void GstEndpointEngagingState::onDisconnected() {
	GstWebRtcEndpointHub::Instance()->clearTimer();
	GstWebRtcEndpointHub::Instance()->resetEverything();
	Log::Inst().log("GstEndpointEngagingState::onTimeout() Timer expired.");
}


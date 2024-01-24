
#include "GstEndpointConnectedState.h"
#include "GstEndpointEngagingState.h"
#include "GstEndpointStartState.h"
#include "GstWebRtcEndpointHub.h"

using namespace guident;

void GstEndpointConnectedState::onEnter() {
	Log::Inst().log("ENTERING STATE %s", getStateName());
}

void GstEndpointConnectedState::onExit() {
	Log::Inst().log("EXITING STATE %s", getStateName());
}

void GstEndpointConnectedState::onDisconnected() {
	Log::Inst().log("GstEndpointConnectedState::onDisconnected() DISCONNECTED!.");
	std::shared_ptr<GstEndpointStartState> newState = std::make_shared<GstEndpointStartState>();
	GstWebRtcEndpointHub::Instance()->transition(newState);
}

void GstEndpointConnectedState::onOfferReceived() {
	Log::Inst().log("GstEndpointConnectedState::onOffer() An offer was received!");
	GstWebRtcEndpointHub::Instance()->constructWebRtcPipeline();
	std::shared_ptr<GstEndpointEngagingState> newState = std::make_shared<GstEndpointEngagingState>();
	GstWebRtcEndpointHub::Instance()->transition(newState);
}


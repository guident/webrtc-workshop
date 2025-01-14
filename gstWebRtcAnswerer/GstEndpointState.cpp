#include "GstEndpointEngagedState.h"
#include "GstEndpointStartState.h"
#include "GstWebRtcEndpointHub.h"

using namespace guident;

void GstEndpointState::onEnter() {
	Log::Inst().log("ENTERING STATE %s", getStateName());
	//GstWebRtcEndpointHub::Instance()->setTimer(5);
}

void GstEndpointState::onExit() = 0;

void GstEndpointState::onConnected() {
    Log::Inst().log("GstEndpointState::onConnected(): Not implemented!");
}

void GstEndpointState::onOfferReceived() {
    Log::Inst().log("GstEndpointState::onOffer() An offer was received!");
	GstWebRtcEndpointHub::Instance()->constructWebRtcPipeline();
	std::shared_ptr<GstEndpointState> newState = std::make_shared<GstEndpointState>();
	GstWebRtcEndpointHub::Instance()->transition(newState);
}

void GstEndpointState::onEngaged() {
    Log::Inst().log("GstEndpointState::onEngaged(): Not implemented!");
}
    
void GstEndpointState::onAnswerAck() {
    Log::Inst().log("GstEndpointState::onAnswerAck(): Not implemented!");
}

void GstEndpointState::onDisconnected() {
    Log::Inst().log("GstEndpointState::onDisconnected(): Not implemented!");
}

void GstEndpointState::onTimeout() {
    Log::Inst().log("GstEndpointState::onTimeout(): Not implemented!");
}

const char * getStateName() {
    return(stateName.c_str());
}
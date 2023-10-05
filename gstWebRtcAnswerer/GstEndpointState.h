#pragma once 

#include <string>
#include "Log.h"


namespace guident {


class GstEndpointState {

public:

	GstEndpointState(const char* name) {
		stateName = name;
	}

	virtual void onEnter() = 0;

	virtual void onExit() = 0;

	virtual void onConnected() {
		Log::Inst().log("GstEndpointState::onConnected(): Not implemented!");
	}

	virtual void onOffer(std::string offerJson) {
		Log::Inst().log("GstEndpointState::onOffer(): Not implemented!");
	}

	virtual void onNegotiationNeeded() {
		Log::Inst().log("GstEndpointState::onNegotiationNeeded(): Not implemented!");
	}

	virtual void onIceGatheringStateNotify() {
		Log::Inst().log("GstEndpointState::onIceGatheringStateNotify(): Not implemented!");
	}

	virtual void onNewTransceiver() {
		Log::Inst().log("GstEndpointState::onNewTransceiver(): Not implemented!");
	}

	virtual void onIncomingStream() {
		Log::Inst().log("GstEndpointState::onIncomingStream(): Not implemented!");
	}

	virtual void onDataChannel() {
		Log::Inst().log("GstEndpointState::onDataChannel(): Not implemented!");
	}

	virtual void onAnswerAck() {
		Log::Inst().log("GstEndpointState::onAnswerAck(): Not implemented!");
	}

	virtual void onDisconnected() {
		Log::Inst().log("GstEndpointState::onDisconnected(): Not implemented!");
	}

	virtual void onTimeout() {
		Log::Inst().log("GstEndpointState::onTimeout(): Not implemented!");
	}

	const char * getStateName() {
		return(stateName.c_str());
	}

private:

	std::string stateName;

};


}

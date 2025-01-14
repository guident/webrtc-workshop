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

	virtual void onOfferReceived() {
		Log::Inst().log("GstEndpointState::onOfferReceived(): Not implemented!");
	}

	virtual void onEngaged() {
		Log::Inst().log("GstEndpointState::onEngaged(): Not implemented!");
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

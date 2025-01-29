#pragma once

#include "GstEndpointState.h"

namespace guident {


class GstEndpointEngagedState : public GstEndpointState {

public:

	GstEndpointEngagedState() : GstEndpointState("ENGAGED"), idx(0L) { }

	void onEnter();

	void onExit();

	void onOfferReceived();

	void onTimeout();

	void onDisconnected();

private:

	unsigned long idx;

};


}

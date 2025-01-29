#pragma once

#include "GstEndpointState.h"

namespace guident {


class GstEndpointConnectedState : public GstEndpointState {

public:

	GstEndpointConnectedState() : GstEndpointState("CONNECTED") { }

	void onEnter();

	void onExit();

	void onDisconnected();

	void onOfferReceived();

};


}

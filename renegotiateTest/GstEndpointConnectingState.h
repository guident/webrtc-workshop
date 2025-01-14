#pragma once

#include "GstEndpointState.h"

namespace guident {


class GstEndpointConnectingState : public GstEndpointState {

public:

	GstEndpointConnectingState() : GstEndpointState("CONNECTING") { }

	void onEnter();

	void onExit();

	void onConnected();

	void onDisconnected();

	void onTimeout();

};


}

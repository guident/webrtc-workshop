#pragma once

#include "GstEndpointState.h"

namespace guident {


class GstEndpointEngagingState : public GstEndpointState {

public:

	GstEndpointEngagingState() : GstEndpointState("ENGAGING") { }

	void onEnter();

	void onExit();

	void onEngaged();

	void onTimeout();

	void onDisconnected();

};


}

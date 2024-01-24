#pragma once

#include "GstEndpointState.h"

namespace guident {


class GstEndpointEngagedState : public GstEndpointState {

public:

	GstEndpointEngagedState() : GstEndpointState("ENGAGING"), idx(0L) { }

	void onEnter();

	void onExit();

	void onTimeout();

	void onDisconnected();

private:

	unsigned long idx;

};


}

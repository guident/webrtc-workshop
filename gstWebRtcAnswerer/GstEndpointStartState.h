#pragma once

#include "GstEndpointState.h"

namespace guident {


class GstEndpointStartState : public GstEndpointState {

public:

	GstEndpointStartState() : GstEndpointState("START") { }

	void onEnter();

	void onExit();

	void onTimeout();

};


}

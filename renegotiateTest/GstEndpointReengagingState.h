#pragma once

#include "GstEndpointState.h"

namespace guident {


class GstEndpointReengagingState : public GstEndpointState {

public:

	GstEndpointReengagingState() : GstEndpointState("RE-ENGAGING") { }

	void onEnter();

	void onExit();

	void onEngaged();

	void onTimeout();

	void onDisconnected();

};


}

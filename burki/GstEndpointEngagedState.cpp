
#include "GstEndpointEngagedState.h"
#include "GstEndpointStartState.h"
#include "GstWebRtcEndpointHub.h"

using namespace guident;

void GstEndpointEngagedState::onEnter() {
	Log::Inst().log("ENTERING STATE %s", getStateName());
	GstWebRtcEndpointHub::Instance()->setTimer(5);
}

void GstEndpointEngagedState::onExit() {
	Log::Inst().log("EXITING STATE %s", getStateName());
}


void GstEndpointEngagedState::onTimeout() {
	GstWebRtcEndpointHub::Instance()->clearTimer();
	int tt = 5;
	switch ( idx ) {

		case 0:
			tt = 5;
			Log::Inst().log("GstEndpointEngagedState::onTimeout() 0: Dropping some frames.");
			//GstWebRtcEndpointHub::Instance()->startDroppingSomeFrames();
			break;
		case 1:
			tt = 10;
			Log::Inst().log("GstEndpointEngagedState::onTimeout() 1: No longer dropping frames.");
			//GstWebRtcEndpointHub::Instance()->stopDroppingFrames();
			break;
		case 2:
			tt = 20;
			//Log::Inst().log("GstEndpointEngagedState::onTimeout() 2: Forcing an IDR frame!.");
			//GstWebRtcEndpointHub::Instance()->forceIdrFrame();
			break;

	}
	idx++;
	idx = idx % 3;
	GstWebRtcEndpointHub::Instance()->setTimer(tt);
}


void GstEndpointEngagedState::onDisconnected() {
	GstWebRtcEndpointHub::Instance()->clearTimer();
	GstWebRtcEndpointHub::Instance()->resetEverything();
	Log::Inst().log("GstEndpointEngagedState::onTimeout() Timer expired.");
}


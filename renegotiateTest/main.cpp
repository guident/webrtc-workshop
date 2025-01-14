

#include "Log.h"
#include "GstWebRtcEndpointHub.h"


using namespace guident;

int main() {

	printf("Hello!!\n");
	Log::Inst().log("Helo!!!!!\n");

	GstWebRtcEndpointHub::Instance()->init();
	GstWebRtcEndpointHub::Instance()->run();

	return(0);
}

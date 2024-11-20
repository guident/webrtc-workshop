#include "pcmAnswererHub.h"
#include "Statemachine/pcmAnswererState.h"
#include "Statemachine/pcmStartState.h"

PcmAnswererHub * PcmAnswererHub::__instance = NULL;

PcmAnswererHub::PcmAnswererHub():
    __initialized(false),
    __state(new PcmStartState()),
    timerId(0),
    clockSecondsTicked(0LL),
    deadlineTimerTicks(0LL),
    mainLoop(NULL) {

}

PcmAnswererHub * PcmAnswererHub::Instance() {
    if (__instance == NULL) {
        __instance = new PcmAnswererHub;
    }
    return __instance;
}

PcmAnswererHub::~PcmAnswererHub() {}

void PcmAnswererHub::init(const char * uuid, const char * pwd, int pt) {

    this->vehicleUuid = uuid;
    this->password = pwd;
    this->pipelineType = pt;

    printf("PcmAnswererHub::init(): Initiating Passenger Communication Module Hub...\n");
    if ( __initialized ) return;
    __state->onEnter();
    gst_init(NULL, NULL);
    __initialized = true;
} 

void PcmAnswererHub::run() {
    printf("PcmAnswererHub::run(): Instantiating the main loop...\n");

    // gmain loop
    mainLoop = g_main_loop_new(NULL, FALSE);
    g_assert(mainLoop != NULL);

    // starting onClockTick timer
    printf("PcmAnswererHub::run(): Starting Timer...\n");
    timerId = g_timeout_add(1000, (GSourceFunc)onClockTickStatic, this);

    wssStMch.start();

    g_main_loop_run(mainLoop);
    g_main_loop_unref(mainLoop);

}

std::shared_ptr<PcmAnswererState> PcmAnswererHub::getState() {
    return(__state);
}


WssStateMachine& PcmAnswererHub::getWssStateMachine() {
    return(wssStMch);
}

void PcmAnswererHub::transition(const std::shared_ptr<PcmAnswererState> newState) {
    printf("PcmAnswererHub::transition(): Transitioning from state <<%s>> to state <<%s>>.\n", __state->getStateName(), newState->getStateName());
    __state->onExit();
    __state = newState;
    __state->onEnter();

}

int PcmAnswererHub::onClockTickStatic(void *userData) {
    
    PcmAnswererHub* self = static_cast<PcmAnswererHub*>(userData);
    self->onClockTick();
    return 0;
}

void PcmAnswererHub::onClockTick() {

    printf("PcmAnswererHub::onClockTick(): clock ticked!\n");
    if (timerId > 0) {
        g_source_remove(timerId);
    }
    timerId = 0;
    clockSecondsTicked++;
    if (deadlineTimerTicks > 0LL && deadlineTimerTicks <= clockSecondsTicked) {
        deadlineTimerTicks = 0LL;
        __state->onTimeout();
    }
    timerId = g_timeout_add(1000, (GSourceFunc)onClockTickStatic, this);
}


void PcmAnswererHub::setTimer(unsigned long seconds) {

    if ( seconds == 0L || seconds > 300 ) {
        printf("PcmAnswererHub::setTimer(): Oops bad vale for setting timer: <<%lu>>.\n", seconds);
        return;
    }
    if ( deadlineTimerTicks != 0LL ) {
        printf("PcmAnswererHub::setTimer(): Warning! Timer was already set!!\n");
    }
    deadlineTimerTicks = clockSecondsTicked + seconds;
}

void PcmAnswererHub::clearTimer() {
    deadlineTimerTicks = 0LL;
}

void PcmAnswererHub::resetEverything() {
    // printf("PcmAnswererHub::resetEverything(): I have not been implemented.\n");
    wssStMch.resetEverything();
}

void PcmAnswererHub::resetWebrtcPipeline() {
    wssStMch.resetWebrtcPipeline();
}

void PcmAnswererHub::authenticateAndConnectWss() {
    wssStMch.authenticate();
}

void PcmAnswererHub::closeConnection() {
    wssStMch.closeConnection();
}

void PcmAnswererHub::cancelConnection() {
    wssStMch.cancelConnection();
}

void PcmAnswererHub::constructWebRtcPipeline() {
    wssStMch.constructWebRtcPipeline();
}



void PcmAnswererHub::setEngagementConnectionId(const char * id) {
	if ( id == NULL || strlen(id) < 5 ) {
		engagementConnectionId = "";
	} else {
		engagementConnectionId = id;
	}
}


std::string PcmAnswererHub::getEngagementConnectionId() {
	return(engagementConnectionId);
}

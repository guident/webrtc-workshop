#include "pcmEngagedState.h"
#include "pcmStartState.h"
#include "../pcmAnswererHub.h"
#include "pcmConnectedState.h"
#include "pcmConnectingState.h"

void PcmEngagedState::onEnter() {
    printf("ENTERING STATE <<%s>>\n", getStateName());
    //PcmAnswererHub::Instance()->setTimer(5);
}

void PcmEngagedState::onExit() {
    printf("EXITING STATE <<%s>>\n", getStateName());
}


void PcmEngagedState::onTimeout() {
    PcmAnswererHub::Instance()->clearTimer();
    int tt = 5;
    switch ( idx ) {

        case 0:
            tt = 5;
            printf("PcmEngagedState::onTimeout() 0: Dropping some frames.\n");
            // PcmAnswererHub::Instance()->restartCamera();
            break;
        case 1:
            tt = 10;
            printf("PcmEngagedState::onTimeout() 1: No longer dropping frames.\n");
            // PcmAnswererHub::Instance()->stopDroppingFrames();
            break;
        case 2:
            tt = 20;
            //printf("PcmEngagedState::onTimeout() 2: Forcing an IDR frame!.\n");
            //PcmAnswererHub::Instance()->forceIdrFrame();
            break;

    }
    idx++;
    idx = idx % 3;
    PcmAnswererHub::Instance()->setTimer(tt);
}


void PcmEngagedState::onDisconnected() {
    PcmAnswererHub::Instance()->clearTimer();
    PcmAnswererHub::Instance()->resetEverything();
    printf("PcmEngagedState::onTimeout() Timer expired.\n");
}

void PcmEngagedState::onDisengaged() {
    printf("PcmEngagedState::onDisengaged(): Disengaging... Returning to state CONNECTED.\n");
    PcmAnswererHub::Instance()->clearTimer();
    // PcmAnswererHub::Instance()->resetEverything();
    //PcmAnswererHub::Instance()->switchToCommercialUI();
    PcmAnswererHub::Instance()->resetWebrtcPipeline();
    std::shared_ptr<PcmConnectedState> newState = std::make_shared<PcmConnectedState>();
    PcmAnswererHub::Instance()->transition(newState);
}


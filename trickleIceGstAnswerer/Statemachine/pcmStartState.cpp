#include "pcmStartState.h"
#include "pcmConnectingState.h"
#include "../pcmAnswererHub.h"

void PcmStartState::onEnter() {
    printf("ENTERING STATE <<%s>>\n", getStateName());
    PcmAnswererHub::Instance()->setTimer(5);
    // PcmAnswererHub::Instance()->createCommercialUI();
}

void PcmStartState::onExit() {
    printf("EXITING STATE <<%s>>\n", getStateName());
}

void PcmStartState::onTimeout() {
    printf("GstEndpointStartState::onTimeout() Timer expired. Starting connection to server.\n");
    PcmAnswererHub::Instance()->authenticateAndConnectWss();
    std::shared_ptr<PcmConnectingState> newState = std::make_shared<PcmConnectingState>();
    PcmAnswererHub::Instance()->transition(newState);
}

#include "pcmEngagingState.h"
#include "pcmEngagedState.h"
#include "pcmStartState.h"
#include "../pcmAnswererHub.h"

void PcmEngagingState::onEnter() {
    printf("ENTERING STATE <<%s>>\n", getStateName());
    PcmAnswererHub::Instance()->setTimer(20);
}

void PcmEngagingState::onExit() {
    printf("EXITING STATE <<%s>>\n", getStateName());
}

void PcmEngagingState::onEngaged() {
    PcmAnswererHub::Instance()->clearTimer();
    printf("PcmEngagingState::onEngaged() ENGAGED!.\n");
    std::shared_ptr<PcmEngagedState> newState = std::make_shared<PcmEngagedState>();
    PcmAnswererHub::Instance()->transition(newState);
}

void PcmEngagingState::onTimeout() {
    //PcmAnswererHub::Instance()->switchToCommercialUI();
    PcmAnswererHub::Instance()->clearTimer();
    PcmAnswererHub::Instance()->resetEverything();
    printf("PcmEngagingState::onTimeout() OOPS, TIMEOUT, ENGAGEMENT FAILED.\n");
    std::shared_ptr<PcmStartState> newState = std::make_shared<PcmStartState>();
    PcmAnswererHub::Instance()->transition(newState);
}


void PcmEngagingState::onDisconnected() {
    PcmAnswererHub::Instance()->clearTimer();
    PcmAnswererHub::Instance()->resetEverything();
    printf("PcmEngagingState::onTimeout() Timer expired.\n");
}

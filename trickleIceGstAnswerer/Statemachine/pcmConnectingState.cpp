#include "pcmConnectingState.h"
#include "pcmConnectedState.h"
#include "pcmStartState.h"
#include "../pcmAnswererHub.h"

void PcmConnectingState::onEnter() {
    printf("ENTERING STATE <<%s>>\n", getStateName());
    PcmAnswererHub::Instance()->setTimer(10);
}

void PcmConnectingState::onExit() {
    printf("EXITING STATE <<%s>>\n", getStateName());
}

void PcmConnectingState::onConnected() {
    PcmAnswererHub::Instance()->clearTimer();
    printf("PcmConnectingState::onConnected() CONNECTED!.\n");
    std::shared_ptr<PcmConnectedState> newState = std::make_shared<PcmConnectedState>();
    PcmAnswererHub::Instance()->transition(newState);
}

void PcmConnectingState::onDisconnected() {
    PcmAnswererHub::Instance()->clearTimer();
    printf("PcmConnectingState::onDisconnected() CONNECTION FAILED.\n");
    std::shared_ptr<PcmStartState> newState = std::make_shared<PcmStartState>();
    PcmAnswererHub::Instance()->transition(newState);
}


void PcmConnectingState::onTimeout() {
    PcmAnswererHub::Instance()->clearTimer();
    printf("PcmConnectingState::onTimeout() Timer expired.\n");
    PcmAnswererHub::Instance()->cancelConnection();
    std::shared_ptr<PcmStartState> newState = std::make_shared<PcmStartState>();
    PcmAnswererHub::Instance()->transition(newState);
}
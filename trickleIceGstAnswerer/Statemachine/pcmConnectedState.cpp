#include "pcmConnectedState.h"
#include "pcmEngagingState.h"
#include "pcmStartState.h"
#include "../pcmAnswererHub.h"

void PcmConnectedState::onEnter() {
    printf("ENTERING STATE <<%s>>\n", getStateName());
}

void PcmConnectedState::onExit() {
    printf("EXITING STATE <<%s>>\n", getStateName());
}

void PcmConnectedState::onDisconnected() {
    printf("PcmConnectedState::onDisconnected() DISCONNECTED!.\n");
    std::shared_ptr<PcmStartState> newState = std::make_shared<PcmStartState>();
    PcmAnswererHub::Instance()->transition(newState);
}

void PcmConnectedState::onOfferReceived() {
    printf("PcmConnectedState::onOffer() An offer was received!\n");
    PcmAnswererHub::Instance()->constructWebRtcPipeline();
    std::shared_ptr<PcmEngagingState> newState = std::make_shared<PcmEngagingState>();
    PcmAnswererHub::Instance()->transition(newState);
}

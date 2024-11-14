#pragma once

#include "pcmAnswererState.h"


class PcmConnectedState : public PcmAnswererState {

public:

    PcmConnectedState() : PcmAnswererState("CONNECTED") { }

    void onEnter();

    void onExit();

    void onDisconnected();

    void onOfferReceived();

};

#pragma once

#include "pcmAnswererState.h"

class PcmConnectingState : public PcmAnswererState {

public:

    PcmConnectingState() : PcmAnswererState("CONNECTING") { }

    void onEnter();

    void onExit();

    void onConnected();

    void onDisconnected();

    void onTimeout();

};
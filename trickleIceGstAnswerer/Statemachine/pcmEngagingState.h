#pragma once

#include "pcmAnswererState.h"


class PcmEngagingState : public PcmAnswererState {

public:

    PcmEngagingState() : PcmAnswererState("ENGAGING") { }

    void onEnter();

    void onExit();

    void onEngaged();

    void onTimeout();

    void onDisconnected();

};
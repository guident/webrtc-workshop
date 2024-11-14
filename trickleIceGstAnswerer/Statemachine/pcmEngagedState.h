#pragma once

#include "pcmAnswererState.h"


class PcmEngagedState : public PcmAnswererState {
    
    unsigned long idx;

public:

    PcmEngagedState() : PcmAnswererState("ENGAGED"), idx(0L) { }

    void onEnter();

    void onExit();

    void onTimeout();

    void onDisconnected();

    void onDisengaged();

};
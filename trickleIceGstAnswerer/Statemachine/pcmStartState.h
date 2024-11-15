#pragma once

#include "pcmAnswererState.h"

class PcmStartState : public PcmAnswererState {

public:

    PcmStartState() : PcmAnswererState("START") { }

    void onEnter();

    void onExit();

    void onTimeout();

};
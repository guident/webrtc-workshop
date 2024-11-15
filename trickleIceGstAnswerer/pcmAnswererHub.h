#pragma once

#include "wssStateMachine.h"
#include "Statemachine/pcmAnswererState.h"
#include "Statemachine/pcmStartState.h"



class PcmAnswererHub {

    PcmAnswererHub();

    bool __initialized;
    static PcmAnswererHub * __instance;
    std::shared_ptr<PcmAnswererState> __state;
    GMainLoop * mainLoop;

    WssStateMachine wssStMch;

    static int onClockTickStatic(void *userData);

    guint timerId;
    unsigned long long clockSecondsTicked;
    unsigned long long deadlineTimerTicks;


public:
    
    static PcmAnswererHub * Instance();
    ~PcmAnswererHub();

    void init(const char * uuid, const char * pwd, int pt);
    void run();

    std::shared_ptr<PcmAnswererState> getState();
    WssStateMachine& getWssStateMachine();

    void transition(const std::shared_ptr<PcmAnswererState> newState);
    void onClockTick();
    void setTimer(unsigned long seconds);
    void clearTimer();
    void resetEverything();
    void resetWebrtcPipeline();
    void authenticateAndConnectWss();
    void closeConnection();
    void cancelConnection();
    void constructWebRtcPipeline();


    std::string vehicleUuid;
    std::string password;
    int pipelineType;

   
};

#pragma once 

#include <string>
#include <memory>

class PcmAnswererState {

    std::string stateName;

public:

    PcmAnswererState(const char* name) {
        stateName = name;
    }

    virtual void onEnter() = 0;

    virtual void onExit() = 0;

    virtual void onConnected() {
        printf("PcmAnswererState::onConnected(): Not implemented!");
    }

    virtual void onOfferReceived() {
        printf("PcmAnswererState::onOfferReceived(): Not implemented!");
    }

    virtual void onEngaged() {
        printf("PcmAnswererState::onEngaged(): Not implemented!");
    }

    virtual void onAnswerAck() {
        printf("PcmAnswererState::onAnswerAck(): Not implemented!");
    }

    virtual void onDisconnected() {
        printf("PcmAnswererState::onDisconnected(): Not implemented!");
    }

    virtual void onDisengaged() {
        printf("PcmAnswererState::onDisengaged(): Not implemented!");
    }

    virtual void onTimeout() {
        printf("PcmAnswererState::onTimeout(): Not implemented!");
    }

    const char * getStateName() {
        return(stateName.c_str());
    }
};
#pragma once

#include "boost/thread.hpp"
#include "boost/thread/mutex.hpp"

#include <drogon/WebSocketController.h>
#include <drogon/PubSubService.h>
#include <drogon/HttpAppFramework.h>


namespace guident {

class BurkiConnection {

public:

	BurkiConnection(drogon::WebSocketConnectionPtr connptr);
	~BurkiConnection();

	void setEndpointId(unsigned long id);
	unsigned long getEndpointId();
	const char * getConnectionId();

private:

	void onTimerTick();

	unsigned long __endpointId;
	std::string __connectionId;
	unsigned long long __connectedAt;
	unsigned long long __lastPongReceived;

	drogon::WebSocketConnectionPtr __connection;

};

}

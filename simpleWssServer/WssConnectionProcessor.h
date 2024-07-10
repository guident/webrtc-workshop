#pragma once

#include "boost/thread/mutex.hpp"

#include <drogon/WebSocketController.h>
#include <drogon/PubSubService.h>
#include <drogon/HttpAppFramework.h>


namespace drogon {


class WssConnectionProcessor {

public:

	~WssConnectionProcessor();

	static WssConnectionProcessor * Instance();

	bool registerConnection(const WebSocketConnectionPtr wssptr);

	void unregisterConnection(const WebSocketConnectionPtr wssptr);

	void processIncomingMessage(std::string id, std::string msg);

private:

	WssConnectionProcessor();

	static WssConnectionProcessor * __instance;

	std::map<std::string, WebSocketConnectionPtr> __connections;

	boost::mutex __mutex;

};


}


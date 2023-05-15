#pragma once

#include <boost/asio.hpp>
#include <boost/thread/mutex.hpp>
#include <boost/date_time/posix_time/posix_time.hpp>

#include <drogon/WebSocketController.h>
#include <drogon/PubSubService.h>
#include <drogon/HttpAppFramework.h>

#include "BurkiConnection.h"


namespace guident {

class BurkiConnectionProcessor {

public:

	~BurkiConnectionProcessor();

	static BurkiConnectionProcessor * Instance();

	bool registerConnection(const drogon::WebSocketConnectionPtr wssptr);

	void unregisterConnection(const drogon::WebSocketConnectionPtr wssptr);

	void processIncomingMessage(std::string id, std::string msg);

private:

	BurkiConnectionProcessor();

	void onTimerCallback(const boost::system::error_code & err, boost::asio::deadline_timer* t, int * count);

	static BurkiConnectionProcessor * __instance;

	std::map<std::string, std::shared_ptr<BurkiConnection>> __connections;

	boost::mutex __mutex;

	boost::asio::io_service _ioc;

        boost::asio::deadline_timer __statusTimer;
	int __statusTimerCounter;

};


}


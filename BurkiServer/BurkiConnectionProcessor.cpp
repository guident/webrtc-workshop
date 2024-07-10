
#include <cstdio>
#include <memory>
#include <uuid/uuid.h>
#include "BurkiConnection.h"
#include "BurkiConnectionProcessor.h"


using namespace guident;
using namespace drogon;


BurkiConnectionProcessor * BurkiConnectionProcessor::__instance = NULL;


BurkiConnectionProcessor::BurkiConnectionProcessor() : __statusTimer(_ioc, boost::posix_time::milliseconds(100)), __statusTimerCounter(0) {

	__statusTimer.async_wait(boost::bind(&BurkiConnectionProcessor::onTimerCallback, this, boost::asio::placeholders::error, &__statusTimer, &__statusTimerCounter));

}


BurkiConnectionProcessor::~BurkiConnectionProcessor() {

}

BurkiConnectionProcessor * BurkiConnectionProcessor::Instance() {

	if ( __instance == NULL ) {
		__instance = new BurkiConnectionProcessor();
	}
	return(__instance);
}



bool BurkiConnectionProcessor::registerConnection(const WebSocketConnectionPtr wssptr) {

	uuid_t uuid;
	char uuid_str[37];

	try {
		boost::mutex::scoped_lock __lock(__mutex);

		if ( __connections.size() >= 2 ) {
			LOG_DEBUG <<  "BurkiConnectionProcessor::registerConnection: Oops, there are already 2 connections.";
			return(false);
		}

		std::shared_ptr<BurkiConnection> _conn = std::make_shared<BurkiConnection>(wssptr);

		__connections[std::string(_conn->getConnectionId())] = _conn;

		LOG_DEBUG <<  "BurkiConnectionProcessor::registerConnection: Registered new connection as <<" << _conn->getConnectionId() << ">>.";

		return(true);

	} catch(...) {
		LOG_DEBUG <<  "BurkiConnectionProcessor::registerConnection: Oops, exception thrown!!";
	}

	return(false);

}



void BurkiConnectionProcessor::unregisterConnection(const WebSocketConnectionPtr wssptr) {

	try {
		boost::mutex::scoped_lock __lock(__mutex);

		std::shared_ptr<std::string> wssid = wssptr->getContext<std::string>();

		std::map<std::string, std::shared_ptr<BurkiConnection>>::iterator iter = __connections.find(*wssid);
		if ( iter != __connections.end() ) {
			LOG_DEBUG <<  "BurkiConnectionProcessor::unregisterConnection: Removing connection <<" << *wssid << ">>.";
			iter = __connections.erase(iter);
		} else {
			LOG_DEBUG << "BurkiConnectionProcessor::unregisterConnection: This should not happen!!";
		}

	} catch(...) {
		LOG_DEBUG << "BurkiConnectionProcessor::unregisterConnection: Oops, exception thrown!!";
	}

	return;
}



void BurkiConnectionProcessor::processIncomingMessage(std::string id, std::string msg) {


	try {
		boost::mutex::scoped_lock __lock(__mutex);


		std::map<std::string, std::shared_ptr<BurkiConnection>>::iterator iter = __connections.find(id);


		if ( iter != __connections.end() ) {


		} else {

			LOG_ERROR << "BurkiConnectionProcessor::processIncomingMessage(): Hmmmm, this should not happen!!";
			return;
		}
		
		//LOG_DEBUG << "BurkiConnectionProcessor::processIncomingMessage(): Sending message from <<" << id << ">> to <<" << iter->first << ">>.";
		//iter->second->send(msg);

	} catch(...) {

		LOG_DEBUG << "BurkiConnectionProcessor::processIncomingMessage: Oops, exception thrown!!";
	}

}






void BurkiConnectionProcessor::onTimerCallback(const boost::system::error_code & err, boost::asio::deadline_timer* t, int * count) {

	try {

		boost::mutex::scoped_lock __lock(__mutex);

	} catch(...) {

	}


}


#include <cstdio>
#include <memory>
#include <uuid/uuid.h>
#include "WssConnectionProcessor.h"



using namespace drogon;


WssConnectionProcessor * WssConnectionProcessor::__instance = NULL;


WssConnectionProcessor::WssConnectionProcessor() {


}

WssConnectionProcessor::~WssConnectionProcessor() {

}

WssConnectionProcessor * WssConnectionProcessor::Instance() {

	if ( __instance == NULL ) {
		__instance = new WssConnectionProcessor();
	}
	return(__instance);
}

bool WssConnectionProcessor::registerConnection(const WebSocketConnectionPtr wssptr) {

	uuid_t uuid;
	char uuid_str[37];

	try {
		boost::mutex::scoped_lock __lock(__mutex);

		if ( __connections.size() >= 2 ) {
			LOG_DEBUG <<  "WssConnectionProcessor::registerConnection: Oops, there are already 2 connections.";
			return(false);
		}

		memset(uuid_str, 0, 37);
		uuid_generate(uuid);
		uuid_unparse_lower(uuid, uuid_str);

		wssptr->setContext(std::make_shared<std::string>(uuid_str));

		__connections[std::string(uuid_str)] = wssptr;

		LOG_DEBUG <<  "WssConnectionProcessor::registerConnection: Registered new connection as <<" << uuid_str << ">>.";

		return(true);

	} catch(...) {
		LOG_DEBUG <<  "WssConnectionProcessor::registerConnection: Oops, exception thrown!!";
	}

	return(false);

}

void WssConnectionProcessor::unregisterConnection(const WebSocketConnectionPtr wssptr) {

	try {
		boost::mutex::scoped_lock __lock(__mutex);

		std::shared_ptr<std::string> wssid = wssptr->getContext<std::string>();

		std::map<std::string, WebSocketConnectionPtr>::iterator iter = __connections.find(*wssid);
		if ( iter != __connections.end() ) {
			LOG_DEBUG <<  "WssConnectionProcessor::unregisterConnection: Removing connection <<" << *wssid << ">>.";
			iter = __connections.erase(iter);
		} else {
			LOG_DEBUG << "WssConnectionProcessor::unregisterConnection: This should not happen!!";
		}

	} catch(...) {
		LOG_DEBUG << "WssConnectionProcessor::unregisterConnection: Oops, exception thrown!!";
	}

	return;
}



void WssConnectionProcessor::processIncomingMessage(std::string id, std::string msg) {


	try {
		boost::mutex::scoped_lock __lock(__mutex);

		if ( __connections.size() < 2 ) {
			LOG_DEBUG << "WssConnectionProcessor::processIncomingMessage(): Oops, either the caller or the answerer is not yet connected!";
			return;
		}

		std::map<std::string, WebSocketConnectionPtr>::iterator iter = __connections.begin();

		if ( iter->first == id ) ++iter;

		if ( iter->first == id || iter == __connections.end() ) {
			LOG_ERROR << "WssConnectionProcessor::processIncomingMessage(): Oops!!! This should not happen.";
			return;
		}
		
		LOG_DEBUG << "WssConnectionProcessor::processIncomingMessage(): Sending message from <<" << id << ">> to <<" << iter->first << ">>.";
		iter->second->send(msg);

	} catch(...) {

		LOG_DEBUG << "WssConnectionProcessor::processIncomingMessage: Oops, exception thrown!!";
	}

}



#include "SimpleWssServer.h"
#include "BurkiConnectionProcessor.h"


using namespace guident;
using namespace drogon;




void SimpleWssServer::handleNewConnection(const HttpRequestPtr &req, const WebSocketConnectionPtr &conn)
{
	try {

		LOG_DEBUG << "SimpleWssServer::handleNewConnection(): New websocket connection!";
		if ( ! BurkiConnectionProcessor::Instance()->registerConnection(conn) ) {
			LOG_DEBUG << "SimpleWssServer::handleNewConnection(): Oops, this should not happen.";
			conn->forceClose();
			return;
		}

	} catch(...) {

		LOG_DEBUG << "SimpleWssServer::handleNewConnection(): Oops, exception thrown!";
	}
}


void SimpleWssServer::handleNewMessage(const WebSocketConnectionPtr &wsConnPtr, std::string &&message, const WebSocketMessageType &type) {

	try {
		std::shared_ptr<std::string> wssid = wsConnPtr->getContext<std::string>();

		if (type == WebSocketMessageType::Ping) {

			LOG_DEBUG << "SimpleWssServer::handleNewMessage(): Connection: <<" << *wssid << ">> recvd a ping";

		} else if (type == WebSocketMessageType::Text) {

			std::string myMessage = message;
			std::string shortMessage = myMessage.substr(0, 50);
			if ( myMessage.size() > 50 ) shortMessage += "...";

			LOG_DEBUG << "SimpleWssServer::handleNewMessage(): Connection: <<" << *wssid << ">> New websocket message: <<" << shortMessage << ">>.";

			BurkiConnectionProcessor::Instance()->processIncomingMessage(*wssid, myMessage);
		}
	} catch(...) {
		LOG_DEBUG << "SimpleWssServer::handleNewMessage(): Oops, exception thrown!";
	}
}



void SimpleWssServer::handleConnectionClosed(const WebSocketConnectionPtr &conn)
{
	try {
		if ( conn->hasContext() ) {
			std::shared_ptr<std::string> wssid = conn->getContext<std::string>();
			LOG_DEBUG << "SimpleWssServer::handleConnectionClosed(): Connection: <<" << *wssid << ">> Websocket closed!";
			BurkiConnectionProcessor::Instance()->unregisterConnection(conn);
		} else {
			LOG_DEBUG << "SimpleWssServer::handleConnectionClosed(): Unregistered connection has been closed.";
		}
	} catch(...) {
		LOG_DEBUG << "SimpleWssServer::handleConnectionClosed(): Oops, exception thrown!";
	}
}




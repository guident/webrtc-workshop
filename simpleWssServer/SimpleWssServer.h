#pragma once

#include <drogon/WebSocketController.h>
#include <drogon/PubSubService.h>
#include <drogon/HttpAppFramework.h>

namespace drogon {

class SimpleWssServer : public drogon::WebSocketController<SimpleWssServer>
{

  public:

    virtual void handleNewConnection(const HttpRequestPtr &, const WebSocketConnectionPtr &) override;
    virtual void handleNewMessage(const WebSocketConnectionPtr &, std::string &&, const WebSocketMessageType &) override;
    virtual void handleConnectionClosed(const WebSocketConnectionPtr &) override;

    WS_PATH_LIST_BEGIN
    WS_PATH_ADD("/", Get);
    WS_PATH_LIST_END

};

}



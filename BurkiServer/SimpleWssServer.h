#pragma once

#include <drogon/WebSocketController.h>
#include <drogon/PubSubService.h>
#include <drogon/HttpAppFramework.h>

namespace guident {

class SimpleWssServer : public drogon::WebSocketController<SimpleWssServer>
{

  public:

    virtual void handleNewConnection(const drogon::HttpRequestPtr &, const drogon::WebSocketConnectionPtr &) override;
    virtual void handleNewMessage(const drogon::WebSocketConnectionPtr &, std::string &&, const drogon::WebSocketMessageType &) override;
    virtual void handleConnectionClosed(const drogon::WebSocketConnectionPtr &) override;

    WS_PATH_LIST_BEGIN
    WS_PATH_ADD("/", drogon::Get);
    WS_PATH_LIST_END

};

}



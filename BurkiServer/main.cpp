
#include <cstdio>
#include "SimpleWssServer.h"


using namespace drogon;


int main()
{
    LOG_DEBUG << "main(): Start listeing for connections.....";
    app().addListener("0.0.0.0", 8848, true, std::string("/etc/letsencrypt/live/guident.bluepepper.us/cert.pem"), std::string("/etc/letsencrypt/live/guident.bluepepper.us/privkey.pem")).run();
}


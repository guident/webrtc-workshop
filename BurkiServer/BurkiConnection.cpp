#include <cstdio>
#include <chrono>
#include <memory>
#include <uuid/uuid.h>


#include "BurkiConnection.h"

//unsigned long long now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();


using namespace guident;
using namespace drogon;



BurkiConnection::BurkiConnection(WebSocketConnectionPtr connptr) : __endpointId(0L) {

	uuid_t uuid;
        char uuid_str[37];

        try {

                memset(uuid_str, 0, 37);
                uuid_generate(uuid);
                uuid_unparse_lower(uuid, uuid_str);

                connptr->setContext(std::make_shared<std::string>(uuid_str));

		unsigned long long __connectedAt = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();

	} catch(...) {
		LOG_ERROR <<  "BurkiConnection::cstr(): Oops, exception thrown.";
	}

}


BurkiConnection::~BurkiConnection() {

}



void BurkiConnection::setEndpointId(unsigned long id) {
	if ( id > 0 ) {
		__endpointId = id;
	}
}



unsigned long BurkiConnection::getEndpointId() {
	return(__endpointId);
}




const char * BurkiConnection::getConnectionId() {
	return(__connectionId.c_str());
}

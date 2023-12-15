#include <cstdio>
#include <cstring>
#include <cstdarg>
#include "Log.h"


using namespace guident;

Log * Log::__instance = NULL;

Log::Log() {

}

Log::~Log() {

}

Log & Log::Inst() {

	if ( __instance == NULL ) {
		__instance = new Log();
	}
	return(*__instance);
}


void Log::log(const char * fmt, ...) {
	va_list args;
	va_start (args, fmt);
	char buffer[512];
	memset(buffer, 0, 512);
	vsnprintf (buffer, 511, fmt, args);
	va_end (args);
	printf("LOG: %s\n", buffer);
}

#pragma once

namespace guident {

class Log {

public:

	~Log();

	static Log & Inst();

	void log(const char * fmt, ...);

private:

	Log();

	static Log * __instance;
};


};

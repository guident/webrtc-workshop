

simpleWssServer:	main.o SimpleWssServer.o WssConnectionProcessor.o
	g++ -o simpleWssServer main.o SimpleWssServer.o WssConnectionProcessor.o -ldrogon -ltrantor -lpthread -lsqlite3 -ldl -ljsoncpp -lboost_system -lboost_filesystem  -lssl -lcrypto -lz -luuid -lbrotlicommon -lbrotlidec -lbrotlienc

main.o:		main.cpp SimpleWssServer.cpp
	g++ -c -I /usr/include/jsoncpp -o main.o main.cpp

SimpleWssServer.o:	SimpleWssServer.cpp SimpleWssServer.h
	g++ -c -I /usr/include/jsoncpp -o SimpleWssServer.o SimpleWssServer.cpp

WssConnectionProcessor.o: WssConnectionProcessor.h WssConnectionProcessor.cpp SimpleWssServer.h
	g++ -c -I /usr/include/jsoncpp -o WssConnectionProcessor.o WssConnectionProcessor.cpp

clean:
	rm -f simpleWssServer *.o >/dev/null 2>&1
	rm -rf uploads

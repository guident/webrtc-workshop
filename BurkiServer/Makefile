

simpleWssServer:	main.o SimpleWssServer.o BurkiConnection.o BurkiConnectionProcessor.o
	g++ -o simpleWssServer main.o SimpleWssServer.o BurkiConnection.o BurkiConnectionProcessor.o -ldrogon -ltrantor -lpthread -lsqlite3 -ldl -ljsoncpp -lboost_system -lboost_filesystem  -lssl -lcrypto -lz -luuid -lbrotlicommon -lbrotlidec -lbrotlienc

main.o:		main.cpp SimpleWssServer.h
	g++ -c -I /usr/include/jsoncpp -o main.o main.cpp

SimpleWssServer.o:	SimpleWssServer.cpp SimpleWssServer.h BurkiConnection.h BurkiConnectionProcessor.h
	g++ -c -I /usr/include/jsoncpp -o SimpleWssServer.o SimpleWssServer.cpp

BurkiConnection.o: BurkiConnection.h BurkiConnection.cpp SimpleWssServer.h BurkiConnectionProcessor.h
	g++ -c -I /usr/include/jsoncpp -o BurkiConnection.o BurkiConnection.cpp

BurkiConnectionProcessor.o: BurkiConnectionProcessor.h BurkiConnectionProcessor.cpp SimpleWssServer.h BurkiConnection.h
	g++ -c -I /usr/include/jsoncpp -o BurkiConnectionProcessor.o BurkiConnectionProcessor.cpp

clean:
	rm -f simpleWssServer *.o >/dev/null 2>&1
	rm -rf uploads


all: 	simpleWssServer simpleWssServer2

simpleWssServer:	main.o SimpleWssServer.o WssConnectionProcessor.o
	g++ -o simpleWssServer main.o SimpleWssServer.o WssConnectionProcessor.o -ldrogon -ltrantor -lpthread -lsqlite3 -ldl -ljsoncpp -lboost_system -lboost_filesystem  -lssl -lcrypto -lz -luuid -lbrotlicommon -lbrotlidec -lbrotlienc

simpleWssServer2:	main2.o SimpleWssServer.o WssConnectionProcessor.o
	g++ -o simpleWssServer2 main2.o SimpleWssServer.o WssConnectionProcessor.o -ldrogon -ltrantor -lpthread -lsqlite3 -ldl -ljsoncpp -lboost_system -lboost_filesystem  -lssl -lcrypto -lz -luuid -lbrotlicommon -lbrotlidec -lbrotlienc

main.o:		main.cpp SimpleWssServer.cpp
	g++ -c -I /usr/include/jsoncpp -D WSS_PORT=8848 -o main.o main.cpp

main2.o:	main.cpp SimpleWssServer.cpp
	g++ -c -I /usr/include/jsoncpp -D WSS_PORT=8850 -o main2.o main.cpp

SimpleWssServer.o:	SimpleWssServer.cpp SimpleWssServer.h
	g++ -c -I /usr/include/jsoncpp -o SimpleWssServer.o SimpleWssServer.cpp

WssConnectionProcessor.o: WssConnectionProcessor.h WssConnectionProcessor.cpp SimpleWssServer.h
	g++ -c -I /usr/include/jsoncpp -o WssConnectionProcessor.o WssConnectionProcessor.cpp

clean:
	rm -f simpleWssServer simpleWssServer2 *.o >/dev/null 2>&1
	rm -rf uploads

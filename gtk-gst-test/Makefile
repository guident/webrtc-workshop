

all: 	main

main:	main.o
	gcc -o main main.o `pkg-config --libs gtk+-3.0 gstreamer-1.0`

main.o:		main.c
	gcc -c `pkg-config --cflags gtk+-3.0 gstreamer-1.0` -o main.o main.c


clean:
	rm -rf main *.o >/dev/null 2>&1

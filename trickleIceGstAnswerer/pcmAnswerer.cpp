#include <string>
#include <gtk/gtk.h>
#include "pcmAnswererHub.h"

void displayGuidentCopyrightInfo() {
    printf("**************************************************\n");
    printf("*                                                *\n");
    printf("*      Passenger Communication System            *\n");
    printf("*                                                *\n");
    printf("*      Copyright © 2024 Guident Corp.            *\n");
    printf("*          All Rights Reserved.                  *\n");
    printf("*                                                *\n");
    printf("*      Unauthorized copying, modification,       *\n");
    printf("*      distribution, or use is prohibited        *\n");
    printf("*                                                *\n");
    printf("*      Developed by: Andy Alvarez/R&D            *\n");
    printf("*       Contact: aalvarez@guident.co             *\n");
    printf("*                                                *\n");
    printf("**************************************************\n");
}




int main (int argc, char *argv[]) {

  std::string  vehicleUuid;
  std::string  password;
  int pipelineType;

  if ( argc < 4 ) {
	  printf("Usage: pcmAnswerer <vehicle-uuid> <password>\n");
	  exit(-1);
  }

  vehicleUuid = argv[1];
  password = argv[2];
  pipelineType = atoi(argv[3]);

  displayGuidentCopyrightInfo();
  PcmAnswererHub::Instance()->init(vehicleUuid.c_str(), password.c_str(), pipelineType);
  PcmAnswererHub::Instance()->run();

  return 0;
}

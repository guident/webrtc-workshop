//import { RmccLogService } from "./rmcc-log.service";
import { environment } from '../../environments/environment';

export class GuidentLogger {

    static loggingHash = new Map<string, string>(Object.entries(environment.logging));
    static reportLoggingLevelsIsDone: boolean = false;
    static windowConsoleFunctionsHaveBeenRedirected: boolean = false;
    static nativeWindowConsoleLogFunc: any = null;
    static nativeWindowConsoleErrorFunc: any = null;
    static nativeWindowConsoleWarnFunc: any = null;


    componentName: string = '';
    // loglevel: error = 0, info = 1, debug = 2,  default is "error"
    logLevel = 0;
    loggerLevelId: number;
    static staticLoggerLevelId: number = -1;


    constructor(name: string) {

        this.componentName = name;

        let engagementServicesLogging = GuidentLogger.loggingHash.get("EngagementServices");
        if(engagementServicesLogging && GuidentLogger.staticLoggerLevelId == -1){
          if(engagementServicesLogging == "debug"){
            GuidentLogger.staticLoggerLevelId = 2;
          } else if(engagementServicesLogging == "info"){
            GuidentLogger.staticLoggerLevelId = 1;
          } else {
            GuidentLogger.staticLoggerLevelId = 0;
          }
        }


        GuidentLogger.redirectWindowConsoleFunction();

        if ( GuidentLogger.reportLoggingLevelsIsDone ) {
          alert("start");
          GuidentLogger.loggingHash.forEach( (key, value) => {
            console.log("GuidentLogger::cstr(): <<" + key + ">>  <<" + value + ">>.");
          });
            GuidentLogger.reportLoggingLevelsIsDone = true;
            alert("end");
          }

          var loggingSearchName = this.componentName;
          if ( this.componentName.substring(0, 5) == "STATE" ) {
            loggingSearchName = "STATE";
          }

        if ( GuidentLogger.loggingHash.get(loggingSearchName) == "debug" ) {
            this.loggerLevelId = 2;
            if ( loggingSearchName != "STATE" ) GuidentLogger.nativeWindowConsoleLogFunc(this.componentName + "::GuidentLogger::cstr(): This component will log at DEBUG level.");
          } else if ( GuidentLogger.loggingHash.get(loggingSearchName) == "info" ) {
            this.loggerLevelId = 1;
            if ( loggingSearchName != "STATE" ) GuidentLogger.nativeWindowConsoleLogFunc(this.componentName + "::GuidentLogger::cstr(): This component will log at INFO level.");
          } else {
            //if ( loggingSearchName != "STATE" ) GuidentLogger.nativeWindowConsoleLogFunc(this.componentName + "::GuidentLogger::cstr(): This component will log at ERROR level.");
            this.loggerLevelId = 0;
          }
      }


    static redirectWindowConsoleFunction() : void {

        if ( !GuidentLogger.windowConsoleFunctionsHaveBeenRedirected ) {

            GuidentLogger.nativeWindowConsoleLogFunc = window.console.log;
            GuidentLogger.nativeWindowConsoleErrorFunc = console.error;
            GuidentLogger.nativeWindowConsoleWarnFunc = console.warn;

            window['console']['log'] = function(msg: any, ...params: any[]) {
                if ( GuidentLogger.loggingHash.get("JS") == "info" || GuidentLogger.loggingHash.get("JS") == "debug" ) {
                    if ( params == undefined || params == null || params.length == 0 ) {
                        var logMsg =  "PUREJS: " + msg;
                        GuidentLogger.nativeWindowConsoleLogFunc(logMsg);
                    } else {
                        var logMsg =  "PUREJS: " + msg;
                        GuidentLogger.nativeWindowConsoleLogFunc(logMsg, params);
                    }
                }
            }

            window['console']['warn'] = function(msg: any, ...params: any[]) {
                if ( params == undefined || params == null || params.length == 0 ) {
                    var logMsg =  "PUREJS: " + msg;
                    GuidentLogger.nativeWindowConsoleWarnFunc(logMsg);
                } else {
                    var logMsg =  "PUREJS: " + msg;
                    GuidentLogger.nativeWindowConsoleLogFunc(logMsg, params);
                }
            }

            window['console']['error'] = function(msg: any, ...params: any[]) {

                if ( params == undefined || params == null || params.length == 0 ) {
                    if (typeof msg === 'string' || msg instanceof String) {
                        var logMsg =  "PUREJS: " + msg;
                        GuidentLogger.nativeWindowConsoleErrorFunc(logMsg);
                    } else {
                        GuidentLogger.nativeWindowConsoleErrorFunc(msg);
                    }
                } else {
                    if (typeof msg === 'string' || msg instanceof String) {
                        var logMsg =  "PUREJS: " + msg;
                        GuidentLogger.nativeWindowConsoleErrorFunc(logMsg, params);
                    } else {
                        GuidentLogger.nativeWindowConsoleErrorFunc(msg);
                    }
                }

            }

            GuidentLogger.windowConsoleFunctionsHaveBeenRedirected = true;

        }

    }





    logError(msg?: any, ...params: any[]): void {
        var logMsg = this.componentName + " ERROR: " + msg;
        if ( params == undefined || params == null || params.length == 0) {
            if (typeof msg === 'string' || msg instanceof String) {
                GuidentLogger.nativeWindowConsoleErrorFunc(logMsg);
            } else {
                GuidentLogger.nativeWindowConsoleErrorFunc(this.componentName + " ERROR: (object):");
                GuidentLogger.nativeWindowConsoleErrorFunc(msg);
            }
        } else {
            if (typeof msg === 'string' || msg instanceof String) {
                GuidentLogger.nativeWindowConsoleErrorFunc(logMsg, params);
            } else {
                GuidentLogger.nativeWindowConsoleErrorFunc(this.componentName + " ERROR: (object):");
                GuidentLogger.nativeWindowConsoleErrorFunc(msg);
            }
        }
    }

    static logError(componentName: string, msg?: any, ...params: any[]): void {
      var logMsg = componentName + " ERROR: " + msg;
      if ( params == undefined || params == null || params.length == 0) {
          if (typeof msg === 'string' || msg instanceof String) {
              GuidentLogger.nativeWindowConsoleErrorFunc(logMsg);
          } else {
              GuidentLogger.nativeWindowConsoleErrorFunc(componentName + " ERROR: (object):");
              GuidentLogger.nativeWindowConsoleErrorFunc(msg);
          }
      } else {
          if (typeof msg === 'string' || msg instanceof String) {
              GuidentLogger.nativeWindowConsoleErrorFunc(logMsg, params);
          } else {
              GuidentLogger.nativeWindowConsoleErrorFunc(componentName + " ERROR: (object):");
              GuidentLogger.nativeWindowConsoleErrorFunc(msg);
          }
      }
    }

    logWarn(msg?: any, ...params: any[]): void {
        var logMsg = this.componentName + " WARN: " + msg;
        if ( params == undefined || params == null || params.length == 0) {
            GuidentLogger.nativeWindowConsoleWarnFunc(logMsg);
        } else {
            GuidentLogger.nativeWindowConsoleWarnFunc(logMsg, ...params);
        }
    }

    static logWarn(componentName: string, msg?: any, ...params: any[]): void {
      var logMsg = componentName + " WARN: " + msg;
      if ( params == undefined || params == null || params.length == 0) {
          GuidentLogger.nativeWindowConsoleWarnFunc(logMsg);
      } else {
          GuidentLogger.nativeWindowConsoleWarnFunc(logMsg, ...params);
      }
    }

    logStatus(msg: string, ...params: any[]): void {
        var logMsg = this.componentName + " STATUS: " + msg;
        if ( params == undefined || params == null || params.length == 0) {
            GuidentLogger.nativeWindowConsoleLogFunc(logMsg);
        } else {
            GuidentLogger.nativeWindowConsoleLogFunc(logMsg, ...params);
        }
    }

    static logStatus(componentName: string, msg: string, ...params: any[]): void {
      var logMsg = componentName + " STATUS: " + msg;
      if ( params == undefined || params == null || params.length == 0) {
          GuidentLogger.nativeWindowConsoleLogFunc(logMsg);
      } else {
          GuidentLogger.nativeWindowConsoleLogFunc(logMsg, ...params);
      }
    }

    logInfo(msg?: any, ...params: any[]): void {
        if ( this.loggerLevelId >= 1 ) {
            var logMsg = this.componentName + " INFO: " + msg;
            if ( params == undefined || params == null || params.length == 0) {
                GuidentLogger.nativeWindowConsoleLogFunc(logMsg);
            } else {
                GuidentLogger.nativeWindowConsoleLogFunc(logMsg, ...params);
            }
        }
    }

    static logInfo(componentName: string, msg?: any, ...params: any[]): void {
      if ( GuidentLogger.staticLoggerLevelId >= 1 ) {
          var logMsg = componentName + " INFO: " + msg;
          if ( params == undefined || params == null || params.length == 0) {
              GuidentLogger.nativeWindowConsoleLogFunc(logMsg);
          } else {
              GuidentLogger.nativeWindowConsoleLogFunc(logMsg, ...params);
          }
      }
    }

    logDebug(msg?: any, ...params: any[]): void {
        if ( this.loggerLevelId >= 2 ) {
            var logMsg = this.componentName + " DEBUG: " + msg;
            if ( params == undefined || params == null || params.length == 0) {
                GuidentLogger.nativeWindowConsoleLogFunc(logMsg);
            } else {
                GuidentLogger.nativeWindowConsoleLogFunc(logMsg, ...params);
            }
        }
    }

    static logDebug(componentName: string, msg?: any, ...params: any[]): void {
      if ( GuidentLogger.staticLoggerLevelId >= 2 ) {
          var logMsg = componentName + " DEBUG: " + msg;
          if ( params == undefined || params == null || params.length == 0) {
              GuidentLogger.nativeWindowConsoleLogFunc(logMsg);
          } else {
              GuidentLogger.nativeWindowConsoleLogFunc(logMsg, ...params);
          }
      }
    }


    logObject(obj: any) {
        if ( this.loggerLevelId >= 2 ) {
            GuidentLogger.nativeWindowConsoleLogFunc(this.componentName + " OBJECT: ");
            GuidentLogger.nativeWindowConsoleLogFunc(obj);
        }
    }

    static logObject(componentName:string, obj: any) {
      if ( GuidentLogger.staticLoggerLevelId >= 2 ) {
          GuidentLogger.nativeWindowConsoleLogFunc(componentName + " OBJECT: ");
          GuidentLogger.nativeWindowConsoleLogFunc(obj);
      }
  }



}

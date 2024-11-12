// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  username: "harald",
  password: "whaddaya",
  // locatorUrl: "wss://guident.bluepepper.us:8443",
  locatorUrl: "wss://guident.bluepepper.us:8445",
  defaultLatLon: { lat: 26.38369, lng: -80.10069 },
  // iceServers: [
  //  {'urls': "stun:guident.bluepepper.us:3478" },
  //  {'urls': "turn:guident.bluepepper.us:3478", 'username':  'ninefingers', 'credential': 'youhavetoberealistic' },
  // ],
  // iceServers: [ { 'urls': 'stun://stun.l.google.com:19302' } ]
  // iceServers: [  { urls: [ "stun:us-turn5.xirsys.com" ] } ],
  // iceServers: [{
  //     urls: [ "stun:us-turn5.xirsys.com" ]
  // }, {
  //     username: "_DYVz1xUZvXJHIlhLB1ucpO50HEc98R9fOMH4xm13sTFd-3lhmM5Wxjee4ulyvLrAAAAAGRZMGpndWlkZW50",
  //      credential: "41d94e58-edc5-11ed-8e3f-0242ac140004",
  //       urls: [
  //           "turn:us-turn5.xirsys.com:80?transport=udp",
  //           "turn:us-turn5.xirsys.com:3478?transport=udp",
  //           "turn:us-turn5.xirsys.com:80?transport=tcp",
  //           "turn:us-turn5.xirsys.com:3478?transport=tcp",
  //           "turns:us-turn5.xirsys.com:443?transport=tcp",
  //           "turns:us-turn5.xirsys.com:5349?transport=tcp"
  //       ]
  // }],
  // iceServers: [  { urls: [ "stun:stun.bluepepper.us:3478" ] } ],
  iceServers: [],
  // iceServers: [  { urls: [ "stun:172.16.11.83:3478" ] } ],
  useKeystrokesAsControl: false,
  remoteControlMessagePeriodMs: 250,
  exclusivePayloadTypeForMid1: 98,
  exclusivePayloadTypeForMid2: 98,
  exclusivePayloadTypeForMid3: 98,
  changePayloadTypeForMid1: 99,
  changePayloadTypeForMid2: 100,
  changePayloadTypeForMid3: 101,
  apiUrl: 'https://dev.bluepepper.us/api/',
  useImagePostingForDisplayScreen: false,
  imagePostingTimerIntervalMs: 350,
  devMode: true,
  tokenExpireTime: 5 * 60000, //X * 60s | change X to match the token expiry time
  displayScreenImagePostingUrl: "https://guident.bluepepper.us:8091",
  logging: {
    // components:
    "App": "error",
    "RmccMain": "error",
    "FleetMonitor": "error",
    "RemoteControl": "debug",
    "RemoteTakeoverSpeedometerAndControls": "error",
    "SelectedVehicle": "debug",
    "SelectedVehicleMap": "error",
    "SelectedVehicleSpeedometer": "error",
    "SelectedVehicleEngagement": "error",
    "ErrorOrAlarm": "error",
    'VtuControlsComponent': 'debug',
    "PCSComponent": "debug",
    // Services:
    "GuidentRmccEndpointService": "debug",
    "ErrorOrAlarmOverlayService": "debug",
    "VehicleRemoteControlAndStatusChannelMonitor": "debug",
    "VehicleService": "error",
    "CameraSwitchingService": "debug",
    "CarUpdateService": "error",
    "LatencyCalculator": "info",
    "VideoStatistics": "debug",
    "NsamHub": "debug ",
    "VehicleNetworkManagerService": "debug",
    "VehiclesAlarmsService": "debug",
    "EngagementServices": "debug",
    "PCSManagerService": "debug",
    // STATES:
    "STATE": "info",
    // non-angular
    "JS": "debug",
    "VideoStats": "true", //Must be true or false (lowercase),
    "endpointClass": "debug"
  },
  gamepadIndex: 1,
  buttonsMap: {
    VIEW : 1,
    HAZARD : 2,
    PLUS : 3,
    MINUS : 0,
    REFRESH : 21,
    INDICATOR_LEFT : 5, // previous upward :6
    INDICATOR_RIGHT : 4, //previous downward: 10
    ONE : 7, // Park
    TWO : 11, // Neutral
    THREE : 9, // Forward
    FOUR : 8, // Reverse
    CRUISE : 24,
    SETTING : 27,
    GEAR_PLUS : 4,
    GEAR_MINUS : 5,
    JOYSTICK : 25
  },
  oldSteeringGamepadIndex: 1,
  oldSteeringButtonsMap: {
    INDICATOR_LEFT : 2,
    INDICATOR_RIGHT : 3,
    ONE : 9, // Park
    TWO: 0, // Neutral
    THREE: 1, // Forward
    FOUR: 8, // Reverse
    VIEW: 31,
    HAZARD: 31,
    PLUS: 31,
    MINUS: 31,
    REFRESH: 31,
    CRUISE: 31,
    SETTING: 31,
    GEAR_PLUS: 31,
    GEAR_MINUS: 31,
    JOYSTICK: 31
  },
  keyboardButtonsMap : {
    INDICATOR_LEFT : 'z',
    INDICATOR_RIGHT : 'x',
    ONE : 'p', // Park
    TWO: 'n', // Neutral
    THREE: 'f', // Forward
    FOUR: 'r', // Reverse
    VIEW: 'c',
    HAZARD: 31,
    PLUS: 31,
    MINUS: 31,
    REFRESH: 'v',
    CRUISE: 31,
    SETTING: 31,
    GEAR_PLUS: 31,
    GEAR_MINUS: 31,
    JOYSTICK: 31
  }
};

/*
View : 0,1 ✅
Hazard : 0,2 ✅
Plus : 0,3
Minus : 0,0
Refresh : 0,21
Indicator-Left (Up) : 0,10 ✅
Indicator-Right (Down) : 0,6 ✅

One : 0,7 - Park ✅
Two : 0,11 - Neutral ✅
Three : 0,9 - Reverse ✅
Four : 0,8 - Forward ✅
cruise-control : config
setting : 0,27

Gear-Plus : 0,4
Gear-Minus : 0,5

Joystick: 0,25
===============================

Keyboard mappings
z => left indicator
x => right indicator

p => park
n => neutral
f => drive/forward
r = reverse

brake - press => s
brake - release => a

steering-left => k
steering-right => l

throttel-up => h
throttle-down => g

*/




/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.




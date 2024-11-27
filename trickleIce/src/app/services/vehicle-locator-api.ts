export enum GuidentMessageType {
  REGISTER = "register",
  NOTIFY = "notify",
  ENGAGE_OFFER = "engage-offer",
  ENGAGE_ANSWER = "engage-answer",
  ENGAGE_ACK = "engage-ack",
  TAKEOVER = "takeover",
  RELEASE = "release",
  DISENGAGE = "disengage",
  UNKNOWN = "unknown",
  NEW_ICE_CANDIDATE = "NEW_ICE_CANDIDATE"
}

export enum GuidentMsgEventType {
  CONNECTED = "connected",
  REGISTERED = "registered",
  REJECTED = "rejected",
  ENGAGED = "engaged",
  DISENGAGED = "disengaged",
  TAKEN_OVER = "taken-over",
  RELEASED = "released",
  STATUS = "status",
  ICE_CANDIDATE = "ice-candidate",
  COMMAND = "command",
  DISCONNECTED = "disconnected",
  UNKNOWN = "unknown"
}

enum GuidentMsgEndpointType {
  VEHICLE = "vehicle",
  MONITOR = "monitor",
  UNKNOWN = "unknown"
}

export enum GuidentMsgStatusType {
  GREEN_OK = "green-ok",
  YELLOW_WARNING = "yellow-warning",
  RED_EMERGENCY = "red-emergency",
  UNKNOWN = "unknown"
}

export enum GuidentCameraPositions {
  FRONT_CAMERA_LEFT = 0,
  FRONT_CAMERA_RIGHT,
  REAR_CAMERA,
  CAMERA_POSITIONS_LENGTH
}

interface StateMachineDefinition {
  initialState: string;
  [state: string]: any;
}



export class WebsocketConnectionStateMachine {

  //Variables used for the state machine
  private vehicleLocatorServerUrl: string;
  private stateMachine: any;

  //Variables related to the websocket connection
  public websocketConnection: WebSocket | null = null;

  //Variables related to the authentication with the server
  private connectionId: string | null = null;
  private peerConnectionId: any;
  private endpointId: string | null = null;
  private endpointType: string = 'monitor';
  private username: string;
  private password: string;
  private authUsername: string;
  private authToken: string;
  //Variables to keep track of timeouts and message counts
  private timerId: any | null = null;
  private localMessageSequence: number = 1;
  private remoteMessageSequence: number | null = null;

  constructor(
    name: string,
    pwd: string,
    vehicleLocatorUrl: string | null,
    authUsername: string,
    authToken: string,
    endpointType: string
  ) {
    //Initialize all of the data passed into the constructor
    this.username = name;
    this.password = pwd;
    this.authUsername = authUsername;
    this.authToken = authToken;
    this.endpointType = endpointType;
    this.vehicleLocatorServerUrl = vehicleLocatorUrl || "wss://vex.bluepepper.us:8443";
    //Create a state machine
    this.stateMachine = this.createGuidentRmcwStateMachine(this, this.GuidentRmcwStateMachineDefinition);
  }

  /**
   * Function used to create a RMCW state machine
   * @param ep A reference to the endpoint
   * @param stateMachineDefinition The definition of the state machine ( Here is where we have all of the states and what happens in each state )
   * @returns The state machine
   */
  private createGuidentRmcwStateMachine(ep: WebsocketConnectionStateMachine, stateMachineDefinition: StateMachineDefinition) {
    const machine = {
      value: stateMachineDefinition.initialState,
      //Define the transition function which will be used when a transition happens from one state to the other
      transition(event: string, eventData?: any) {
        console.log(`GuidentRmcwStateMachine::transition(): Current state: <<${this.value}>>, Event: <<${event}>>.`);
        const currentStateDefinition = stateMachineDefinition[this.value];
        const destinationTransition = currentStateDefinition.eventCallbacks[event];
        if (!destinationTransition) {
          console.log(`GuidentRmcwStateMachine::transition(): No transition for state: <<${this.value}>> Event: <<${event}>>.`);
          return;
        }
        const destinationState = destinationTransition.action(ep, eventData);
        currentStateDefinition.onExit();
        const destinationStateDefinition = stateMachineDefinition[destinationState];
        destinationStateDefinition.onEnter();
        machine.value = destinationState;
        return machine.value;
      }
    };
    return machine;
  }

  /**
   * Function used to update the credentials of the user of the workstation
   * @param uname The username of the user
   * @param token The token obtained from the backend server
   * @returns Exits if the correct item is not provided
   */
  setCredentials(uname: string, token: string) {
    if ( uname == undefined || uname == null || token == undefined || token == null ) return;
    this.authUsername = uname;
    this.authToken = token;
  }

  /**
   * Function which starts the state machine flow when the application is started
   * @returns
   */
  start() {
    console.log("WebsocketConnectionStateMachine::start() called.");
    if ( this.authUsername == undefined || this.authUsername == null || this.authUsername == "" || this.authToken == undefined || this.authToken == null || this.authToken == "" ) {
      console.log("WebsocketConnectionStateMachine::start(): Oops, credentials have not yet been set!");
      throw new Error("Oops can't start the endpoint because credentials haven't yet been set!");
      return;
    }
    //Transition into the next state
    this.stateMachine.transition('startstopclicked');
  }

  stop() {
    console.log("WebsocketConnectionStateMachine::stop() called.");
    this.stateMachine.transition('startstopclicked');
  }

  engage(connectionId: string) {
     console.log(`WebsocketConnectionStateMachine::engage() called with connection id: <<${connectionId}>>.`);
     this.peerConnectionId = connectionId;
     this.stateMachine.transition('vehiclebuttonclicked', connectionId);
  }

  disengage(connectionId: string) {
    console.log("WebsocketConnectionStateMachine::disengage() called.");
    this.stateMachine.transition('startstopclicked', connectionId);
  }

  setAuthenticationCredentials(authUsername: string, authToken: string) {
    this.authUsername = authUsername;
    this.authToken = authToken;
  }

  onConnecting() {
    console.log("WebsocketConnectionStateMachine::onConnecting(): not implemented.");
  }

  onConnectionSuccessful() {
    console.log("WebsocketConnectionStateMachine::onConnectionSuccessful(): not implemented.");
  }

  onConnectionFailed(err: string) {
    console.log("WebsocketConnectionStateMachine::onConnectionFailed(): not implemented, called with err: " + err);
  }

  onDisconnected(reason: string) {
    console.log("WebsocketConnectionStateMachine::onDisconnected(): not implemented, called with reason: " + reason);
  }

  onRegistrationFailed() {
    console.log("WebsocketConnectionStateMachine::onRegistrationFailed(): not implemented.");
  }

  onRegistrationSuccessful() {
    console.log("WebsocketConnectionStateMachine::onRegistrationSuccessful(): not implemented.");
  }

  onEngaging() {
    console.log("WebsocketConnectionStateMachine::onEngaging(): not implemented.");
  }

  onEngagementFailed(err: string) {
    console.log("WebsocketConnectionStateMachine::onEngagementFailed(): not implemented, called with err: " + err);
  }

  onEngagementSuccessful() {
    console.log("WebsocketConnectionStateMachine::onEngagementSuccessful(): not implemented.");
  }

  onDisengagement(reason: any) {
    console.log("WebsocketConnectionStateMachine::onDisengagement(): not implemented, called with reason: " + reason);
  }

  onNotification(msg: any) {
    console.log("WebsocketConnectionStateMachine::onNotification(): not implemented");
  }

  onNewLocation(latlon: any) {
    console.log("WebsocketConnectionStateMachine::onNewLocation(): not implemented");
  }


  private _checkIncomingMessageSequence(msg: any) {
    return true;
  }

  private _checkIncomingMessageConnectionId(msg: any) {
    if (msg != null && msg.connectionId != undefined) {
      //Checks if there is a connection id for the workstation
      if (this.connectionId == null) {
        //If there is no connection id then the cloud server has assigned one to you so save it
        this.connectionId = msg.connectionId;
        console.log(`WebsocketConnectionStateMachine::Initialized the workstation's connection id to <<${this.connectionId}}>>`);
        return true;
      } else if (msg.connectionId === this.connectionId) {
        //Checks if the connection if of the incoming message is for this workstation or for another
        console.log("WebsocketConnectionStateMachine:: Message belongs to workstation");
        return true;
      }
    }
    return false;
  }

  private _onWssConnectionOpen(evt: Event) {
    console.log(`WebsocketConnectionStateMachine::_onWssConnectionOpen(): `,evt);
    // console.table(this);
    this.stateMachine.transition('connect');
  }

  private _onWssConnectionClose(evt: CloseEvent) {
    console.log(`WebsocketConnectionStateMachine::_onWssConnectionClose(): Code: ${evt.code} Reason: ${evt.reason} Clean?: ${evt.wasClean}`);
    this.stateMachine.transition('disconnect');
  }

  private _onWssConnectionError(evt: Event) {
    console.log(`WebsocketConnectionStateMachine::_onWssConnectionError(): ${evt}`);
    this.stateMachine.transition('connectionerror');
  }

  private _onWssConnectionMessage(evt: MessageEvent) {
    if (evt.data != undefined && evt.data != null) {
      let msg = JSON.parse(evt.data);
      let isMine = false;

      if (msg == null) {
        console.log("WebsocketConnectionStateMachine::_onWssConnectionMessage(): can't parse the message.");
        return;
      }

      if (this == undefined || this == null) {
        console.log("WebsocketConnectionStateMachine::_onWssConnectionMessage(): can't retrieve the endpoint structure from the websocket.");
        return;
      }

      if (!this._checkIncomingMessageSequence(msg)) {
        console.log("WebsocketConnectionStateMachine::_onWssConnectionMessage(): Invalid message sequence id.");
        return;
      }

      isMine = this._checkIncomingMessageConnectionId(msg);

      if (!isMine && (msg.messageType !== "notify")) {
        console.log("WebsocketConnectionStateMachine::_onWssConnectionMessage(): Invalid message.");
        return;
      }

      if (msg.messageType === "notify") {
        if (isMine) {
          if (msg.eventType === "connected") {
            this.stateMachine.transition('connectednotification');
          } else if (msg.eventType === "registered") {
            this.endpointType = msg.endpointType;
            this.endpointId = msg.endpointId;
            this.stateMachine.transition('registerednotification');
          } else if (msg.eventType === "rejected") {
            this.stateMachine.transition('rejectednotification');
          } else {
            console.log("WebsocketConnectionStateMachine::_onWssConnectionMessage(): No transition for this message: <<%s>>", evt.data);
          }
        } else {
          if (msg.endpointType === "vehicle" || msg.endpointType === "pavehicle") {
            this.onNotification(msg);
          }
        }
      } else if (msg.messageType === "engage-offer") {
        this.stateMachine.transition('engagementoffer', msg);
      } else if (msg.messageType === "engage-answer") {
        this.stateMachine.transition('engagementanswer', msg);
      } else if (msg.messageType === "engage-ack") {
        this.stateMachine.transition('engagementack', msg);
      } else if (msg.messageType === "takeover") {
        this.stateMachine.transition('takeover', msg);
      } else if (msg.messageType === "disengage") {
        this.stateMachine.transition('disengage', msg);
      } else if (msg.messageType === "release") {
        this.stateMachine.transition('release', msg);
      } else {
        console.log(`WebsocketConnectionStateMachine::_onWssConnectionMessage(): huh?? Invalid message: <<${msg}>>.`);
      }
    }
  }

  public _startConnection() {
    console.log(`WebsocketConnectionStateMachine::startConnection(): Opening connection to URL: <<${this.vehicleLocatorServerUrl}>>.`);

    this.localMessageSequence = 1;
    this.remoteMessageSequence = null;
    this.connectionId = null;

    this.websocketConnection = new WebSocket(this.vehicleLocatorServerUrl);
    this.websocketConnection.onopen = this._onWssConnectionOpen.bind(this);
    this.websocketConnection.onmessage = this._onWssConnectionMessage.bind(this);
    this.websocketConnection.onclose = this._onWssConnectionClose.bind(this);
    this.websocketConnection.onerror = this._onWssConnectionError.bind(this);
  }

  private _closeConnection() {
    console.log("WebsocketConnectionStateMachine::_closeConnection(): Closing server connection.");
    this.websocketConnection!.close();
    this.localMessageSequence = 1;
    this.remoteMessageSequence = null;
    this.connectionId = null;
  }

  public _startTimer(timeout: number) {
    console.log(`WebsocketConnectionStateMachine::_startTimer() with ${timeout} ms.`);
    if (this.timerId != null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.timerId = setTimeout((ep: WebsocketConnectionStateMachine) => ep.stateMachine.transition('timeout'), timeout, this);
    return;
  }

  public _clearCurrentTimer() {
    console.log("WebsocketConnectionStateMachine::_clearCurrentTimer()");
    if (this.timerId == null) return;
    clearTimeout(this.timerId);
    this.timerId = null;
    return;
  }

  public clearStatemachine(){
    this.stateMachine = null;
  }

  public getWSS(){
    return this.websocketConnection;
  }

  private _sendMessage(messageType: GuidentMessageType, destinationId?: string, eventType?: GuidentMsgEventType, eventData?: any, iceServers?: any, sdpPayload?: any) {
    let msg: any = new Object();

    msg.messageType = messageType;
    msg.connectionId = this.connectionId;

    if (destinationId != null) {
      msg.peerConnectionId = destinationId;
    }

    if (msg.endpointId != null) msg.endpointId = this.endpointId;

    msg.endpointType = this.endpointType;
    //Get the name of the user logged in
    const extractedUser = sessionStorage.getItem("currentUser")
    if ( extractedUser ) {
      const user = JSON.parse(extractedUser).user;
      msg.name = user.first_name + " " + user.last_name;
    } else {
      msg.namme = "null";
      console.error("_sendMessage(): Unable to extract the user's name");
    }

    if (messageType === GuidentMessageType.REGISTER) {
      msg.credential = this.password;
      msg.authenticationUsername = this.authUsername;
      msg.authenticationToken = this.authToken;
    }

    if (messageType === GuidentMessageType.NOTIFY) {
      if ( eventType ) {
        msg.eventType = eventType;
        msg.status = GuidentMsgStatusType.UNKNOWN;
        if ( eventData ) {
          msg.eventData = eventData;
        }
      } else {
        msg.eventType = "status";
        msg.status = GuidentMsgStatusType.UNKNOWN;
      }
    }

    if (messageType === GuidentMessageType.ENGAGE_OFFER || messageType === GuidentMessageType.ENGAGE_ANSWER) {


      msg.iceServers = iceServers;
      msg.sessiondescription = sdpPayload;


    }

    msg.sequence = this.localMessageSequence++;

    let str = JSON.stringify(msg);

    console.log(`WebsocketConnectionStateMachine::_sendMessage(): Sending: <<${str}>>.`);
    this.websocketConnection!.send(str);
  }


  startPeerEngagementOffer(peerId: string) {
    console.log("WebsocketConnectionStateMachine::startPeerEngagementOffer(): not implemented.");
  }

  processPeerEngagementAnswer(msg: any): boolean {
    console.log(`WebsocketConnectionStateMachine.processPeerEngagementAnswer(): Attempting to process answer SDP from remote vehicle with peer id: <<${msg.peerConnectionId}>>.`);
    // if ( this.myEndpoint ) {

    // }
    return false
  }

  _resetEngagement() {
    console.log("WebsocketConnectionStateMachine::_resetEngagement(): not implemented.");
  }


GuidentRmcwStateMachineDefinition: StateMachineDefinition = {
  initialState: 'start',
    start: {
      onEnter() { console.log("GuidentRmcwStateMachineDefinition::start: entering"); },
      onExit() { console.log("GuidentRmcwStateMachineDefinition::start: exiting"); },
      eventCallbacks: {
        startstopclicked: {
          action(wssm: any, evtData: any) {
            wssm._startConnection();
            wssm._startTimer(10000);
            wssm.onConnecting();
            return "waitingforconnection";
          }
        }
      }
    },
    idle: {
      onEnter() { console.log("GuidentRmcwStateMachineDefinition::idle: entering"); },
      onExit() { console.log("GuidentRmcwStateMachineDefinition::idle: exiting"); },
      eventCallbacks: {
        timeout: {
          action(wssm: any, evtData: any) {
            wssm._startConnection();
            wssm._startTimer(10000);
            wssm.onConnecting();
            return "waitingforconnection";
          }
        },
        startstopclicked: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            wssm.onEndpointStopped();
            return "start";
          }
        }
      }
    },
    waitingforconnection: {
      onEnter() { console.log("GuidentRmcwStateMachineDefinition::waitingforconnection: entering"); },
      onExit() { console.log("GuidentRmcwStateMachineDefinition::waitingforconnection: exiting"); },
      eventCallbacks: {
        timeout: {
          action(wssm: any, evtData: any) {
            wssm._closeConnection();
            wssm._startTimer(10000);
            wssm.onConnectionFailed();
            return "disconnecting";
          }
        },
        connect: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            wssm._startTimer(10000);
            return "connectedwaitingfornotification";
          }
        },
        connectionerror: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            wssm._closeConnection();
            wssm._startTimer(10000);
            wssm.onConnectionFailed();
            return "disconnecting";
          }
        }
      }
    },
    connectedwaitingfornotification: {
      onEnter() { console.log("connectedwaitingfornotification: entering"); },
      onExit() { console.log("connectedwaitingfornotification: exiting"); },
      eventCallbacks: {
        timeout: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            wssm._closeConnection();
            wssm._startTimer(10000);
            wssm.onConnectionFailed();
            return "disconnecting";
          }
        },
        disconnect: {
          action(wssm: any, evtData: any) {
            console.log("WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
            wssm._clearCurrentTimer();
            wssm._startTimer(10000);
            wssm.onConnectionFailed();
            return "idle";
          }
        },
        connectednotification: {
          action(wssm: any, evtData: any) {
            console.log("WebsocketStateMachine::connectednotification(): Received the notification, going to attempt to register");
            wssm._clearCurrentTimer();
            wssm._sendMessage("register");
            wssm._startTimer(10000);
            wssm.onConnectionSuccessful();
            return "registeringwaitingfornotification";
          }
        }
      }
    },
    registeringwaitingfornotification: {
      onEnter() { console.log("registeringwaitingfornotification: entering"); },
      onExit() { console.log("registeringwaitingfornotification: exiting"); },
      eventCallbacks: {
        timeout: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            wssm._closeConnection();
            wssm._startTimer(10000);
            wssm.onRegistrationFailed();
            return "disconnecting";
          }
        },
        rejectednotification: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            wssm._closeConnection();
            wssm._startTimer(10000);
            wssm.onRegistrationFailed();
            return "disconnecting";
          }
        },
        registerednotification: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            wssm.onRegistrationSuccessful();
            return "registered";
          }
        }
      }
    },
    registered: {
      onEnter() { console.log("registered: entering"); },
      onExit() { console.log("registered: exiting"); },
      eventCallbacks: {
        disconnect: {
          action(wssm: any, evtData: any) {
            console.log("registered-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
            wssm._clearCurrentTimer();
            wssm._startTimer(10000);
            wssm.onDisconnected("remote");
            return "idle";
          }
        },
        startstopclicked: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            wssm._closeConnection();
            wssm._startTimer(10000);
            return "disconnectingstop";
          }
        },
        engagementoffer: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            if (wssm.startPeerEngagementAnswer(evtData)) {
              wssm._startTimer(67000);
              return "engagingwithanswer";
            } else {
              console.log("registered-vehiclebuttonclicked(): Oops, error starting offer request.");
              wssm._resetEngagement();
              wssm.onEngagementFailed("config");
              return "registered";
            }
          }
        },
        vehiclebuttonclicked: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            if (wssm.startPeerEngagementOffer(evtData)) {
                wssm._startTimer(67000);
                wssm.onEngaging();
                return "engagingwithoffer";
            } else {
                console.log("registered-vehiclebuttonclicked(): Oops, error starting offer request.");
                wssm._resetEngagement();
                wssm.onEngagementFailed("config");
                return "registered";
            }
          }
        }
      }
    },
    engagingwithoffer: {
        onEnter() { console.log("engagingwithoffer: entering"); },
        onExit() { console.log("engagingwithoffer: exiting"); },
        eventCallbacks: {
        startstopclicked: {
          action(wssm: any, evtData: any) {
            console.log("engagingwithoffer-startstopclicked(): Connection is being reset.");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm._closeConnection();
            wssm._startTimer(10000);
            return "disconnectingstop";
          }
        },
        engagementanswer: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            console.log("engagingwithoffer-engagementanswer(): will process answer sdp.");
            if (!wssm.processPeerEngagementAnswer(evtData)) {
              console.log("engagingwithoffer-engagementanswer(): Oops, error processing answer sdp.");
              wssm._resetEngagement();
              wssm.onEngagementFailed("config");
              wssm.sendMessage("disengage", evtData.peerConnectionId);
              return "registered";
            }
            wssm.onEngagementSuccessful();
            return "engaged";
          }
        },
        rejectednotification: {
          action(wssm: any, evtData: any) {
            console.log("engagingwithoffer-rejectednotification(): Oops, attempted engagement has been rejected!");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm.onEngagementFailed("rejected");
            return "registered";
          }
        },
        disengage: {
          action(wssm: any, evtData: any) {
            console.log("engagingwithoffer-disengage(): Oops, attempted engagement has been rejected!");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm.onEngagementFailed("rejected");
            return "registered";
          }
        },
        engagementerror: {
          action(wssm: any, evtData: any) {
            console.log("engagingwithoffer-engagementerror(): Oops, error during attempted engagement: <<" + evtData + ">>.");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm.onEngagementFailed("rejected");
            return "registered";
          }
        },
        timeout: {
          action(wssm: any, evtData: any) {
            console.log("engagingwithoffer-timeout(): Timeout waiting for engagement answer.");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm.onEngagementFailed("timeout");
            return "registered";
          }
        },
        disconnect: {
          action(wssm: any, evtData: any) {
            console.log("engagingwithoffer-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm._startTimer(10000);
            wssm.onEngagementFailed("rejected");
            wssm.onDisconnected("remote");
            return "idle";
          }
        }
      }
    },
    engagingwithanswer: {
      onEnter() { console.log("engagingwithanswer: entering"); },
      onExit() { console.log("engagingwithanswer: exiting"); },
      eventCallbacks: {
        engagementack: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            console.log("engagingwithanswer-engagementack(): Got the ack.");
            wssm.onEngagementSuccessful();
            return "engaged";
          }
        },
        disengage: {
          action(wssm: any, evtData: any) {
            console.log("engagingwithanswer-disengage(): Timeout waiting for engagement answer.");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm.onEngagementFailed("rejected");
            return "registered";
          }
        },
        engagementerror: {
          action(wssm: any, evtData: any) {
            console.log("engagingwithanswer-engagementerror(): Oops, error during attempted engagement: <<" + evtData + ">>.");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm.onEngagementFailed("rejected");
            return "registered";
          }
        },
        timeout: {
          action(wssm: any, evtData: any) {
            console.log("engagingwithanswer-timeout(): Timeout waiting for engagement answer.");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm.onEngagementFailed("timeout");
            return "registered";
          }
        },
        disconnect: {
          action(wssm: any, evtData: any) {
            console.log("engagingwithanswer-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm._startTimer(10000);
            wssm.onEngagementFailed("rejected");
            wssm.onDisconnected("remote");
            return "idle";
          }
        }
      }
    },
    engaged: {
      onEnter() { console.log("engaged: entering"); },
      onExit() { console.log("engaged: exiting"); },
      eventCallbacks: {
        timeout: {
          action(wssm: any, evtData: any) {
            console.log("engaged-timeout(): Timeout waiting for engagement answer???");
            wssm._clearCurrentTimer();
            return "registered";
          }
        },
        disconnect: {
          action(wssm: any, evtData: any) {
            console.log("engaged-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm._startTimer(10000);
            wssm.onDisengagement();
            wssm.onDisconnected("remote");
            return "idle";
          }
        },
        disengage: {
          action(wssm: any, evtData: any) {
            console.log("engaged-disengagement(): received disengage message.");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm.onDisengagement();
            return "registered";
          }
        },
        engagementerror: {
          action(wssm: any, evtData: any) {
            console.log("engaged-engagementerror(): Oops, error during attempted engagement: <<" + evtData + ">>.");
            wssm._clearCurrentTimer();
            wssm._resetEngagement();
            wssm.onEngagementFailed("rejected");
            return "registered";
          }
        },
        startstopclicked: {
          action(wssm: any, evtData: any) {
            console.log("engaged-startstopclicked(): Disengage button clicked.");
            wssm._clearCurrentTimer();
            wssm._sendDisengagement(evtData);
            wssm._resetEngagement();
            wssm.onDisengagement();
            return "registered";
          }
        }
      }
    },
    disconnecting: {
      onEnter() { console.log("disconnecting: entering"); },
      onExit() { console.log("disconnecting: exiting"); },
      eventCallbacks: {
        disconnect: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            wssm._startTimer(5000);
            wssm.onDisconnected("remote");
            return "idle";
          }
        },
        timeout: {
          action(wssm: any, evtData: any) {
            console.log("disconnecting-timeout(): Huh? Timeout when disconnecting websocket connection.");
            wssm._clearCurrentTimer();
            wssm._startTimer(5000);
            wssm.onDisconnected("remote");
            return "idle";
          }
        }
      }
    },
    disconnectingstop: {
      onEnter() { console.log("disconnectingstop: entering"); },
      onExit() { console.log("disconnectingstop: exiting"); },
      eventCallbacks: {
        disconnect: {
          action(wssm: any, evtData: any) {
            wssm._clearCurrentTimer();
            wssm.onDisconnected("user");
            return "start";
          }
        },
        timeout: {
          action(wssm: any, evtData: any) {
            console.log("disconnectingstop-timeout(): Huh? Timeout when disconnecting websocket connection.");
            wssm._clearCurrentTimer();
            wssm.onDisconnected("user");
            return "start";
          }
        }
      }
    }
  }
};


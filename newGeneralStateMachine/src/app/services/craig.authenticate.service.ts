import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CraigAuthenticateService {

  isAuthenticated: boolean = false;
  authUserEmail: string = "dvega@guident.co";
  authPassword: string = "Guident1!";
  authAccessToken: string = "whaddaya";

  constructor() { }

  authenticate() {

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://dev.bluepepper.us/api/auth/login");
    xhr.setRequestHeader("Content-Type", "application/json");
    const body = JSON.stringify({
        email: this.authUserEmail,
        password: this.authPassword
    });
  
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
          console.log("authenticate::onload(): <<%s>>", xhr.responseText);
          try {
              var jsonBlob = JSON.parse(xhr.responseText);
              this.authAccessToken = jsonBlob.tokens.accessToken;
            if ( this.authAccessToken != undefined && this.authAccessToken != null) {
              this.isAuthenticated = true;
              console.log("Got this access token!! <<%s>>", this.authAccessToken);
            } else {
              console.log("authenticate::onload(): Oops!!");
            }
          } catch(err) {
            console.log("authenticate::onload(): Oops!!");
          }
  
        } else {
          console.log(`Error: ${xhr.status}`);
        }
    };
  
    console.log("authenticate() Sending the authentication request!!");
    xhr.send(body);
  }

  getAuthUserEmail() {
    return("dvega@guident.co");
  }

  getAuthAccessToken() {
      if ( this.isAuthenticated ) {
        return(this.authAccessToken);
      } else {
        return("oops");
      }
  }


}

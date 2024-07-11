import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CraigAuthenticateService {

  isAuthenticated: boolean = false;
  authUserEmail: string = "dvega@guident.co";
  authPassword: string = "Guident1!";
  authAccessToken: string = "whaddaya";

  constructor() { 

  }

  authenticate() {
    // Create a new instance of XMLHttpRequest, which is used to make HTTP requests in JavaScript.
    var xhr = new XMLHttpRequest();

    // Initialize the request as a POST request to the specified URL.
    xhr.open("POST", "https://dev.bluepepper.us/api/auth/login");

    // Set the request header to specify that the request body will be JSON.
    xhr.setRequestHeader("Content-Type", "application/json");

    // Create a JSON string from the email and password to be sent in the request body.
    const body = JSON.stringify({
      email: this.authUserEmail,
      password: this.authPassword
    });

    // Define what to do when the request's state changes and when it completes.
    xhr.onload = () => {
      // Check if the request has completed (readyState 4) and if it was successful (status 200).
      if (xhr.readyState == 4 && xhr.status == 200) {
        // Log the response text for debugging purposes.
        console.log("authenticate::onload(): <<%s>>", xhr.responseText);
        try {
          // Parse the JSON response.
          var jsonBlob = JSON.parse(xhr.responseText);
          // Extract the access token from the response.
          this.authAccessToken = jsonBlob.tokens.accessToken;
          // Check if the access token is defined and not null.
          if (this.authAccessToken != undefined && this.authAccessToken != null) {
            // Set the authentication state to true.
            this.isAuthenticated = true;
            // Log the access token for debugging purposes.
            console.log("Got this access token!! <<%s>>", this.authAccessToken);
          } else {
            // Log an error message if the access token is not found.
            console.log("authenticate::onload(): Oops!!");
          }
        } catch(err) {
            // Log an error message if parsing the JSON response fails.
            console.log("authenticate::onload(): Oops!!");
        }
      } else {
          // Log an error message if the request was not successful.
          console.log(`Error: ${xhr.status}`);
      }
    };

    // Log a message indicating that the authentication request is being sent.
    console.log("authenticate() Sending the authentication request!!");

    // Send the request with the JSON body.
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

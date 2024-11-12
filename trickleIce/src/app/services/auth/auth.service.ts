import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from "../../../environments/environment";

const  serverUrl: string = environment?.apiUrl || '';

type DecodedToken = {
  exp: number,
  iat: number,
  generated_at: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  errorData:any = {};
  //Variable that holds the reference to the interval used to refresh the token, this will be used to clear the interval on logout
  refreshIntervalReference: any;
  refreshTokenNotifier: EventEmitter<any> = new EventEmitter();

  serverError$: Subject<number> = new Subject<number>();


  constructor(
    private http: HttpClient
  )
  { }

  redirectUrl: string = 'dashboard';

  // login(username: string, password: string) {
  //   return this.http.post<any>(`${serverUrl}auth/login`, {email: username, password: password})
  //   .pipe(map(user => {
  //       if (user) {
  //         sessionStorage.setItem('currentUser', JSON.stringify(user));
  //       }
  //     }),
  //     catchError(this.handleError)
  //   );
  // }
  login(username: string, password: string) {
    return this.http.post<any>(`${serverUrl}auth/login`, {email: username, password: password})
    .pipe(
      catchError((err, caught): any=>{

        this.serverError$.next(401);

        throw "User authentication failed";
      })
      ,map(user => {
        if (user) {
          sessionStorage.setItem('currentUser', JSON.stringify(user));
        }
      })
    );
  }

  isLoggedIn() {
    if (sessionStorage.getItem('currentUser')) {
      return true;
    }
    return false;
  }

  getUserDetails() {
    if (sessionStorage.getItem('currentUser') == null) {
      return null;
    } else {
      return JSON.parse(sessionStorage.getItem('currentUser') || '').user;
    }
  }

  getUserEmailAddress() {
    if (sessionStorage.getItem('currentUser') == null) {
      return "unknown";
    } else {
      return JSON.parse(sessionStorage.getItem('currentUser') || '').user.email;
    }
  }

  getAuthorizationToken() {
    if (sessionStorage.getItem('currentUser') == null) {
      return "unknown";
    } else {
      return JSON.parse(sessionStorage.getItem('currentUser') || '').tokens.accessToken;
    }
  }

  logout() {
    sessionStorage.removeItem('currentUser');
    clearInterval(this.refreshIntervalReference);
  }

  private handleError(error: HttpErrorResponse ) {

    if (error.error instanceof ErrorEvent) {

      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {

      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }

    // return an observable with a user-facing error message
    this.errorData = {
      errorTitle: 'Oops! Request for document failed',
      errorDesc: 'Something bad happened. Please try again later.'
    };
    return throwError(this.errorData);
  }

  /**
   * Function to clear the interval created to refresh the token
   */
  clearRefreshTokenInterval(){
    clearInterval(this.refreshIntervalReference);
  }

  refreshToken(){
    //Make the get request to refresh the token
    this.http.get<any>(`${environment.apiUrl}auth/refresh-access-token`).subscribe(response=>{

      //Once we get a reply we will update all of the persistent information
      if ( response ) {
        sessionStorage.setItem('currentUser', JSON.stringify(response));
        this.refreshTokenNotifier.next(true);
      }

    })
  }

  /**
   * Function to start an interval that will refresh the accessToken every X amount of time
   */
  startRefreshTokenInterval(): void {

    //Make sure that the user is logged in
    if( this.isLoggedIn() ) {

      setInterval(()=>{

        this.refreshToken();

        //Refresh the token every half of the total time it takes the access token to expire
      }, environment.tokenExpireTime / 2);

    }

  }

  validateToken(){
    // this.http.get<any>(`${environment.apiUrl}auth/validate-token`)
    // .pipe(catchError(err => of("Forbidden")))
    // .subscribe( res =>{
    //   try{
    //     if("message" in res && res.message == "authorized"){
    //       console.table(res)
    //     }
    //   } catch{
    //     if(res == "Forbidden"){
    //       console.error("AuthService::validateToken(): Token is no longer valid, attempting re-authentication of user");
    //       this.refreshToken();
    //     }
    //   }
    // })
  }
}

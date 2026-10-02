import { Injectable } from '@angular/core';
import { User } from '../model/user';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AppConsts } from '../common/consts';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { catchError, distinct } from 'rxjs/operators';
import { AppUtil } from '../common/app-util';
import jwt_decode from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private url = `${AppConsts.BASE_URL}/api/login`;
  private readonly jwtHelper = new JwtHelperService();
  //TODO: check gym id type:
  //private gymId: number;
  
  private currentUserSubject: BehaviorSubject<User> = new BehaviorSubject<User>(
    null
  );

  constructor(private http: HttpClient, private router: Router) {
    this.setCurrentUser();
  
  }

  public isAuthenticated(): boolean {
    const token = localStorage.getItem(AppConsts.KEY_USER_TOKEN);
    if (!token) {
      return false;
    }
    const tokenExpired = this.jwtHelper.isTokenExpired(token);
    return !tokenExpired;
  }

  public login(user: User): Observable<any> {
    return this.http
      .post<string>(this.url, user, { observe: 'response' })
      .pipe(catchError(AppUtil.handleError));
  }

  get currentUser$(): Observable<User> {
    return this.currentUserSubject.asObservable().pipe(distinct());
  }

  public setCurrentUserSubject(user: User) {
    this.currentUserSubject.next(user);
  }

  public persistTokenFromResponse(response: any): void {
    if (!response[`status`] || response[`status`] !== 200) {
      throw new Error('Response status should be 200');
    }

    if (!response[`headers`]) {
      throw new Error('No headers found in response');
    }

    const headers = response[`headers`];

    const authorizationValue: string = headers.get(`Authorization`);

    if (!authorizationValue) {
      throw new Error('Cannot find token inside headers');
    }

    window.localStorage.setItem(AppConsts.KEY_USER_TOKEN, authorizationValue);
    const user = this.extractUserFromToken(authorizationValue);
    this.currentUserSubject.next(user);
  }

  logout() {
    localStorage.removeItem(AppConsts.KEY_USER_TOKEN);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  public isAdmin(): boolean {
    const token: string = window.localStorage.getItem(
      AppConsts.KEY_USER_TOKEN
    )!;

    const user: User = this.extractUserFromToken(token);

    if (user.roleId === 2) {
      return true;
    }

    return false;
  }

  public setCurrentUser() {
    const token: string = window.localStorage.getItem(
      AppConsts.KEY_USER_TOKEN
    )!;

    const user = this.extractUserFromToken(token);
    this.currentUserSubject.next(user);
  }

  private extractUserFromToken(token: string): User {
    if (!token) {
      return null;
    }
    try {
      const decodedToken = this.jwtHelper.decodeToken(token);

      const user: User = { ...decodedToken.sub };

      AppUtil.removePassword(user);

      return user;
    } catch (ex) {
      console.error('Saved user token is currupted');
      this.logout();
      return null;
    }
  }

  public getGymId(): number {
    const token = localStorage.getItem(AppConsts.KEY_USER_TOKEN);

    const decodedToken = this.jwtHelper.decodeToken(token);

    const user: User = { ...decodedToken.sub };

    const gymId = user.gymId;
    return gymId;
  }
}

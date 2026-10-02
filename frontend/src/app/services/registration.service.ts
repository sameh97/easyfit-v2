import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../model/user';
import { Observable } from 'rxjs';
import { AppConsts } from '../common/consts';
import { catchError } from 'rxjs/operators';
import { AppUtil } from '../common/app-util';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private url: string = `${AppConsts.BASE_URL}/api/register`;
  constructor(private http: HttpClient) {}

  public register(user: User): Observable<any> {
    console.log(
      `user from reg service ${user.firstName} ${JSON.stringify(user)}`
    );
    return this.http
      .post<string>(this.url, user, { observe: 'response' })
      .pipe(catchError(AppUtil.handleError));
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { CoreUtil } from 'src/app/common/core-util';
import { Gym } from 'src/app/model/gym';

@Injectable({
  providedIn: 'root',
})
export class GymsService {
  private readonly url = `${AppConsts.BASE_URL}/api`;
  private gymSubject: BehaviorSubject<Gym[]> = new BehaviorSubject<Gym[]>(null);

  constructor(private http: HttpClient) {}

  public getAll = (): Observable<Gym[]> => {
    return this.http
      .get<Gym[]>(`${this.url}/gym`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        switchMap((gyms) => {
          this.gymSubject.next(gyms);
          return this.gymSubject.asObservable();
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public create = (gym: Gym): Observable<any> => {
    return this.http
      .post<Gym>(`${this.url}/add-gym`, gym, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((gym: Gym) => {
          AppUtil.addToSubject(this.gymSubject, gym);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public update = (gym: Gym): Observable<Gym> => {
    return this.http
      .put<Gym>(`${this.url}/gym`, gym, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((gym: Gym) => {
          AppUtil.updateInSubject(this.gymSubject, gym);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public delete = (id: number): Observable<any> => {
    return this.http
      .delete(`${this.url}/gym?id=${id}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap(() => {
          AppUtil.removeFromSubject(this.gymSubject, id);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };
}

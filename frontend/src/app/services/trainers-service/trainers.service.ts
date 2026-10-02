import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { CoreUtil } from 'src/app/common/core-util';
import { Trainer } from 'src/app/model/trainer';
import { AuthenticationService } from '../authentication.service';

@Injectable({
  providedIn: 'root',
})
export class TrainersService {
  private readonly url = `${AppConsts.BASE_URL}/api/trainers`;
  private readonly addUrl = `${AppConsts.BASE_URL}/api/add-trainer`;
  private readonly deleteUrl = `${AppConsts.BASE_URL}/api/delete-trainer`;
  private readonly updateUrl = `${AppConsts.BASE_URL}/api/update-trainer`;
  private gymId: number;
  private trainersSubject: BehaviorSubject<Trainer[]> = new BehaviorSubject<
    Trainer[]
  >(null);

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {
    this.authService.currentUser$
      .pipe(filter((user) => AppUtil.hasValue(user)))
      .subscribe((user) => {
        this.gymId = user.gymId;
        this.gymId = this.authService.getGymId();
      });
  }

  public create = (trainer: Trainer): Observable<any> => {
    trainer.gymId = this.gymId;

    return this.http
      .post<Trainer>(`${this.addUrl}?gymId=${this.gymId}`, trainer, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((trainer: Trainer) => {
          AppUtil.addToSubject(this.trainersSubject, trainer);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public getAll = (): Observable<Trainer[]> => {
    this.gymId = this.authService.getGymId();
    return this.http
      .get<Trainer[]>(`${this.url}?gymId=${this.gymId}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        switchMap((trainers) => {
          this.trainersSubject.next(trainers);
          return this.trainersSubject.asObservable();
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public update = (trainer: Trainer): Observable<Trainer> => {
    return this.http
      .put<Trainer>(this.updateUrl, trainer, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((trainer: Trainer) => {
          AppUtil.updateInSubject(this.trainersSubject, trainer);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public delete = (id: number): Observable<any> => {
    return this.http
      .delete(`${this.deleteUrl}?id=${id}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap(() => {
          AppUtil.removeFromSubject(this.trainersSubject, id);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public getById = (id: number): Observable<Trainer> => {
    return this.http.get<Trainer>(
      `${AppConsts.BASE_URL}/api/trainer?gymId=${this.gymId}&id=${id}`,
      {
        headers: CoreUtil.createAuthorizationHeader(),
      }
    );
  };
}

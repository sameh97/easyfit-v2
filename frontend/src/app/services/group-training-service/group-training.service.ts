import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { CoreUtil } from 'src/app/common/core-util';
import { GroupTraining } from 'src/app/model/group-training';
import { AuthenticationService } from '../authentication.service';

@Injectable({
  providedIn: 'root',
})
export class GroupTrainingService {
  private readonly url = `${AppConsts.BASE_URL}/api`;
  private groupTrainingSubject: BehaviorSubject<GroupTraining[]> =
    new BehaviorSubject<GroupTraining[]>(null);
  gymId: number;

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {
    this.authService.currentUser$
      .pipe(filter((user) => AppUtil.hasValue(user)))
      .subscribe((user) => {
        this.gymId = user.gymId;
      });
  }

  public getAll = (): Observable<GroupTraining[]> => {
    return this.http
      .get<GroupTraining[]>(`${this.url}/group-trainings?gymId=${this.gymId}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        switchMap((groupTrainings: GroupTraining[]) => {
          this.groupTrainingSubject.next(groupTrainings);
          return this.groupTrainingSubject.asObservable();
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public create = (groupTraining: GroupTraining): Observable<GroupTraining> => {
    groupTraining.gymId = this.gymId;

    return this.http
      .post<GroupTraining>(`${this.url}/group-training`, groupTraining, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((groupTraining: GroupTraining) => {
          AppUtil.addToSubject(this.groupTrainingSubject, groupTraining);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public update = (groupTraining: GroupTraining): Observable<GroupTraining> => {
    return this.http
      .put<GroupTraining>(`${this.url}/group-training`, groupTraining, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((groupTraining: GroupTraining) => {
          AppUtil.updateInSubject(this.groupTrainingSubject, groupTraining);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public delete = (id: number): Observable<any> => {
    return this.http
      .delete(`${this.url}/group-training?id=${id}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap(() => {
          AppUtil.removeFromSubject(this.groupTrainingSubject, id);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };
}

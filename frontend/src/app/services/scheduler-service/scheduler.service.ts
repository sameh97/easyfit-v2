import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { CoreUtil } from 'src/app/common/core-util';
import { ScheduledJob } from 'src/app/model/scheduled-job';
import { AuthenticationService } from '../authentication.service';

@Injectable({
  providedIn: 'root',
})
export class SchedulerService {
  private readonly url = `${AppConsts.BASE_URL}/api`;
  private scheduleSubject: BehaviorSubject<ScheduledJob[]> =
    new BehaviorSubject<ScheduledJob[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {
    this.authService.currentUser$
      .pipe(filter((user) => AppUtil.hasValue(user)))
      .subscribe((user) => {
        this.gymId = user.gymId;
        this.initGymID();
      });
  }

  private gymId: number;

  private initGymID = (): void => {
    this.gymId = this.authService.getGymId();
  };

  public create = (scheduleJob: ScheduledJob): Observable<ScheduledJob> => {
    this.initGymID();
    scheduleJob.gymId = this.gymId;

    return this.http
      .post<ScheduledJob>(
        `${this.url}/add-schedule?gymId=${this.gymId}`,
        scheduleJob,
        {
          headers: CoreUtil.createAuthorizationHeader(),
        }
      )
      .pipe(
        tap((scheduledJob: ScheduledJob) => {
          AppUtil.addToSubject(this.scheduleSubject, scheduledJob);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public getAll = (): Observable<ScheduledJob[]> => {
    this.initGymID();
    return this.http
      .get<ScheduledJob[]>(`${this.url}/schedules?gymId=${this.gymId}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        switchMap((scheduledJob) => {
          this.scheduleSubject.next(scheduledJob);
          return this.scheduleSubject.asObservable();
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public update = (scheduledJob: ScheduledJob): Observable<ScheduledJob> => {
    return this.http
      .put<ScheduledJob>(`${this.url}/update-schedule`, scheduledJob, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((scheduledJob: ScheduledJob) => {
          AppUtil.updateInSubject(this.scheduleSubject, scheduledJob);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public delete = (id: number): Observable<any> => {
    return this.http
      .delete(`${this.url}/delete-schedule?id=${id}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap(() => {
          AppUtil.removeFromSubject(this.scheduleSubject, id);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };
}

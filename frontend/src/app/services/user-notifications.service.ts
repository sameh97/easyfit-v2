import { AppNotificationMessage } from '../model/app-notification-message';
import { AppUtil } from '../common/app-util';
import { CoreUtil } from '../common/core-util';
import { ClientDataService } from '../services/client-data.service';
import { User } from '../model/user';
import { AuthenticationService } from './authentication.service';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { map, catchError, take, filter, switchMap, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AppConsts } from '../common/consts';

@Injectable({
  providedIn: 'root',
})
export class UserNotificationsService extends ClientDataService {
  private gymId: number;
  private singleMachineNotificationsListSubject = new BehaviorSubject<
    AppNotificationMessage[]
  >([]);

  private myNotificationsListSubject = new BehaviorSubject<
    AppNotificationMessage[]
  >([]);

  constructor(
    private authService: AuthenticationService,
    public http: HttpClient
  ) {
    super(`${AppConsts.BASE_URL}/api`, http);

    this.authService.currentUser$
      .pipe(filter((user) => AppUtil.hasValue(user)))
      .subscribe((user) => {
        this.gymId = user.gymId;
        this.initGymID();
      });
  }

  private initGymID = (): void => {
    this.gymId = this.authService.getGymId();
  };

  public getAllGrouped = (): Observable<AppNotificationMessage[]> => {
    this.initGymID();
    return this.authService.currentUser$.pipe(
      switchMap((user) => {
        return this.http
          .get<any[]>(
            `${AppConsts.BASE_URL}/api/machine/all-notifications?gymId=${this.gymId}`,
            {
              headers: CoreUtil.createAuthorizationHeader(),
            }
          )
          .pipe(catchError(AppUtil.handleError));
      })
    );
  };

  public getAll = (): Observable<AppNotificationMessage[]> => {
    return this.authService.currentUser$.pipe(
      filter(u => AppUtil.hasValue(u)),
      switchMap((user) => {
        return this.http
          .get<any[]>(
            `${AppConsts.BASE_URL}/api/notifications?gymId=${user.gymId}`,
            {
              headers: CoreUtil.createAuthorizationHeader(),
            }
          )
          .pipe(catchError(AppUtil.handleError))
          .pipe(
            switchMap((notifications: AppNotificationMessage[]) => {
              this.myNotificationsListSubject.next(notifications);
              return this.myNotificationsListSubject.asObservable();
            })
          );
      })
    );
  };

  public getByMachineSerialNumber = (
    machineSerialNumber: string
  ): Observable<AppNotificationMessage[]> => {
    return this.authService.currentUser$.pipe(
      switchMap((user) => {
        return this.http
          .get<AppNotificationMessage[]>(
            `${AppConsts.BASE_URL}/api/machine/notifications?gymId=${this.gymId}&machineSerialNumber=${machineSerialNumber}`,
            {
              headers: CoreUtil.createAuthorizationHeader(),
            }
          )
          .pipe(
            switchMap((notifications: AppNotificationMessage[]) => {
              this.singleMachineNotificationsListSubject.next(notifications);
              return this.singleMachineNotificationsListSubject.asObservable();
            })
          );
      })
    );
  };

  public update = (
    appNotificationMessage: AppNotificationMessage
  ): Observable<AppNotificationMessage> => {
    return this.http
      .put<AppNotificationMessage>(
        `${AppConsts.BASE_URL}/api/notification`,
        appNotificationMessage,
        {
          headers: CoreUtil.createAuthorizationHeader(),
        }
      )
      .pipe(
        tap((appNotificationMessage: AppNotificationMessage) => {
          AppUtil.updateInSubject(
            this.myNotificationsListSubject,
            appNotificationMessage
          );
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public deleteByTargetObjectId = (
    machineSerialNumber: string
  ): Observable<any> => {
    return this.authService.currentUser$.pipe(
      switchMap((user) => {
        return this.http
          .delete(
            `${AppConsts.BASE_URL}/api/machine-notifications?gymId=${this.gymId}&machineSerialNumber=${machineSerialNumber}`,
            {
              headers: CoreUtil.createAuthorizationHeader(),
            }
          )
          .pipe(
            switchMap((res) => {
              this.removeAllFromSubject(
                this.singleMachineNotificationsListSubject
              );
              this.removeFromSubject(
                this.myNotificationsListSubject,
                machineSerialNumber
              );
              return of(null);
            })
          )
          .pipe(catchError(AppUtil.handleError));
      })
    );
  };

  public removeFromSubject(
    subjectData: BehaviorSubject<any[]>,
    machineSerialNumber: any
  ): void {
    var currData: any[] = subjectData.value;
    if (!currData) {
      currData = [];
    }

    const filtered = currData.filter(
      (e) => String(e.targetObjectId) != String(machineSerialNumber)
    );

    subjectData.next(filtered);
  }

  public removeAllFromSubject(subjectData: BehaviorSubject<any[]>): void {
    subjectData.next([]);
  }
}

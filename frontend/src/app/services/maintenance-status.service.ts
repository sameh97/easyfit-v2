import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, filter, switchMap } from 'rxjs/operators';
import { AppUtil } from '../common/app-util';
import { AppConsts } from '../common/consts';
import { CoreUtil } from '../common/core-util';
import { MaintenanceJobStatus, MaintenanceStatus } from '../model/maintenance-status';
import { ADMIN_ROLE_ID, User } from '../model/user';
import { AuthenticationService } from './authentication.service';
import { MaintenanceAlertsService } from './maintenance-alerts.service';

export type StatusState = 'loading' | 'ready' | 'error';

/**
 * The read-only GET /api/maintenance/status: next run and due today / overdue per job, open
 * alerts per machine. Machines, Maintenance and the sidebar badge all read it, so they agree.
 * Reloads when an alert arrives or is cleared; job changes call reload().
 */
@Injectable({
  providedIn: 'root',
})
export class MaintenanceStatusService implements OnDestroy {
  private readonly statusSubject = new BehaviorSubject<MaintenanceStatus | null>(null);
  private readonly stateSubject = new BehaviorSubject<StatusState>('loading');
  private readonly reloadRequests = new Subject<void>();
  private readonly subscriptions: Subscription[] = [];

  /** null until the first successful load. */
  readonly status$: Observable<MaintenanceStatus | null> = this.statusSubject.asObservable();
  readonly state$: Observable<StatusState> = this.stateSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthenticationService, alerts: MaintenanceAlertsService) {
    this.subscriptions.push(
      this.reloadRequests.pipe(switchMap(() => this.fetch())).subscribe((status: MaintenanceStatus | null) => {
        if (status === null) {
          this.stateSubject.next('error');
          return;
        }
        this.statusSubject.next(status);
        this.stateSubject.next('ready');
      })
    );
    this.subscriptions.push(
      // The admin has no gym: nothing to load.
      this.auth.currentUser$.pipe(filter((user: User | null) => AppUtil.hasValue(user) && user?.roleId !== ADMIN_ROLE_ID)).subscribe(() => this.reload())
    );
    this.subscriptions.push(merge(alerts.arrived$, alerts.cleared$).pipe(debounceTime(300)).subscribe(() => this.reload()));
  }

  get status(): MaintenanceStatus | null {
    return this.statusSubject.value;
  }

  get state(): StatusState {
    return this.stateSubject.value;
  }

  reload(): void {
    if (!this.status) {
      this.stateSubject.next('loading');
    }
    this.reloadRequests.next();
  }

  jobStatus(jobId: number): MaintenanceJobStatus | null {
    return this.status?.jobs.find((job: MaintenanceJobStatus) => job.jobId === jobId) ?? null;
  }

  private fetch(): Observable<MaintenanceStatus | null> {
    // The server's "today" is the browser's local day (same as the dashboard summary).
    const tzOffset: number = new Date().getTimezoneOffset();
    return this.http
      .get<MaintenanceStatus>(`${AppConsts.BASE_URL}/api/maintenance/status?tzOffset=${tzOffset}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(catchError(() => of(null)));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

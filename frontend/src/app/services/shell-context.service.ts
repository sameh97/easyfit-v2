import { Injectable } from '@angular/core';
import { combineLatest, Observable, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { DashboardSummary } from '../model/dashboard-summary';
import { MaintenanceStatus } from '../model/maintenance-status';
import { MaintenanceStatusService } from './maintenance-status.service';
import { User } from '../model/user';
import { AuthenticationService } from './authentication.service';
import { DashboardService } from './dashboard-service/dashboard.service';

export interface ShellContext {
  gymName: string | null;
  memberCount: number | null;
  /** Maintenance jobs due today or overdue. */
  maintenanceDue: number | null;
}

const EMPTY_CONTEXT: ShellContext = { gymName: null, memberCount: null, maintenanceDue: null };

/** Data the shell shows on every page (gym card, Members and Maintenance badges). */
@Injectable({
  providedIn: 'root',
})
export class ShellContextService {
  readonly context$: Observable<ShellContext> = this.authService.currentUser$.pipe(
    switchMap((user: User | null) => {
      if (!user) {
        return of(EMPTY_CONTEXT);
      }
      this.dashboardService.ensureLoaded();
      // The Maintenance badge reads the maintenance status (same rule as the dashboard), which
      // reloads on alerts, Done and job changes; the dashboard number only covers its first load.
      return combineLatest([this.dashboardService.summary$, this.maintenanceStatus.status$]).pipe(
        map(([summary, status]: [DashboardSummary | null, MaintenanceStatus | null]) =>
          summary
            ? {
                gymName: summary.gym.name || null,
                memberCount: summary.gym.memberCount,
                maintenanceDue: status ? status.due.total : summary.maintenanceDue.total,
              }
            : EMPTY_CONTEXT
        )
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(
    private authService: AuthenticationService,
    private dashboardService: DashboardService,
    private maintenanceStatus: MaintenanceStatusService
  ) {}
}

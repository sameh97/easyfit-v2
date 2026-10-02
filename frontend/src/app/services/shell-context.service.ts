import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { DashboardSummary } from '../model/dashboard-summary';
import { User } from '../model/user';
import { AuthenticationService } from './authentication.service';
import { DashboardService } from './dashboard-service/dashboard.service';

export interface ShellContext {
  gymName: string | null;
  memberCount: number | null;
}

const EMPTY_CONTEXT: ShellContext = { gymName: null, memberCount: null };

/** Data the shell shows on every page (gym card, Members badge), taken from the dashboard summary. */
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
      return this.dashboardService.summary$.pipe(
        map((summary: DashboardSummary | null) =>
          summary ? { gymName: summary.gym.name || null, memberCount: summary.gym.memberCount } : EMPTY_CONTEXT
        )
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private authService: AuthenticationService, private dashboardService: DashboardService) {}
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, distinctUntilChanged, finalize, map, tap } from 'rxjs/operators';
import { AppConsts } from 'src/app/common/consts';
import { AppUtil } from 'src/app/common/app-util';
import { CoreUtil } from 'src/app/common/core-util';
import { DashboardSummary } from 'src/app/model/dashboard-summary';
import { User } from 'src/app/model/user';
import { AuthenticationService } from '../authentication.service';

/**
 * Loads GET /api/dashboard/summary and keeps the latest result, so the shell (gym card,
 * Members badge) and the dashboard share one request. The gym is resolved on the server.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly url = `${AppConsts.BASE_URL}/api/dashboard/summary`;
  private readonly summarySubject = new BehaviorSubject<DashboardSummary | null>(null);
  private inFlight: Observable<DashboardSummary> | null = null;

  /** Latest summary (null until the first load). */
  readonly summary$: Observable<DashboardSummary | null> = this.summarySubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthenticationService) {
    // Drop the cache when the signed-in user changes (log out / log in as someone else).
    this.authService.currentUser$
      .pipe(
        map((user: User | null) => (user ? user.id : null)),
        distinctUntilChanged()
      )
      .subscribe(() => this.summarySubject.next(null));
  }

  /** Fetches a fresh summary. */
  load(): Observable<DashboardSummary> {
    if (!this.inFlight) {
      // Browser offset (UTC − local, minutes) so "today" and "this month" match the gym's clock.
      const tzOffset: number = new Date().getTimezoneOffset();
      this.inFlight = this.http
        .get<DashboardSummary>(`${this.url}?tzOffset=${tzOffset}`, {
          headers: CoreUtil.createAuthorizationHeader(),
        })
        .pipe(
          tap((summary: DashboardSummary) => this.summarySubject.next(summary)),
          catchError(AppUtil.handleError),
          finalize(() => (this.inFlight = null))
        );
    }
    return this.inFlight;
  }

  /** Loads once if nothing is cached yet; errors are left to the dashboard page to show. */
  ensureLoaded(): void {
    if (!this.summarySubject.value && !this.inFlight) {
      this.load().subscribe({ error: () => undefined });
    }
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, forkJoin, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, filter, map, switchMap, tap } from 'rxjs/operators';
import { AppUtil } from '../common/app-util';
import { AppConsts } from '../common/consts';
import { CoreUtil } from '../common/core-util';
import { Machine } from '../model/machine';
import { User } from '../model/user';
import { SocketTopics } from '../shared/util/socket-util';
import { AuthenticationService } from './authentication.service';
import { WebSocketService } from './web-socket.service';

export type JobType = 'clean' | 'service';

/** jobID → type, as in the backend's Consts (1 = clean, 2 = service). */
export function jobTypeOf(jobID: number | null | undefined): JobType {
  return Number(jobID) === 1 ? 'clean' : 'service';
}

/** One open (not Done) maintenance alert: a scheduled job's run that fired. */
export interface MaintenanceAlert {
  id: number;
  machineSerialNumber: string;
  /** The scheduled job that fired, read from the alert's content; null for unreadable content. */
  jobId: number | null;
  jobType: JobType;
  createdAt: Date;
  /** As received, sent back unchanged when one alert is marked Done. */
  content: unknown;
  topic: string;
}

/** A machine's open alerts, newest first (§5.10: grouped by machine). */
export interface MachineAlertGroup {
  serialNumber: string;
  /** null when the machine no longer exists. */
  machineId: number | null;
  machineName: string | null;
  alerts: MaintenanceAlert[];
  latestAt: Date;
  jobTypes: JobType[];
}

export type AlertsState = 'loading' | 'ready' | 'error';

/** The alert DTO of GET /api/notifications (content = the scheduled job as JSON). */
interface AlertDto {
  id: number;
  content: unknown;
  topic: string;
  targetObjectId: string;
  createdAt: string;
}

/** Job alerts can arrive in bursts (several jobs at 06:00); reload once things settle. */
const SOCKET_DEBOUNCE_MS: number = 800;

/**
 * Open maintenance alerts of the gym, grouped by machine. One store for the bell count, the bell
 * panel and the machine panel, so they always agree. Reads the existing endpoints
 * (GET /api/notifications + GET /api/machines), reloads when an alert arrives over socket.io,
 * and owns Done (one machine) and Clear all (whole gym), also through the existing endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class MaintenanceAlertsService implements OnDestroy {
  private readonly groupsSubject = new BehaviorSubject<MachineAlertGroup[]>([]);
  private readonly stateSubject = new BehaviorSubject<AlertsState>('loading');
  private readonly reloadRequests = new Subject<void>();
  private readonly subscriptions: Subscription[] = [];

  readonly groups$: Observable<MachineAlertGroup[]> = this.groupsSubject.asObservable();
  readonly state$: Observable<AlertsState> = this.stateSubject.asObservable();
  readonly count$: Observable<number> = this.groups$.pipe(map((groups: MachineAlertGroup[]) => countAlerts(groups)));
  /** Emits after Done or Clear all changed the alerts (due/overdue counts depend on them). */
  readonly cleared$ = new Subject<void>();
  /** Emits when a job fired (socket.io), after a burst of alerts settles. */
  readonly arrived$ = new Subject<void>();

  constructor(private http: HttpClient, private auth: AuthenticationService, private socket: WebSocketService) {
    this.subscriptions.push(
      this.reloadRequests.pipe(switchMap(() => this.fetch())).subscribe((groups: MachineAlertGroup[] | null) => {
        if (groups === null) {
          this.stateSubject.next('error');
          return;
        }
        this.groupsSubject.next(groups);
        this.stateSubject.next('ready');
      })
    );
    this.subscriptions.push(
      this.auth.currentUser$.pipe(filter((user: User | null) => AppUtil.hasValue(user))).subscribe(() => this.reload())
    );
    const topics: string[] = [SocketTopics.TOPIC_GROUPED_NOTIFICATION, SocketTopics.TOPIC_CLEAN_MACHINE, SocketTopics.TOPIC_MACHINE_SERVICE];
    this.subscriptions.push(
      merge(...topics.map((topic: string) => this.socket.onMessage(topic)))
        .pipe(debounceTime(SOCKET_DEBOUNCE_MS))
        .subscribe(() => {
          this.reload();
          this.arrived$.next();
        })
    );
  }

  get groups(): MachineAlertGroup[] {
    return this.groupsSubject.value;
  }

  get state(): AlertsState {
    return this.stateSubject.value;
  }

  get count(): number {
    return countAlerts(this.groups);
  }

  groupFor(serialNumber: string): MachineAlertGroup | null {
    return this.groups.find((group: MachineAlertGroup) => group.serialNumber === serialNumber) ?? null;
  }

  reload(): void {
    if (!this.groups.length) {
      this.stateSubject.next('loading');
    }
    this.reloadRequests.next();
  }

  /** Done: clears every open alert of one machine (DELETE /api/machine-notifications). */
  clearMachine(serialNumber: string): Observable<void> {
    const url: string = `${AppConsts.BASE_URL}/api/machine-notifications?gymId=${this.gymId}&machineSerialNumber=${encodeURIComponent(serialNumber)}`;
    return this.http.delete(url, { headers: CoreUtil.createAuthorizationHeader(), responseType: 'text' }).pipe(
      tap(() => {
        this.groupsSubject.next(this.groups.filter((group: MachineAlertGroup) => group.serialNumber !== serialNumber));
        this.cleared$.next();
      }),
      map(() => undefined)
    );
  }

  /** Done on one alert (PUT /api/notification with seen = true, as the legacy machine dialog did). */
  markDone(alert: MaintenanceAlert): Observable<void> {
    const body = {
      id: alert.id,
      content: alert.content,
      topic: alert.topic,
      gymId: this.gymId,
      seen: true,
      targetObjectId: alert.machineSerialNumber,
    };
    return this.http.put(`${AppConsts.BASE_URL}/api/notification`, body, { headers: CoreUtil.createAuthorizationHeader() }).pipe(
      tap(() => {
        this.groupsSubject.next(
          this.groups
            .map((group: MachineAlertGroup) => withoutAlert(group, alert.id))
            .filter((group: MachineAlertGroup | null): group is MachineAlertGroup => group !== null)
        );
        this.cleared$.next();
      }),
      map(() => undefined)
    );
  }

  /** Clear all: every open alert of the gym (DELETE /api/gym-notifications). */
  clearAll(): Observable<void> {
    const url: string = `${AppConsts.BASE_URL}/api/gym-notifications?gymId=${this.gymId}`;
    return this.http.delete(url, { headers: CoreUtil.createAuthorizationHeader(), responseType: 'text' }).pipe(
      tap(() => {
        this.groupsSubject.next([]);
        this.cleared$.next();
      }),
      map(() => undefined)
    );
  }

  private get gymId(): number {
    return this.auth.getGymId();
  }

  private fetch(): Observable<MachineAlertGroup[] | null> {
    const headers = CoreUtil.createAuthorizationHeader();
    return forkJoin({
      alerts: this.http.get<AlertDto[]>(`${AppConsts.BASE_URL}/api/notifications?gymId=${this.gymId}`, { headers }),
      machines: this.http.get<Machine[]>(`${AppConsts.BASE_URL}/api/machines?gymId=${this.gymId}`, { headers }),
    }).pipe(
      map(({ alerts, machines }: { alerts: AlertDto[]; machines: Machine[] }) => groupAlerts(alerts, machines)),
      catchError(() => of(null))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

/** The group without one alert, or null when that was its last one. */
function withoutAlert(group: MachineAlertGroup, alertId: number): MachineAlertGroup | null {
  const alerts: MaintenanceAlert[] = group.alerts.filter((alert: MaintenanceAlert) => alert.id !== alertId);
  if (alerts.length === group.alerts.length) {
    return group;
  }
  if (!alerts.length) {
    return null;
  }
  return {
    ...group,
    alerts,
    latestAt: alerts[0].createdAt,
    jobTypes: (['clean', 'service'] as JobType[]).filter((type: JobType) => alerts.some((alert: MaintenanceAlert) => alert.jobType === type)),
  };
}

function countAlerts(groups: MachineAlertGroup[]): number {
  return groups.reduce((sum: number, group: MachineAlertGroup) => sum + group.alerts.length, 0);
}

function toAlert(dto: AlertDto): MaintenanceAlert {
  const job: { id?: unknown; jobID?: unknown } =
    dto.content !== null && typeof dto.content === 'object' ? (dto.content as { id?: unknown; jobID?: unknown }) : {};
  return {
    id: dto.id,
    machineSerialNumber: dto.targetObjectId,
    jobId: typeof job.id === 'number' ? job.id : null,
    jobType: typeof job.jobID === 'number' ? jobTypeOf(job.jobID) : dto.topic === SocketTopics.TOPIC_CLEAN_MACHINE ? 'clean' : 'service',
    createdAt: new Date(dto.createdAt),
    content: dto.content,
    topic: dto.topic,
  };
}

/** Groups by machine; machines with the newest alert come first. */
function groupAlerts(dtos: AlertDto[], machines: Machine[]): MachineAlertGroup[] {
  const machinesBySerial = new Map<string, Machine>(machines.map((machine: Machine) => [String(machine.serialNumber), machine]));
  const bySerial = new Map<string, MaintenanceAlert[]>();
  dtos.map(toAlert).forEach((alert: MaintenanceAlert) => {
    bySerial.set(alert.machineSerialNumber, [...(bySerial.get(alert.machineSerialNumber) ?? []), alert]);
  });
  return Array.from(bySerial.entries())
    .map(([serialNumber, alerts]: [string, MaintenanceAlert[]]) => {
      const sorted: MaintenanceAlert[] = [...alerts].sort((a: MaintenanceAlert, b: MaintenanceAlert) => b.createdAt.getTime() - a.createdAt.getTime());
      const machine: Machine | undefined = machinesBySerial.get(serialNumber);
      return {
        serialNumber,
        machineId: machine?.id ?? null,
        machineName: machine?.name ?? null,
        alerts: sorted,
        latestAt: sorted[0].createdAt,
        jobTypes: (['clean', 'service'] as JobType[]).filter((type: JobType) => sorted.some((alert: MaintenanceAlert) => alert.jobType === type)),
      };
    })
    .sort((a: MachineAlertGroup, b: MachineAlertGroup) => b.latestAt.getTime() - a.latestAt.getTime());
}

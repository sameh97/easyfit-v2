import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { CoreUtil } from 'src/app/common/core-util';
import { Machine } from 'src/app/model/machine';
import { Member } from 'src/app/model/member';
import { AuthenticationService } from '../authentication.service';

@Injectable({
  providedIn: 'root',
})
export class MachinesService {
  private readonly url = `${AppConsts.BASE_URL}/api/machines`;
  private gymId: number;
  private machineSubject: BehaviorSubject<Machine[]> = new BehaviorSubject<
    Machine[]
  >(null);

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}

  public getBySerialNumber = (
    machineSerialNumber: number
  ): Observable<Machine> => {
    return this.http.get<Machine>(
      `${AppConsts.BASE_URL}/api/machine?serialNumber=${machineSerialNumber}`,
      {
        headers: CoreUtil.createAuthorizationHeader(),
      }
    );
  };

  public create = (machine: Machine): Observable<any> => {
    this.initGymID();
    machine.gymId = this.gymId;

    //TODO: check if query is needed:
    return this.http
      .post<Machine>(
        `${AppConsts.BASE_URL}/api/machine?gymId=${this.gymId}`,
        machine,
        {
          headers: CoreUtil.createAuthorizationHeader(),
        }
      )
      .pipe(
        tap((machine: Machine) => {
          AppUtil.addToSubject(this.machineSubject, machine);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public removeFromSubject(
    subjectData: BehaviorSubject<any[]>,
    serialNumber: any
  ): void {
    var currData: any[] = subjectData.value;
    if (!currData) {
      currData = [];
    }
    let indexToDelete = -1;
    for (let i = 0; i < currData.length; i++) {
      if (String(currData[i].serialNumber) === String(serialNumber)) {
        indexToDelete = i;
        break;
      }
    }
    if (indexToDelete >= 0) {
      currData.splice(indexToDelete, 1);
    }
    subjectData.next(currData);
  }

  public getAll = (): Observable<Machine[]> => {
    this.initGymID();
    return this.http
      .get<Machine[]>(`${this.url}?gymId=${this.gymId}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        switchMap((machines) => {
          this.machineSubject.next(machines);
          return this.machineSubject.asObservable();
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  // TODO: make it observable:
  private initGymID = (): void => {
    this.gymId = this.authService.getGymId();
  };

  public update = (machine: Machine): Observable<Machine> => {
    return this.http
      .put<Machine>(`${AppConsts.BASE_URL}/api/machine`, machine, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((machine: Machine) => {
          AppUtil.updateInSubject(this.machineSubject, machine);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public delete = (serialNumber: string, gymId: number): Observable<any> => {
    return this.http
      .delete(
        `${AppConsts.BASE_URL}/api/machine?serialNumber=${serialNumber}&gymId=${gymId}`,
        {
          headers: CoreUtil.createAuthorizationHeader(),
        }
      )
      .pipe(
        tap(() => {
          this.removeFromSubject(this.machineSubject, serialNumber);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };
  //TODO: handle deleting item real time update
}

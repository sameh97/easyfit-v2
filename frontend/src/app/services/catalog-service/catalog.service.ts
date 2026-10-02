import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { CoreUtil } from 'src/app/common/core-util';
import { Catalog } from 'src/app/model/catalog';
import { AuthenticationService } from '../authentication.service';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly url = `${AppConsts.BASE_URL}/api/catalog-url`;
  gymId: number;
  private catalogSubject: BehaviorSubject<Catalog[]> = new BehaviorSubject<
    Catalog[]
  >(null);

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

  private initGymID = (): void => {
    this.gymId = this.authService.getGymId();
  };

  public create = (catalog: Catalog): Observable<Catalog> => {
    catalog.gymId = this.gymId;

    return this.http
      .post<Catalog>(this.url, catalog, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((catalog: Catalog) => {
          AppUtil.addToSubject(this.catalogSubject, catalog);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public getAllPhones = (): Observable<string[]> => {
    this.initGymID();
    return this.http
      .get<any[]>(
        `${AppConsts.BASE_URL}/api/members-phones?gymId=${this.gymId}`,
        {
          headers: CoreUtil.createAuthorizationHeader(),
        }
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public getAll = (): Observable<Catalog[]> => {
    this.initGymID();
    return this.http
      .get<Catalog[]>(
        `${AppConsts.BASE_URL}/api/catalog-urls?gymId=${this.gymId}`,
        {
          headers: CoreUtil.createAuthorizationHeader(),
        }
      )
      .pipe(
        switchMap((catalogs) => {
          this.catalogSubject.next(catalogs);
          return this.catalogSubject.asObservable();
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };
  
  // TODO: make message content class
  public send = (messageContent: any): Observable<any> => {
    return this.http
      .post(`${AppConsts.BASE_URL}/api/send-catalog-whatsapp`, messageContent, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(catchError(AppUtil.handleError));
  };

  public removeFromSubject(
    subjectData: BehaviorSubject<any[]>,
    uuid: any
  ): void {
    var currData: any[] = subjectData.value;
    if (!currData) {
      currData = [];
    }
    let indexToDelete = -1;
    for (let i = 0; i < currData.length; i++) {
      if (String(currData[i].uuid) === String(uuid)) {
        indexToDelete = i;
        break;
      }
    }
    if (indexToDelete >= 0) {
      currData.splice(indexToDelete, 1);
    }
    subjectData.next(currData);
  }

  public update = (catalog: Catalog): Observable<Catalog> => {
    return this.http
      .put<Catalog>(`${this.url}`, catalog, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((catalog: Catalog) => {
          this.updateInSubject(this.catalogSubject, catalog);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public delete = (uuid: string): Observable<any> => {
    return this.http
      .delete(`${this.url}?uuid=${uuid}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap(() => {
          this.removeFromSubject(this.catalogSubject, uuid);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  private updateInSubject(
    subjectData: BehaviorSubject<any[]>,
    toUpdate: any
  ): void {
    var currData: any[] = subjectData.value;
    if (!currData) {
      currData = [];
    }
    for (let i = 0; i < currData.length; i++) {
      if (String(currData[i].uuid) === String(toUpdate.uuid)) {
        currData[i] = toUpdate;
        subjectData.next(currData);
      }
    }
  }
}

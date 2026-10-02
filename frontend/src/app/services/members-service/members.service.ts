import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConsts } from '../../common/consts';
import { BehaviorSubject, Observable } from 'rxjs';
import { Member } from 'src/app/model/member';
import { AuthenticationService } from './../authentication.service';
import { CoreUtil } from 'src/app/common/core-util';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';

@Injectable({
  providedIn: 'root',
})
export class MembersService {
  private readonly url = `${AppConsts.BASE_URL}/api/members`;
  private readonly addUrl = `${AppConsts.BASE_URL}/api/add-member`;
  private readonly deleteUrl = `${AppConsts.BASE_URL}/api/member`;
  private readonly updateURL = `${AppConsts.BASE_URL}/api/update-member`;
  private membersSubject: BehaviorSubject<Member[]> = new BehaviorSubject<
    Member[]
  >(null);

  private gymId: number;

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

  // TODO: make it observable:
  private initGymID = (): void => {
    this.gymId = this.authService.getGymId();
  };

  public getMembersGraphData = (): Observable<number[]> => {
    return this.http.get<number[]>(
      `${AppConsts.BASE_URL}/api/members-count?gymId=${this.gymId}`,
      {
        headers: CoreUtil.createAuthorizationHeader(),
      }
    );
  };

  public create = (member: Member): Observable<any> => {
    this.initGymID();
    member.gymId = this.gymId;

    return this.http
      .post<Member>(`${this.addUrl}?gymId=${this.gymId}`, member, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((member: Member) => {
          AppUtil.addToSubject(this.membersSubject, member);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public getGendersCount = (): Observable<number[]> => {
    return this.http.get<number[]>(
      `${AppConsts.BASE_URL}/api/genders?gymId=${this.gymId}`,
      {
        headers: CoreUtil.createAuthorizationHeader(),
      }
    );
  };

  public getAll = (): Observable<Member[]> => {
    this.initGymID();
    return this.http
      .get<Member[]>(`${this.url}?gymId=${this.gymId}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        switchMap((members) => {
          this.membersSubject.next(members);
          return this.membersSubject.asObservable();
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public update = (member: Member): Observable<Member> => {
    return this.http
      .put<Member>(this.updateURL, member, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((member: Member) => {
          AppUtil.updateInSubject(this.membersSubject, member);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public delete = (id: number): Observable<any> => {
    return this.http
      .delete(`${this.deleteUrl}?id=${id}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap(() => {
          AppUtil.removeFromSubject(this.membersSubject, id);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };
}

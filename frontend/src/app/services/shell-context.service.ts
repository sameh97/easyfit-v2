import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { Member } from '../model/member';
import { User } from '../model/user';
import { AuthenticationService } from './authentication.service';
import { MembersService } from './members-service/members.service';

export interface ShellContext {
  gymName: string | null;
  memberCount: number | null;
}

const EMPTY_CONTEXT: ShellContext = { gymName: null, memberCount: null };

/** Data the shell shows on every page (gym card, Members badge). Loaded once per signed-in user. */
@Injectable({
  providedIn: 'root',
})
export class ShellContextService {
  readonly context$: Observable<ShellContext> = this.authService.currentUser$.pipe(
    switchMap((user: User | null) => (user ? this.loadFor() : of(EMPTY_CONTEXT))),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  constructor(private authService: AuthenticationService, private membersService: MembersService) {}

  private loadFor(): Observable<ShellContext> {
    return this.membersService.getAll().pipe(
      map((members: Member[] | null) => ({ gymName: null, memberCount: members ? members.length : null })),
      startWith(EMPTY_CONTEXT),
      catchError(() => of(EMPTY_CONTEXT))
    );
  }
}

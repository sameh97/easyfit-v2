import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ShellStateService } from 'src/app/services/shell-state.service';

/**
 * 404 (redesign.md §5.12) for any unknown URL. Signed in: inside the shell, with a way back
 * (the dashboard, or Gyms for the admin) and the ⌘K search; signed out: a plain page to sign in.
 */
@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {
  /** The path that wasn't found, shown left to right. */
  readonly path: string;
  readonly signedIn: boolean;
  readonly homePath: string;

  constructor(router: Router, auth: AuthenticationService, public shell: ShellStateService) {
    this.path = router.url.split('?')[0];
    this.signedIn = auth.isAuthenticated();
    this.homePath = this.signedIn && auth.isAdmin() ? '/admin' : '/home';
  }
}

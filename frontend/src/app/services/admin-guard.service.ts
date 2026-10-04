import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthenticationService } from './authentication.service';

/** Admin pages (/admin, /users) are for the admin role only; a gym user is sent to the dashboard. */
@Injectable({
  providedIn: 'root',
})
export class AdminGuardService implements CanActivate {
  constructor(private auth: AuthenticationService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (!this.auth.isAuthenticated()) {
      return this.router.parseUrl('/login');
    }
    return this.auth.isAdmin() ? true : this.router.parseUrl('/home');
  }
}

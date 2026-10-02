import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { NotificationsDropdownComponent } from '../../notifications/notifications-dropdown.component';
import { AppUtil } from 'src/app/common/app-util';
import { User } from 'src/app/model/user';

@Component({
  selector: 'app-admin-nav',
  templateUrl: './admin-nav.component.html',
  styleUrls: ['./admin-nav.component.css'],
})
export class AdminNavComponent implements OnDestroy, OnInit {
  private subscriptions: Subscription[] = [];
  currentUser: User = null;

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthenticationService
  ) {}
  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User) => {
      this.currentUser = user;
    });
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

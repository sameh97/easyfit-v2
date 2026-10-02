import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { AppUtil } from 'src/app/common/app-util';
import { NotificationsDropdownComponent } from '../notifications/notifications-dropdown.component';
import { AppNotificationMessage } from 'src/app/model/app-notification-message';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { SocketTopics } from 'src/app/shared/util/socket-util';
import { UserNotificationsService } from 'src/app/services/user-notifications.service';
import { User } from 'src/app/model/user';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent implements OnInit, OnDestroy {
  notifications: AppNotificationMessage[] = [];
  notificationNumber: number = 0;
  private subscriptions: Subscription[] = [];
  currentUser: User = null;
  sidebarOpen: boolean = false;
  userMenuOpen: boolean = false;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/home', icon: 'dashboard' },
    { label: 'Members', path: '/members', icon: 'groups' },
    { label: 'Trainers', path: '/trainers', icon: 'sports' },
    { label: 'Group trainings', path: '/group-trainings', icon: 'event' },
    { label: 'Machines', path: '/machines', icon: 'fitness_center' },
    { label: 'Scheduler', path: '/scheduler', icon: 'build' },
    { label: 'Products', path: '/products', icon: 'shopping_bag' },
    { label: 'Catalogs', path: '/catalog', icon: 'menu_book' },
  ];

  constructor(
    private authService: AuthenticationService,
    private navigationService: NavigationHelperService,
    private webSocketService: WebSocketService,
    private userNotificationsService: UserNotificationsService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.currentUser$.subscribe((user: User) => {
        this.currentUser = user;
      })
    );

    this.subscriptions.push(
      this.userNotificationsService.getAll().subscribe(
        (notifications) => {
          this.notificationNumber =
            this.getNotSeenNotificationsCount(notifications);
          // TODO: make a function that retreves only the count of the notifications
        },
        (error: Error) => {
          AppUtil.showError(error);
        }
      )
    );

    this.subscriptions.push(
      this.webSocketService
        .onMessage(SocketTopics.TOPIC_GROUPED_NOTIFICATION)
        .subscribe((notificationFromServer: AppNotificationMessage) => {
          let sum = 0;
          for (let notification of notificationFromServer.content) {
            sum += notification.notificationsCount;
          }
          this.notificationNumber = sum;
        })
    );
  }

  private getNotSeenNotificationsCount = (
    notifications: AppNotificationMessage[]
  ): number => {
    let count = 0;
    for (let i = 0; i < notifications.length; i++) {
      if (!notifications[i].seen) {
        count++;
      }
    }
    return count;
  };

  get userInitials(): string {
    if (!this.currentUser) {
      return '';
    }
    const first: string = this.currentUser.firstName?.charAt(0) ?? '';
    const last: string = this.currentUser.lastName?.charAt(0) ?? '';
    return `${first}${last}`;
  }

  logout() {
    const message: string = `Are you sure you want to log out?`;
    this.navigationService
      .openYesNoDialogNoCallback(message, 500)
      .subscribe((res) => {
        if (res) {
          this.authService.logout();
        }
      });
  }

  public openNotificationsDialog() {
    this.subscriptions.push(
      this.navigationService
        .openDialog(NotificationsDropdownComponent)
        .subscribe()
    );
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

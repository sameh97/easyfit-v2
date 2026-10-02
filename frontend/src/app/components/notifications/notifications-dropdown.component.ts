import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { AppNotificationMessage } from 'src/app/model/app-notification-message';
import { UserNotificationsService } from 'src/app/services/user-notifications.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { SocketTopics } from 'src/app/shared/util/socket-util';

@Component({
  selector: 'app-notifications-dropdown',
  templateUrl: './notifications-dropdown.component.html',
  styleUrls: ['./notifications-dropdown.component.css'],
})
export class NotificationsDropdownComponent implements OnInit, OnDestroy {
  showNotification: boolean;

  notificationsGroped: any[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private userNotificationsService: UserNotificationsService,
    private webSocketService: WebSocketService,
    private router: Router,
    public dialogRef: MatDialogRef<NotificationsDropdownComponent>
  ) {}

  openNotification(state: boolean) {
    this.showNotification = state;
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.userNotificationsService
        .getAllGrouped()
        .subscribe((notifications) => {
          this.notificationsGroped = notifications;
        })
    );

    this.subscriptions.push(
      this.webSocketService
        .onMessage(SocketTopics.TOPIC_GROUPED_NOTIFICATION)
        .subscribe((notification: AppNotificationMessage) => {
          for (let notificationElement of notification.content) {
            let index = this.notificationsGroped.findIndex(
              (item) => item.machineId === notificationElement.machineId
            );
            if (index !== -1) {
              this.notificationsGroped[index].notificationsCount =
                notificationElement.notificationsCount;
            } else {
              this.notificationsGroped.push(notificationElement);
            }
            this.notificationsGroped = [...this.notificationsGroped];
          }
        })
    );
  }

  isNotificationsEmpty() {
    if (!this.notificationsGroped) {
      return true;
    }
    return this.notificationsGroped.length === 0;
  }

  public viewNotification = (notification?: any) => {
    this.dialogRef.close();
    this.router.navigate(['machines']);
  };

  public getJob = (jobID: number): string => {
    return AppUtil.getJob(jobID);
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

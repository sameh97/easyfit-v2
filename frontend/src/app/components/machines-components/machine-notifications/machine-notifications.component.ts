import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { AppNotificationMessage } from 'src/app/model/app-notification-message';
import { Machine } from 'src/app/model/machine';
import { MachinesService } from 'src/app/services/machines-service/machines.service';
import { UserNotificationsService } from 'src/app/services/user-notifications.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { SocketTopics } from 'src/app/shared/util/socket-util';

@Component({
  selector: 'app-machine-notifications',
  templateUrl: './machine-notifications.component.html',
  styleUrls: ['./machine-notifications.component.css'],
})
export class MachineNotificationsComponent implements OnInit, OnDestroy {
  notifications: AppNotificationMessage[];
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public machine: Machine,
    private userNotificationsService: UserNotificationsService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.userNotificationsService
        .getByMachineSerialNumber(this.machine.serialNumber)
        .subscribe((notifications) => {
          this.notifications = notifications;
        })
    );

    this.subscriptions.push(
      this.webSocketService
        .onMessage(SocketTopics.TOPIC_CLEAN_MACHINE)
        .subscribe((job: AppNotificationMessage) => {
          if (job.content.machineSerialNumber === this.machine.serialNumber) {
            this.notifications.unshift(job);
            this.notifications = [...this.notifications];
          }
        })
    );

    this.subscriptions.push(
      this.webSocketService
        .onMessage(SocketTopics.TOPIC_MACHINE_SERVICE)
        .subscribe((job: AppNotificationMessage) => {
          if (job.content.machineSerialNumber === this.machine.serialNumber) {
            this.notifications.unshift(job);
            this.notifications = [...this.notifications];
          }
        })
    );
  }

  public deleteByMachineSerialNumber(machineSerialNumber: string): void {
    this.subscriptions.push(
      this.userNotificationsService
        .deleteByTargetObjectId(machineSerialNumber)
        .subscribe(
          () => {
            this.notifications = [...this.notifications];
          },
          (error: Error) => {
            AppUtil.showWarningMessage(error.message);
          }
        )
    );
  }

  isNotificationsEmpty() {
    if (!this.notifications) {
      return true;
    }
    return this.notifications.length === 0;
  }

  public onDone = (notification: AppNotificationMessage) => {
    notification.seen = true;

    this.subscriptions.push(
      this.userNotificationsService.update(notification).subscribe(
        (notification) => {
          let index = this.notifications.findIndex(
            (element) => element.id === notification.id
          );

          this.notifications.splice(index, 1);

          this.notifications = [...this.notifications];
        },
        (err) => {
          AppUtil.showErrorMessage(err);
          //TODO: show more appropriate message
        }
      )
    );
  };

  public getJob = (jobID: number): string => {
    return AppUtil.getJob(jobID);
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

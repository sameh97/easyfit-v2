import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { AppNotificationMessage } from 'src/app/model/app-notification-message';
import { Machine } from 'src/app/model/machine';
import { MachinesService } from 'src/app/services/machines-service/machines.service';
import { UserNotificationsService } from 'src/app/services/user-notifications.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { SocketTopics } from 'src/app/shared/util/socket-util';
import { CreateMachineComponent } from '../create-machine/create-machine.component';
import { EditMachineComponent } from '../edit-machine/edit-machine.component';
import { MachineNotificationsComponent } from '../machine-notifications/machine-notifications.component';

@Component({
  selector: 'app-machines',
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.css'],
})
export class MachinesComponent implements OnInit {
  // scheduledJob: MachineScheduledJob;
  notifications: AppNotificationMessage[];
  machines: Machine[];
  filteredItems: Machine[];
  searchValue: string;
  private subscriptions: Subscription[] = [];

  constructor(
    private webSocketService: WebSocketService,
    private navigationService: NavigationHelperService,
    private machinesService: MachinesService,
    private userNotificationsService: UserNotificationsService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.userNotificationsService
        .getAll()
        .subscribe((notifications: AppNotificationMessage[]) => {
          this.notifications = notifications;
        })
    );

    // this.subscriptions.push(
    //   this.machinesService
    //     .addedMachineObs()
    //     .subscribe((notification: Machine) => {
    //       this.machines.push(notification);
    //       this.assignCopy();
    //     })
    // );

    this.subscriptions.push(
      this.webSocketService
        .onMessage(SocketTopics.TOPIC_CLEAN_MACHINE)
        .subscribe((job: AppNotificationMessage) => {
          console.log(`Got the message from server: ${JSON.stringify(job)}`);
          this.notifications.push(job);
          // this.scheduledJob = job.content as MachineScheduledJob;
        })
    );

    this.subscriptions.push(
      this.webSocketService
        .onMessage(SocketTopics.TOPIC_MACHINE_SERVICE)
        .subscribe((job: AppNotificationMessage) => {
          console.log(`Got the message from server: ${JSON.stringify(job)}`);
          this.notifications.push(job);
         
        })
    );

    this.subscriptions.push(
      this.machinesService.getAll().subscribe((machines) => {
        this.machines = machines;
        this.assignCopy();
      })
    );
  }

  public openViewMachineNotificationsDialog(machine: Machine) {
    this.subscriptions.push(
      this.navigationService
        .openDialog(MachineNotificationsComponent, '900px', machine, true)
        .subscribe()
    );
  }

  public openCreateMachineDialog() {
    this.subscriptions.push(
      this.navigationService
        .openDialog(CreateMachineComponent, null, null, true)
        .subscribe()
    );
  }

  public openUpdateMachineDialog(machine: Machine) {
    this.subscriptions.push(
      this.navigationService
        .openDialog(EditMachineComponent, null, machine, true)
        .subscribe()
    );
  }

  public delete = (machine: Machine) => {
    const message = `Are you sure you want to delete the machine with the serial number:
    ${machine.serialNumber}?`;

    this.navigationService
      .openYesNoDialogNoCallback(message, 500)
      .subscribe((res) => {
        if (res) {
          this.machinesService
            .delete(machine.serialNumber, machine.gymId)
            .subscribe(
              (res) => {
                console.log(res);
              },
              (err) => {
                AppUtil.showError(err);
              }
            );
        }
      });
  };

  assignCopy() {
    this.filteredItems = Object.assign([], this.machines);
  }

  filterItem(value) {
    if (!value) {
      this.assignCopy();
    } // when nothing has typed
    this.filteredItems = Object.assign([], this.machines).filter(
      (item) =>
        item.serialNumber.toLowerCase().indexOf(value.toLowerCase()) > -1
    );
  }

  isMachinesEmpty(): boolean {
    if (!this.filteredItems) {
      return true;
    }
    return this.filteredItems.length === 0;
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

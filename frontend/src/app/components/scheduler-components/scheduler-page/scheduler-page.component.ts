import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { Machine } from 'src/app/model/machine';
import { ScheduledJob } from 'src/app/model/scheduled-job';
import { MachinesService } from 'src/app/services/machines-service/machines.service';
import { SchedulerService } from 'src/app/services/scheduler-service/scheduler.service';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { AddScheduledJobPageComponent } from '../add-scheduled-job-page/add-scheduled-job-page.component';
import { MachineDetailsComponent } from '../machine-details/machine-details.component';
import { UpdateScheduledJobComponent } from '../update-scheduled-job/update-scheduled-job.component';

@Component({
  selector: 'app-scheduler-page',
  templateUrl: './scheduler-page.component.html',
  styleUrls: ['./scheduler-page.component.css'],
})
export class SchedulerPageComponent implements OnInit, OnDestroy {
  scheduledJobs: ScheduledJob[];
  private subscriptions: Subscription[] = [];

  constructor(
    private schedulerService: SchedulerService,
    private machineService: MachinesService,
    private navigationService: NavigationHelperService
  ) {}

  ngOnInit(): void {
    this.getAll();
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }

  private getAll = (): void => {
    this.subscriptions.push(
      this.schedulerService.getAll().subscribe((scheduledJobs) => {
        this.scheduledJobs = scheduledJobs;
        this.scheduledJobs = [...this.scheduledJobs];
       
      })
    );
  };

  public getJob = (jobID: number): string => {
    return AppUtil.getJob(jobID);
  };

  public getJobStatus = (isActive: boolean): string => {
    if (isActive) {
      return 'Scheduled';
    } else {
      return 'Not Scheduled';
    }
  };

  public getMachineBySerialNumber = (
    machineSerialNumber: number
  ): Observable<Machine> => {
    // let machineToRetreve: Machine;

    // this.machineService.getById(machineID).subscribe((machine) => {
    //   machineToRetreve = machine;
    // });

    return this.machineService.getBySerialNumber(machineSerialNumber);
  };

  public async openMachineDetailsDialog(machineId: number) {
    const machine$: Observable<Machine> =
      this.machineService.getBySerialNumber(machineId);

    this.subscriptions.push(
      machine$
        .pipe(
          switchMap((machine) => {
            return this.navigationService.openDialog(
              MachineDetailsComponent,
              null,
              machine,
              null
            );
          })
        )
        .subscribe()
    );
  }

  public delete = (scheduledJob: ScheduledJob) => {
    const message = `Are you sure you want to delete the Scheduled job for the machine with serial number:
    ${scheduledJob.machineSerialNumber}?`;

    this.navigationService
      .openYesNoDialogNoCallback(message, 500)
      .subscribe((res) => {
        if (res) {
          this.schedulerService.delete(scheduledJob.id).subscribe(
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

  public openUpdateScheduledJobDialog(scheduledJob: ScheduledJob) {
    this.subscriptions.push(
      this.navigationService
        .openDialog(UpdateScheduledJobComponent, null, scheduledJob, true)
        .subscribe()
    );
  }

  public openCreateScheduledJobDialog() {
    this.subscriptions.push(
      this.navigationService
        .openDialog(AddScheduledJobPageComponent, null, null, true)
        .subscribe()
    );
  }

  isSceduledJobsEmpty(): boolean {
    if (!this.scheduledJobs) {
      return true;
    }
    return this.scheduledJobs.length === 0;
  }
}

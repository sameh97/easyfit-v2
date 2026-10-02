import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { Machine } from 'src/app/model/machine';
import { ScheduledJob } from 'src/app/model/scheduled-job';
import { MachinesService } from 'src/app/services/machines-service/machines.service';
import { SchedulerService } from 'src/app/services/scheduler-service/scheduler.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';

@Component({
  selector: 'app-update-scheduled-job',
  templateUrl: './update-scheduled-job.component.html',
  styleUrls: ['./update-scheduled-job.component.css'],
})
export class UpdateScheduledJobComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  updateJobForm: FormGroup;
  private subscriptions: Subscription[] = [];
  machines: Machine[] = [];

  dropdownList = [];
  selectedItems = [];
  dropdownSettings: IDropdownSettings = {};

  constructor(
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) private scheduledJob: ScheduledJob,
    private schedulerService: SchedulerService,
    private machinesService: MachinesService,
    private navigationHelperService: NavigationHelperService,
    public dialogRef: MatDialogRef<UpdateScheduledJobComponent>
  ) {
    super();
  }

  ngOnInit(): void {
    this.dropdownSettings = {
      singleSelection: true,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true,
    };
    this.subscriptions.push(
      this.machinesService.getAll().subscribe((machines) => {
        this.machines = machines;

        for (let machine of this.machines) {
          const item: any = {
            item_id: machine.serialNumber,
            item_text: machine.name,
          };
          this.dropdownList.push(item);
        }

        for (let machine of this.machines) {
          const item: any = {
            item_id: machine.serialNumber,
            item_text: machine.name,
          };
          if (this.scheduledJob.machineSerialNumber === machine.serialNumber) {
            this.selectedItems.push(item);
          }
        }

        this.dropdownList = [...this.dropdownList];
        this.buildForm();
      })
    );
  }

  private buildForm = (): void => {
    this.updateJobForm = this.formBuilder.group({
      
      id: [this.scheduledJob.id, [Validators.required]],
      jobID: [this.scheduledJob.jobID, [Validators.required]],
      machineSerialNumber: ['', [Validators.required]],
      startTime: [this.scheduledJob.startTime, [Validators.required]],
      endTime: [
        this.scheduledJob.endTime,
        [Validators.required, this.validateEndDate],
      ],
      daysFrequency: [
        this.scheduledJob.daysFrequency,
        [Validators.required, this.validateFrequency],
      ],
      gymId: [this.scheduledJob.gymId, [Validators.required]],
    });
  };

  public validateFrequency = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }

    const input = Number(inputControl.value);

    if (input < 1) {
      return { frequencyLowerThanOneDay: true };
    }

    const start = new Date(this.scheduledJob.startTime);

    const end = new Date(this.scheduledJob.endTime);

    if (AppUtil.daysBetween(start, end) < input) {
      return { overFrequency: true };
    }

    return null;
  };

  public validateEndDate = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }
    let dateNow: Date = new Date();

    let dateFromForm = new Date(inputControl.value);

    if (dateFromForm.getTime() <= dateNow.getTime()) {
      return { endDateNotValid: true };
    }

    const startScheduleDate = new Date(this.scheduledJob.startTime);

    if (dateFromForm.getTime() < startScheduleDate.getTime()) {
      return { endDateBeforeStartDate: true };
    }

    return null;
  };

  onItemSelect(item: any) {
    for (let machine of this.machines) {
      if (item.item_id === machine.serialNumber) {
        this.scheduledJob.machineSerialNumber = machine.serialNumber;
      }
    }
  }

  onItemDeSelect(item: any) {
    this.scheduledJob.machineSerialNumber = ``;
  }

  public update = (scheduledJob: ScheduledJob): Promise<void> => {
    if (!AppUtil.hasValue(scheduledJob)) {
      AppUtil.showWarningMessage(
        `cannot update scheduled Job because there is a missing fields`
      );
      return;
    }

    scheduledJob.isActive = true; // TODO: remove is active form scheduledJob db table

    const jobToUpdate: ScheduledJob = {
      id: scheduledJob.id,
      startTime: scheduledJob.startTime,
      endTime: scheduledJob.endTime,
      isActive: scheduledJob.isActive,
      daysFrequency: scheduledJob.daysFrequency,
      jobID: Number(scheduledJob.jobID),
      machineSerialNumber: this.selectedItems[0].item_id,
      gymId: scheduledJob.gymId,
    } as ScheduledJob;

    this.subscriptions.push(
      this.schedulerService.update(jobToUpdate).subscribe(
        () => {
          this.dialogRef.close();
          this.navigationHelperService.openSnackBar(
            'start',
            'bottom',
            `Schedule was updated successfully`
          );
        },
        (error: Error) => {
          AppUtil.showError(error);
        }
      )
    );
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

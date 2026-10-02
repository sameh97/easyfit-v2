import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AppUtil } from 'src/app/common/app-util';
import { ScheduledJob } from 'src/app/model/scheduled-job';
import { SchedulerService } from 'src/app/services/scheduler-service/scheduler.service';
import { Subscription } from 'rxjs';
import { MachinesService } from './../../../services/machines-service/machines.service';
import { Machine } from 'src/app/model/machine';
import { filter, switchMap } from 'rxjs/operators';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { MatDialogRef } from '@angular/material/dialog';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
@Component({
  selector: 'app-add-scheduled-job-page',
  templateUrl: './add-scheduled-job-page.component.html',
  styleUrls: ['./add-scheduled-job-page.component.css'],
})
export class AddScheduledJobPageComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  addScheduledJobForm: FormGroup;
  scheduledJob: ScheduledJob;
  machines: Machine[] = [];
  private subscriptions: Subscription[] = [];

  dropdownList = [];
  selectedItems = [];
  dropdownSettings: IDropdownSettings = {};

  constructor(
    private formBuilder: FormBuilder,
    private schedulerService: SchedulerService,
    private machinesService: MachinesService,
    public dialogRef: MatDialogRef<AddScheduledJobPageComponent>,
    private navigationHelperService: NavigationHelperService
  ) {
    super();
  }

  ngOnInit(): void {
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

        this.dropdownList = [...this.dropdownList];
      })
    );

    this.scheduledJob = new ScheduledJob();
    this.addScheduledJobForm = this.formBuilder.group({
      

      jobID: ['', [Validators.required]],
      machineSerialNumber: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required, this.validateEndDate]],
      daysFrequency: ['', [Validators.required, this.validateFrequency]],
    });
    this.dropdownSettings = {
      singleSelection: true,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true,
    };
  }

  // dateFilter = (date: Date) => {
  //   const day = date.getDay();
  //   var dt = new Date('2021-09-14 00:00:00.00000');

  //   return date.getTime() !== dt.getTime();
  //   // return day !== 2 && day !== 6;
  // };

  onItemSelect(item: any) {
    for (let machine of this.machines) {
      if (item.item_id === machine.serialNumber) {
        this.scheduledJob.machineSerialNumber = machine.serialNumber;
      }
    }
  }

  onItemDeSelect(item: any) {
    this.scheduledJob.machineSerialNumber = null;
  }

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

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }

  public create = (): Promise<void> => {
    if (!AppUtil.hasValue(this.scheduledJob)) {
      AppUtil.showWarningMessage(
        `cannot create scheduled Job because there is a missing fields`
      );
      return;
    }

    this.scheduledJob.isActive = true; // TODO: remove is active form scheduledJob db table

    this.scheduledJob.jobID = Number(this.scheduledJob.jobID);

    this.subscriptions.push(
      this.schedulerService.create(this.scheduledJob).subscribe(
        () => {
          this.dialogRef.close();
          this.navigationHelperService.openSnackBar(
            'start',
            'bottom',
            `Schedule was added successfully`
          );
        },
        (err: Error) => {
          AppUtil.showError(err);
        }
      )
    );
  };
}

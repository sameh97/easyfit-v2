import { Component, ElementRef, Inject, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { merge, Observable, Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { Machine } from 'src/app/model/machine';
import { ScheduledJob } from 'src/app/model/scheduled-job';
import { LanguageService } from 'src/app/services/language.service';
import { jobTypeOf } from 'src/app/services/maintenance-alerts.service';
import { MaintenanceStatusService } from 'src/app/services/maintenance-status.service';
import { MachinesService } from 'src/app/services/machines-service/machines.service';
import { SchedulerService } from 'src/app/services/scheduler-service/scheduler.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { validateAndFocus } from 'src/app/shared/ui/form/field';
import { SegmentedFieldOption } from 'src/app/shared/ui/form/segmented-field.component';
import { SelectOption } from 'src/app/shared/ui/form/select.component';
import { combineDateAndTime, timeOf, timeValidator } from 'src/app/shared/ui/form/time-field.component';
import { CloseGuard, SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';

export interface JobFormData {
  /** null = a new job. */
  job: ScheduledJob | null;
  /** New job: the machine to preselect (from the machine panel's "Schedule job"). */
  machineSerialNumber?: string | null;
}

/**
 * Schedule / edit maintenance side panel (§5.6): machine (name and serial number), Clean /
 * Service, start and end date and time, every N days, Active. Rules as in the legacy dialogs:
 * all required; the end must be after now and not before the start; every N days is at least
 * 1 and not longer than the time from start to end.
 */
@Component({
  selector: 'app-job-form',
  templateUrl: './job-form.component.html',
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class JobFormComponent extends FormInputComponent implements CloseGuard, OnDestroy {
  readonly original: ScheduledJob | null;
  readonly isEdit: boolean;

  readonly machine: FormControl;
  readonly jobID: FormControl;
  readonly startDate: FormControl;
  readonly startTime: FormControl;
  readonly endDate: FormControl;
  readonly endTime: FormControl;
  readonly daysFrequency: FormControl;
  readonly isActive: FormControl;
  readonly form: FormGroup;

  machineOptions: SelectOption<string>[] = [];
  typeOptions: SegmentedFieldOption<number>[] = [];
  saving: boolean = false;
  private machineNames = new Map<string, string>();
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: JobFormData,
    public ref: SidePanelRef<ScheduledJob>,
    private host: ElementRef<HTMLElement>,
    private scheduler: SchedulerService,
    private machines: MachinesService,
    private status: MaintenanceStatusService,
    private toast: ToastService,
    private language: LanguageService
  ) {
    super();
    this.original = data?.job ?? null;
    this.isEdit = !!this.original;
    const j: ScheduledJob | null = this.original;
    const start: Date | null = j ? new Date(j.startTime) : null;
    const end: Date | null = j ? new Date(j.endTime) : null;
    const today: Date = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    this.machine = new FormControl(j?.machineSerialNumber ?? data?.machineSerialNumber ?? null, [Validators.required]);
    this.jobID = new FormControl(j ? Number(j.jobID) : 1, [Validators.required]);
    this.startDate = new FormControl(start ? midnight(start) : today, [Validators.required]);
    this.startTime = new FormControl(start ? timeOf(start) : '', [Validators.required, timeValidator]);
    this.endDate = new FormControl(end ? midnight(end) : null, [Validators.required]);
    this.endTime = new FormControl(end ? timeOf(end) : '', [Validators.required, timeValidator, this.validEnd]);
    this.daysFrequency = new FormControl(j ? String(j.daysFrequency) : '', [Validators.required, this.validFrequency]);
    this.isActive = new FormControl(j ? j.isActive === true : true);
    this.form = new FormGroup({
      machine: this.machine,
      jobID: this.jobID,
      startDate: this.startDate,
      startTime: this.startTime,
      endDate: this.endDate,
      endTime: this.endTime,
      daysFrequency: this.daysFrequency,
      isActive: this.isActive,
    });

    // The end and frequency checks depend on the other dates.
    this.subscriptions.push(
      merge(this.startDate.valueChanges, this.startTime.valueChanges, this.endDate.valueChanges).subscribe(() => {
        this.endTime.updateValueAndValidity({ emitEvent: false });
        this.daysFrequency.updateValueAndValidity({ emitEvent: false });
      }),
      this.endTime.valueChanges.subscribe(() => this.daysFrequency.updateValueAndValidity({ emitEvent: false }))
    );
    this.subscriptions.push(
      this.machines.getAll().subscribe((machines: Machine[] | null) => {
        if (!machines) {
          return;
        }
        this.machineNames = new Map<string, string>(machines.map((m: Machine) => [String(m.serialNumber), m.name]));
        this.machineOptions = machines
          .map((m: Machine) => ({ value: String(m.serialNumber), label: `${m.name} · ${m.serialNumber}` }))
          .sort((a: SelectOption<string>, b: SelectOption<string>) => a.label.localeCompare(b.label));
      })
    );
    this.subscriptions.push(
      this.language.lang$.subscribe(() => {
        this.typeOptions = [
          { value: 1, label: this.language.t('maintenance.types.clean') },
          { value: 2, label: this.language.t('maintenance.types.service') },
        ];
      })
    );
  }

  get title(): string {
    return this.language.t(this.isEdit ? 'maintenance.form.editTitle' : 'maintenance.form.addTitle');
  }

  isDirty(): boolean {
    return this.form.dirty;
  }

  private get start(): Date | null {
    return combineDateAndTime(this.startDate?.value ?? null, this.startTime?.value ?? null);
  }

  private get end(): Date | null {
    return combineDateAndTime(this.endDate?.value ?? null, this.endTime?.value ?? null);
  }

  /** As the legacy validateEndDate: after now (`endDateNotValid`), not before the start (`endDateBeforeStartDate`). */
  private validEnd = (control: AbstractControl): ValidationErrors | null => {
    const end: Date | null = combineDateAndTime(this.endDate?.value ?? null, control.value);
    if (!end) {
      return null;
    }
    if (end.getTime() <= Date.now()) {
      return { endDateNotValid: true };
    }
    const start: Date | null = this.start;
    return start && end.getTime() < start.getTime() ? { endDateBeforeStartDate: true } : null;
  };

  /** As the legacy validateFrequency: at least 1 day, and no longer than the start-to-end span. */
  private validFrequency = (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === '') {
      return null;
    }
    const days: number = Number(control.value);
    if (!(days >= 1)) {
      return { frequencyLowerThanOneDay: true };
    }
    const start: Date | null = this.start;
    const end: Date | null = this.end;
    return start && end && AppUtil.daysBetween(start, end) < days ? { overFrequency: true } : null;
  };

  save(): void {
    if (this.saving || !validateAndFocus(this.form, this.host.nativeElement)) {
      return;
    }
    this.saving = true;
    const job: ScheduledJob = Object.assign(new ScheduledJob(), this.original ?? {}, {
      machineSerialNumber: String(this.machine.value),
      jobID: Number(this.jobID.value),
      startTime: this.start as Date,
      endTime: this.end as Date,
      daysFrequency: Number(this.daysFrequency.value),
      isActive: this.isActive.value === true,
    });
    const name: string = `${this.language.t(`maintenance.types.${jobTypeOf(job.jobID)}`)} · ${this.machineNames.get(job.machineSerialNumber) ?? job.machineSerialNumber}`;
    const save$: Observable<ScheduledJob> = this.isEdit ? this.scheduler.update(job) : this.scheduler.create(job);
    this.subscriptions.push(
      save$.subscribe(
        (saved: ScheduledJob) => {
          this.toast.success(this.language.t(this.isEdit ? 'maintenance.toast.updated' : 'maintenance.toast.added', { name }));
          this.status.reload();
          this.ref.close(saved);
        },
        () => {
          this.saving = false;
          this.toast.error(this.language.t('maintenance.toast.saveError', { name }));
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

function midnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

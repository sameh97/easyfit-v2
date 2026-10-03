import { Component, ElementRef, Inject, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GroupTraining } from 'src/app/model/group-training';
import { Member } from 'src/app/model/member';
import { Trainer } from 'src/app/model/trainer';
import { GroupTrainingService } from 'src/app/services/group-training-service/group-training.service';
import { LanguageService } from 'src/app/services/language.service';
import { MembersService } from 'src/app/services/members-service/members.service';
import { TrainersService } from 'src/app/services/trainers-service/trainers.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { validateAndFocus } from 'src/app/shared/ui/form/field';
import { MultiSelectOption } from 'src/app/shared/ui/form/multi-select.component';
import { SelectOption } from 'src/app/shared/ui/form/select.component';
import { combineDateAndTime, timeOf, timeValidator } from 'src/app/shared/ui/form/time-field.component';
import { CloseGuard, SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { fullName } from '../../members-components/member-status';
import { classTitle, trainerClash } from '../class-schedule';

export interface ClassFormData {
  /** null = a new class. */
  training: GroupTraining | null;
  /** New class: the day to prefill (e.g. the day selected in the week strip). */
  day?: Date | null;
}

/**
 * New / edit class side panel (§5.4): date, 24-hour time, description, trainer (active trainers)
 * and members as chips. Rules as in the legacy dialogs: everything required, at least one
 * member, the start must be in the future, and a trainer can't start a class less than an hour
 * after another of theirs (the backend's check, shown on the time field before saving).
 */
@Component({
  selector: 'app-class-form',
  templateUrl: './class-form.component.html',
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class ClassFormComponent extends FormInputComponent implements CloseGuard, OnDestroy {
  readonly original: GroupTraining | null;
  readonly isEdit: boolean;

  readonly date: FormControl;
  readonly time: FormControl;
  readonly description: FormControl;
  readonly trainerId: FormControl;
  readonly members: FormControl;
  readonly form: FormGroup;

  trainerOptions: SelectOption<number>[] = [];
  memberOptions: MultiSelectOption[] = [];
  saving: boolean = false;
  readonly today: Date = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  private allMembers: Member[] = [];
  private trainings: GroupTraining[] = [];
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: ClassFormData,
    public ref: SidePanelRef<GroupTraining>,
    private host: ElementRef<HTMLElement>,
    private groupTrainings: GroupTrainingService,
    private membersService: MembersService,
    private trainersService: TrainersService,
    private toast: ToastService,
    private language: LanguageService
  ) {
    super();
    this.original = data?.training ?? null;
    this.isEdit = !!this.original;
    const t: GroupTraining | null = this.original;
    const start: Date | null = t ? new Date(t.startTime) : null;
    // Edit: the class's day. New: the day picked in the week strip, unless it is already past.
    const requested: Date | null = data?.day ?? null;
    const day: Date = start
      ? new Date(start.getFullYear(), start.getMonth(), start.getDate())
      : requested && requested.getTime() >= this.today.getTime()
      ? requested
      : this.today;

    this.date = new FormControl(day, [Validators.required]);
    this.time = new FormControl(start ? timeOf(start) : '', [Validators.required, timeValidator, this.futureStart, this.trainerFree]);
    this.description = new FormControl(t?.description ?? '', [Validators.required]);
    this.trainerId = new FormControl(t?.trainerId ?? null, [Validators.required]);
    this.members = new FormControl((t?.members ?? []).map((member: Member) => member.id), [Validators.required]);
    this.form = new FormGroup({
      date: this.date,
      time: this.time,
      description: this.description,
      trainerId: this.trainerId,
      members: this.members,
    });

    // The start and clash checks live on the time field but also depend on the date and trainer.
    this.subscriptions.push(
      this.date.valueChanges.subscribe(() => this.time.updateValueAndValidity()),
      this.trainerId.valueChanges.subscribe(() => this.time.updateValueAndValidity())
    );
    this.subscriptions.push(
      this.trainersService.getAll().subscribe((trainers: Trainer[] | null) => trainers && this.setTrainers(trainers))
    );
    this.subscriptions.push(
      this.membersService.getAll().subscribe((members: Member[] | null) => members && this.setMembers(members))
    );
    this.subscriptions.push(
      this.groupTrainings.getAll().subscribe((trainings: GroupTraining[] | null) => {
        this.trainings = trainings ?? [];
        this.time.updateValueAndValidity();
      })
    );
  }

  get title(): string {
    return this.language.t(this.isEdit ? 'classes.form.editTitle' : 'classes.form.addTitle');
  }

  get memberCount(): number {
    return Array.isArray(this.members.value) ? (this.members.value as number[]).length : 0;
  }

  isDirty(): boolean {
    return this.form.dirty;
  }

  /** `dateNotValid` (as FormInputComponent.checkDate) when the date and time are not after now. */
  private futureStart = (control: AbstractControl): ValidationErrors | null => {
    const start: Date | null = combineDateAndTime(this.date?.value ?? null, control.value);
    return start ? this.checkDate(new FormControl(start)) : null;
  };

  /** `trainerBusy` when the trainer's other class started in the hour up to this start. */
  private trainerFree = (control: AbstractControl): ValidationErrors | null => {
    const start: Date | null = combineDateAndTime(this.date?.value ?? null, control.value);
    const trainerId: number | null = this.trainerId?.value ?? null;
    if (!start || trainerId === null) {
      return null;
    }
    const clash: GroupTraining | null = trainerClash(this.trainings, Number(trainerId), start, this.original?.id ?? null);
    return clash ? { trainerBusy: { time: this.language.date(clash.startTime, 'time') } } : null;
  };

  private setTrainers(trainers: Trainer[]): void {
    const current: number | null = this.original?.trainerId ?? null;
    this.trainerOptions = trainers
      .filter((trainer: Trainer) => trainer.isActive || trainer.id === current)
      .map((trainer: Trainer) => ({ value: trainer.id, label: fullName(trainer) }))
      .sort((a: SelectOption<number>, b: SelectOption<number>) => a.label.localeCompare(b.label));
  }

  private setMembers(members: Member[]): void {
    this.allMembers = members;
    this.memberOptions = members
      .map((member: Member) => ({ value: member.id, label: fullName(member), caption: member.phone, imageUrl: realPhotoUrl(member.imageURL) }))
      .sort((a: MultiSelectOption, b: MultiSelectOption) => a.label.localeCompare(b.label));
  }

  save(): void {
    if (this.saving || !validateAndFocus(this.form, this.host.nativeElement)) {
      return;
    }
    this.saving = true;
    const training: GroupTraining = this.buildTraining();
    const name: string = classTitle(training.description);
    const save$ = this.isEdit ? this.groupTrainings.update(training) : this.groupTrainings.create(training);
    this.subscriptions.push(
      save$.subscribe(
        (saved: GroupTraining) => {
          this.toast.success(this.language.t(this.isEdit ? 'classes.toast.updated' : 'classes.toast.added', { name }));
          // The response echoes the members we sent; keep them for the detail panel.
          this.ref.close({ ...saved, members: training.members });
        },
        (error: unknown) => {
          this.saving = false;
          const message: string = error instanceof Error ? error.message : String(error);
          // The backend's own trainer check (another session may have added a class meanwhile).
          const busy: boolean = /allready exist|not available/i.test(message);
          this.toast.error(this.language.t(busy ? 'classes.toast.busyError' : 'classes.toast.saveError', { name }));
        }
      )
    );
  }

  private buildTraining(): GroupTraining {
    const ids = new Set<number>(this.members.value as number[]);
    const known: Member[] = this.allMembers.length ? this.allMembers : this.original?.members ?? [];
    const training: GroupTraining = Object.assign(new GroupTraining(), this.original ?? {});
    return Object.assign(training, {
      startTime: combineDateAndTime(this.date.value, this.time.value) as Date,
      description: String(this.description.value).trim(),
      trainerId: Number(this.trainerId.value),
      members: known.filter((member: Member) => ids.has(member.id)),
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

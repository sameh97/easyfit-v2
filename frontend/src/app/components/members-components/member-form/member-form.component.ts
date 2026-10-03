import { Component, ElementRef, Inject, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppConsts } from 'src/app/common/consts';
import { NotFoundError } from 'src/app/exceptions/not-found-error';
import { Member } from 'src/app/model/member';
import { DashboardService } from 'src/app/services/dashboard-service/dashboard.service';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { Lang, LanguageService } from 'src/app/services/language.service';
import { MembersService } from 'src/app/services/members-service/members.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { FieldMessages, fromApiDate, toIsoDate, validateAndFocus } from 'src/app/shared/ui/form/field';
import { SegmentedFieldOption } from 'src/app/shared/ui/form/segmented-field.component';
import { CloseGuard, SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { addMonths, fullName } from '../member-status';

export interface MemberFormData {
  /** null = add a new member. */
  member: Member | null;
}

/** Membership length chips (months); they set the end date from the join date. */
const LENGTHS: readonly number[] = [1, 3, 6, 12];

/**
 * Add / edit member side panel (redesign.md §5.2, mockup P2-Member-Form).
 * Validation rules are exactly the legacy add/update member dialogs' ones (FormInputComponent).
 */
@Component({
  selector: 'app-member-form',
  templateUrl: './member-form.component.html',
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class MemberFormComponent extends FormInputComponent implements CloseGuard, OnDestroy {
  readonly original: Member | null;
  readonly isEdit: boolean;
  readonly lengths: readonly number[] = LENGTHS;

  readonly firstName: FormControl;
  readonly lastName: FormControl;
  readonly phone: FormControl;
  readonly email: FormControl;
  readonly birthDay: FormControl;
  readonly gender: FormControl;
  readonly address: FormControl;
  readonly joinDate: FormControl;
  readonly endOfMembershipDate: FormControl;
  readonly form: FormGroup;

  genderOptions: SegmentedFieldOption<number>[] = [];
  /** Add: "end before join" has its own message. Edit uses checkDate (must be in the future). */
  readonly endMessages: FieldMessages;
  currentPhoto: string | null;
  saving: boolean = false;
  /** undefined = unchanged, null = removed, File = new photo. */
  private photo: File | null | undefined = undefined;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: MemberFormData,
    public ref: SidePanelRef<Member>,
    private host: ElementRef<HTMLElement>,
    private members: MembersService,
    private fileUpload: FileUploadService,
    private toast: ToastService,
    private language: LanguageService,
    private dashboard: DashboardService
  ) {
    super();
    this.original = data?.member ?? null;
    this.isEdit = !!this.original;
    const m: Member | null = this.original;

    // Same validators, per field and per mode, as the legacy add/update member dialogs had.
    this.firstName = new FormControl(m?.firstName ?? '', [Validators.required, Validators.minLength(3), this.validateName]);
    this.lastName = new FormControl(
      m?.lastName ?? '',
      this.isEdit ? [Validators.required, this.validateName] : [Validators.required, Validators.minLength(2), this.validateName]
    );
    this.email = new FormControl(m?.email ?? '', [Validators.required, Validators.email]);
    this.joinDate = new FormControl(m ? fromApiDate(m.joinDate) : startOfToday(), [Validators.required]);
    this.endOfMembershipDate = new FormControl(m ? fromApiDate(m.endOfMembershipDate) : null, [
      Validators.required,
      this.isEdit ? this.checkDate : this.checkEndDate,
    ]);
    this.gender = new FormControl(m ? Number(m.gender) || null : null, [Validators.required]);
    this.phone = new FormControl(m?.phone ?? '', [Validators.required, this.validatePhoneNumber]);
    this.address = new FormControl(m?.address ?? '', [Validators.required]);
    this.birthDay = new FormControl(m ? fromApiDate(m.birthDay) : null, [Validators.required, this.validateBirthDay]);

    this.form = new FormGroup({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      joinDate: this.joinDate,
      endOfMembershipDate: this.endOfMembershipDate,
      gender: this.gender,
      phone: this.phone,
      address: this.address,
      birthDay: this.birthDay,
    });

    this.endMessages = this.isEdit ? {} : { dateNotValid: 'validation.endBeforeJoin' };
    this.currentPhoto = realPhotoUrl(m?.imageURL);

    // The end date is checked against the join date, so re-check it when the join date changes.
    this.subscriptions.push(
      this.joinDate.valueChanges.subscribe(() => this.endOfMembershipDate.updateValueAndValidity({ emitEvent: false }))
    );
    this.subscriptions.push(
      this.language.lang$.subscribe((_lang: Lang) => {
        this.genderOptions = [
          { value: 1, label: this.language.t('common.gender.male') },
          { value: 2, label: this.language.t('common.gender.female') },
        ];
      })
    );
  }

  /** The legacy add dialog's checkEndDate: after today, and not before the join date. */
  private checkEndDate: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control) {
      return null;
    }
    const dateFromForm: Date = new Date(control.value);
    if (dateFromForm.getTime() <= Date.now()) {
      return { dateShouldBeInPresent: true };
    }
    const join: Date = new Date(this.joinDate?.value);
    if (join.getTime() > dateFromForm.getTime()) {
      return { dateNotValid: true };
    }
    return null;
  };

  get title(): string {
    return this.language.t(this.isEdit ? 'members.form.editTitle' : 'members.form.addTitle');
  }

  isDirty(): boolean {
    return this.form.dirty || this.photo !== undefined;
  }

  onPhoto(file: File | null): void {
    this.photo = file;
  }

  /** The chip whose length matches the current join → end dates, if any. */
  isLength(months: number): boolean {
    const join: Date | null = this.joinDate.value;
    const end: Date | null = this.endOfMembershipDate.value;
    return !!join && !!end && addMonths(join, months).getTime() === end.getTime();
  }

  setLength(months: number): void {
    const join: Date | null = this.joinDate.value;
    if (!join) {
      this.joinDate.markAsTouched();
      return;
    }
    this.endOfMembershipDate.setValue(addMonths(join, months));
    this.endOfMembershipDate.markAsDirty();
    this.endOfMembershipDate.markAsTouched();
  }

  save(): void {
    if (this.saving || !validateAndFocus(this.form, this.host.nativeElement)) {
      return;
    }
    this.saving = true;
    const upload$: Observable<string | null> = this.photo ? this.fileUpload.uploadImage(this.photo, null) : of(null);
    this.subscriptions.push(
      upload$
        .pipe(
          switchMap((uploaded: string | null) => {
            const member: Member = this.buildMember(uploaded);
            return this.isEdit ? this.members.update(member) : (this.members.create(member) as Observable<Member>);
          })
        )
        .subscribe(
          (saved: Member) => {
            this.dashboard.load().subscribe({ error: () => undefined });
            this.toast.success(
              this.language.t(this.isEdit ? 'members.toast.updated' : 'members.toast.added', { name: fullName(saved) })
            );
            this.ref.close(saved);
          },
          (error: Error) => {
            this.saving = false;
            const emailChanged: boolean = this.isEdit && this.email.value !== this.original?.email;
            this.toast.error(
              this.language.t(
                error instanceof NotFoundError && emailChanged ? 'members.toast.emailChangeError' : 'members.toast.saveError',
                { name: fullName({ firstName: this.firstName.value, lastName: this.lastName.value }) }
              )
            );
          }
        )
    );
  }

  private buildMember(uploadedUrl: string | null): Member {
    const gender: number = Number(this.gender.value);
    // No photo → the same placeholder images the legacy form saved (shown as initials in Studio).
    const placeholder: string =
      gender === 2 ? AppConsts.FEMALE_MEMBER_DEFULT_IMAGE : AppConsts.MALE_MEMBER_DEFULT_IMAGE;
    let imageURL: string = uploadedUrl ?? this.original?.imageURL ?? placeholder;
    if (this.photo === null || !realPhotoUrl(imageURL)) {
      imageURL = uploadedUrl ?? placeholder;
    }
    const member: Member = Object.assign(new Member(), this.original ?? {});
    return Object.assign(member, {
      firstName: String(this.firstName.value).trim(),
      lastName: String(this.lastName.value).trim(),
      phone: String(this.phone.value).trim(),
      email: String(this.email.value).trim(),
      address: String(this.address.value).trim(),
      gender,
      birthDay: toIsoDate(this.birthDay.value) ?? '',
      joinDate: toIsoDate(this.joinDate.value) ?? '',
      endOfMembershipDate: toIsoDate(this.endOfMembershipDate.value) ?? '',
      imageURL,
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

function startOfToday(): Date {
  const now: Date = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

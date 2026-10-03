import { Component, ElementRef, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppConsts } from 'src/app/common/consts';
import { Trainer } from 'src/app/model/trainer';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { Lang, LanguageService } from 'src/app/services/language.service';
import { TrainersService } from 'src/app/services/trainers-service/trainers.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { fromApiDate, toIsoDate, validateAndFocus } from 'src/app/shared/ui/form/field';
import { SegmentedFieldOption } from 'src/app/shared/ui/form/segmented-field.component';
import { CloseGuard, SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { fullName } from '../../members-components/member-status';

export interface TrainerFormData {
  /** null = add a new trainer. */
  trainer: Trainer | null;
}

/**
 * Add / edit trainer side panel (§5.3): the member form's pattern, plus certification date and
 * without the membership section. Validation rules are exactly the legacy trainer dialogs' ones.
 */
@Component({
  selector: 'app-trainer-form',
  templateUrl: './trainer-form.component.html',
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class TrainerFormComponent extends FormInputComponent implements CloseGuard, OnDestroy {
  readonly original: Trainer | null;
  readonly isEdit: boolean;

  readonly firstName: FormControl;
  readonly lastName: FormControl;
  readonly phone: FormControl;
  readonly email: FormControl;
  readonly birthDay: FormControl;
  readonly gender: FormControl;
  readonly address: FormControl;
  readonly joinDate: FormControl;
  readonly certificationDate: FormControl;
  readonly form: FormGroup;

  genderOptions: SegmentedFieldOption<number>[] = [];
  currentPhoto: string | null;
  saving: boolean = false;
  /** undefined = unchanged, null = removed, File = new photo. */
  private photo: File | null | undefined = undefined;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: TrainerFormData,
    public ref: SidePanelRef<Trainer>,
    private host: ElementRef<HTMLElement>,
    private trainers: TrainersService,
    private fileUpload: FileUploadService,
    private toast: ToastService,
    private language: LanguageService
  ) {
    super();
    this.original = data?.trainer ?? null;
    this.isEdit = !!this.original;
    const t: Trainer | null = this.original;

    // Same validators, per field and per mode, as the legacy add/update trainer dialogs had.
    this.firstName = new FormControl(t?.firstName ?? '', [Validators.required, Validators.minLength(3), this.validateName]);
    this.lastName = new FormControl(t?.lastName ?? '', [Validators.required, this.validateName]);
    this.email = new FormControl(t?.email ?? '', [Validators.required, Validators.email]);
    this.joinDate = new FormControl(t ? fromApiDate(t.joinDate) : null, [Validators.required]);
    this.certificationDate = new FormControl(t ? fromApiDate(t.certificationDate) : null, [Validators.required]);
    // Trainers have no gender column; the legacy forms still require it (it picks the placeholder
    // photo). Prefill it from that placeholder when possible so editing doesn't always ask again.
    this.gender = new FormControl(t ? Number(t.gender) || genderFromPlaceholder(t.imageURL) : null, [Validators.required]);
    this.phone = new FormControl(
      t?.phone ?? '',
      this.isEdit
        ? [Validators.required, this.validatePhoneNumber]
        : [Validators.required, Validators.minLength(4), this.validatePhoneNumber]
    );
    this.address = new FormControl(t?.address ?? '', [Validators.required, Validators.minLength(3)]);
    this.birthDay = new FormControl(t ? fromApiDate(t.birthDay) : null, [Validators.required, this.validateBirthDay]);

    this.form = new FormGroup({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      joinDate: this.joinDate,
      certificationDate: this.certificationDate,
      gender: this.gender,
      phone: this.phone,
      address: this.address,
      birthDay: this.birthDay,
    });
    this.currentPhoto = realPhotoUrl(t?.imageURL);

    this.subscriptions.push(
      this.language.lang$.subscribe((_lang: Lang) => {
        this.genderOptions = [
          { value: 1, label: this.language.t('common.gender.male') },
          { value: 2, label: this.language.t('common.gender.female') },
        ];
      })
    );
  }

  get title(): string {
    return this.language.t(this.isEdit ? 'trainers.form.editTitle' : 'trainers.form.addTitle');
  }

  isDirty(): boolean {
    return this.form.dirty || this.photo !== undefined;
  }

  onPhoto(file: File | null): void {
    this.photo = file;
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
            const trainer: Trainer = this.buildTrainer(uploaded);
            return this.isEdit ? this.trainers.update(trainer) : (this.trainers.create(trainer) as Observable<Trainer>);
          })
        )
        .subscribe(
          (saved: Trainer) => {
            this.toast.success(
              this.language.t(this.isEdit ? 'trainers.toast.updated' : 'trainers.toast.added', { name: fullName(saved) })
            );
            this.ref.close(saved);
          },
          () => {
            this.saving = false;
            // The update endpoint finds the trainer by email, so a changed email can't be saved.
            const emailChanged: boolean = this.isEdit && this.email.value !== this.original?.email;
            this.toast.error(
              this.language.t(emailChanged ? 'trainers.toast.emailChangeError' : 'trainers.toast.saveError', {
                name: fullName({ firstName: this.firstName.value, lastName: this.lastName.value }),
              })
            );
          }
        )
    );
  }

  private buildTrainer(uploadedUrl: string | null): Trainer {
    const gender: number = Number(this.gender.value);
    // No photo → the placeholder images the legacy form saved (shown as initials in Studio).
    const placeholder: string = gender === 1 ? AppConsts.TRAINER_DEFULT_IMAGE : AppConsts.TRAINER_FEMALE_DEFULT_IMAGE;
    let imageURL: string = uploadedUrl ?? this.original?.imageURL ?? placeholder;
    if (this.photo === null || !realPhotoUrl(imageURL)) {
      imageURL = uploadedUrl ?? placeholder;
    }
    const trainer: Trainer = Object.assign(new Trainer(), this.original ?? { isActive: true });
    return Object.assign(trainer, {
      firstName: String(this.firstName.value).trim(),
      lastName: String(this.lastName.value).trim(),
      phone: String(this.phone.value).trim(),
      email: String(this.email.value).trim(),
      address: String(this.address.value).trim(),
      gender,
      birthDay: toIsoDate(this.birthDay.value) ?? '',
      joinDate: toIsoDate(this.joinDate.value) ?? '',
      certificationDate: toIsoDate(this.certificationDate.value) ?? '',
      imageURL,
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

function genderFromPlaceholder(imageURL: string | null | undefined): number | null {
  if (imageURL === AppConsts.TRAINER_DEFULT_IMAGE) {
    return 1;
  }
  return imageURL === AppConsts.TRAINER_FEMALE_DEFULT_IMAGE ? 2 : null;
}

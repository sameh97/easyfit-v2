import { Component, ElementRef, Inject, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppConsts } from 'src/app/common/consts';
import { Gym } from 'src/app/model/gym';
import { User } from 'src/app/model/user';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { GymsService } from 'src/app/services/gyms-service/gyms.service';
import { LanguageService } from 'src/app/services/language.service';
import { UsersService } from 'src/app/services/users-service/users.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { fromApiDate, toIsoDate, validateAndFocus } from 'src/app/shared/ui/form/field';
import { SelectOption } from 'src/app/shared/ui/form/select.component';
import { CloseGuard, SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';

export interface UserFormData {
  /** null = a new user. */
  user: User | null;
}

/** New users are gym managers (roleId 1), as the legacy add-user dialog made them. */
const GYM_USER_ROLE_ID: number = 1;

/**
 * Add / edit user side panel (§5.11): photo, name, email, password, phone, birthday, address and
 * gym. Rules as the legacy user dialogs; the password is required for a new user and optional on
 * edit (left empty, the current one stays: the list never has passwords, so the legacy edit made
 * the admin set a new one every time).
 */
@Component({
    selector: 'app-user-form',
    templateUrl: './user-form.component.html',
    styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class UserFormComponent extends FormInputComponent implements CloseGuard, OnDestroy {
  readonly original: User | null;
  readonly isEdit: boolean;
  readonly firstName: UntypedFormControl;
  readonly lastName: UntypedFormControl;
  readonly email: UntypedFormControl;
  readonly password: UntypedFormControl;
  readonly confirmPassword: UntypedFormControl;
  readonly phone: UntypedFormControl;
  readonly birthDay: UntypedFormControl;
  readonly address: UntypedFormControl;
  readonly gymId: UntypedFormControl;
  readonly form: UntypedFormGroup;

  gymOptions: SelectOption<number>[] = [];
  currentPhoto: string | null;
  saving: boolean = false;
  private photo: File | null | undefined = undefined;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: UserFormData,
    public ref: SidePanelRef<User>,
    private host: ElementRef<HTMLElement>,
    private users: UsersService,
    private gyms: GymsService,
    private fileUpload: FileUploadService,
    private toast: ToastService,
    private language: LanguageService
  ) {
    super();
    const u: User | null = data?.user ?? null;
    this.original = u;
    this.isEdit = !!u;
    this.firstName = new UntypedFormControl(u?.firstName ?? '', [Validators.required, this.validateName]);
    this.lastName = new UntypedFormControl(u?.lastName ?? '', [Validators.required, this.validateName]);
    this.email = new UntypedFormControl(u?.email ?? '', [Validators.required, Validators.email]);
    this.password = new UntypedFormControl('', this.isEdit ? [this.optionalPassword] : [Validators.required, this.validatePassword]);
    this.confirmPassword = new UntypedFormControl('', [this.matchesPassword]);
    this.phone = new UntypedFormControl(u?.phone ?? '', [Validators.required, this.validateIsraeliPhoneNumber]);
    this.birthDay = new UntypedFormControl(u ? fromApiDate(u.birthDay) : null, [Validators.required, this.validateBirthDay]);
    this.address = new UntypedFormControl(u?.address ?? '', [Validators.required]);
    this.gymId = new UntypedFormControl(u?.gymId ?? null, [Validators.required]);
    this.form = new UntypedFormGroup({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword,
      phone: this.phone,
      birthDay: this.birthDay,
      address: this.address,
      gymId: this.gymId,
    });
    this.currentPhoto = realPhotoUrl(u?.imageURL);
    this.subscriptions.push(
      this.password.valueChanges.subscribe(() => this.confirmPassword.updateValueAndValidity({ emitEvent: false })),
      this.gyms.getAll().subscribe((gyms: Gym[] | null) => {
        this.gymOptions = (gyms ?? [])
          .map((gym: Gym) => ({ value: gym.id, label: gym.name }))
          .sort((a: SelectOption<number>, b: SelectOption<number>) => a.label.localeCompare(b.label));
      })
    );
  }

  get title(): string {
    return this.language.t(this.isEdit ? 'admin.users.form.editTitle' : 'admin.users.form.addTitle');
  }

  /** On edit an empty password means "keep the current one"; a typed one follows the legacy rule. */
  private optionalPassword = (control: AbstractControl): ValidationErrors | null => {
    return control.value ? this.validatePassword(control) : null;
  };

  /** As the legacy checkPasswords: the confirmation must equal the password (required when one is typed). */
  private matchesPassword = (control: AbstractControl): ValidationErrors | null => {
    const password: string = String(this.password?.value ?? '');
    const confirm: string = String(control.value ?? '');
    if (!password && !confirm) {
      return this.isEdit ? null : { required: true };
    }
    return password === confirm ? null : { notSame: true };
  };

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
    const name: string = `${String(this.firstName.value).trim()} ${String(this.lastName.value).trim()}`;
    const upload$: Observable<string | null> = this.photo ? this.fileUpload.uploadImage(this.photo, null) : of(null);
    this.subscriptions.push(
      upload$
        .pipe(
          switchMap((uploaded: string | null) => {
            const user: User = this.buildUser(uploaded);
            return this.isEdit ? this.users.update(user) : (this.users.create(user) as Observable<User>);
          })
        )
        .subscribe(
          (saved: User) => {
            this.toast.success(this.language.t(this.isEdit ? 'admin.users.toast.updated' : 'admin.users.toast.added', { name }));
            this.ref.close(saved);
          },
          () => {
            this.saving = false;
            this.toast.error(this.language.t('admin.users.toast.saveError', { name }));
          }
        )
    );
  }

  private buildUser(uploadedUrl: string | null): User {
    let imageURL: string = uploadedUrl ?? this.original?.imageURL ?? AppConsts.USER_DEFULT_IMAGE;
    if (this.photo === null) {
      imageURL = AppConsts.USER_DEFULT_IMAGE;
    }
    const user: User = Object.assign(new User(), this.original ?? { roleId: GYM_USER_ROLE_ID });
    return Object.assign(user, {
      firstName: String(this.firstName.value).trim(),
      lastName: String(this.lastName.value).trim(),
      email: String(this.email.value).trim(),
      // Empty on edit = keep the current password (the backend keeps it).
      password: String(this.password.value ?? ''),
      phone: String(this.phone.value).trim(),
      birthDay: (toIsoDate(this.birthDay.value) ?? '') as unknown as Date,
      address: String(this.address.value).trim(),
      gymId: Number(this.gymId.value),
      imageURL,
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

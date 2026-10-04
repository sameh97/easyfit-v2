import { Component, ElementRef, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppConsts } from 'src/app/common/consts';
import { User } from 'src/app/model/user';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { LanguageService } from 'src/app/services/language.service';
import { UsersService } from 'src/app/services/users-service/users.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { fromApiDate, toIsoDate, validateAndFocus } from 'src/app/shared/ui/form/field';
import { CloseGuard, SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';

export interface ProfileFormData {
  user: User;
}

/**
 * Edit profile side panel (§5.9): photo, name, phone, birthday, address; the email is the sign-in
 * name and stays read-only. Rules as the legacy edit-profile dialog. The password is never sent
 * (an empty password keeps the stored one), and the token the server re-issues is kept, so the
 * new name survives a reload.
 */
@Component({
  selector: 'app-profile-form',
  templateUrl: './profile-form.component.html',
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class ProfileFormComponent extends FormInputComponent implements CloseGuard, OnDestroy {
  readonly original: User;
  readonly firstName: FormControl;
  readonly lastName: FormControl;
  readonly phone: FormControl;
  readonly birthDay: FormControl;
  readonly address: FormControl;
  readonly form: FormGroup;

  currentPhoto: string | null;
  saving: boolean = false;
  /** undefined = unchanged, null = removed, File = new photo. */
  private photo: File | null | undefined = undefined;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: ProfileFormData,
    public ref: SidePanelRef<User>,
    private host: ElementRef<HTMLElement>,
    private users: UsersService,
    private auth: AuthenticationService,
    private fileUpload: FileUploadService,
    private toast: ToastService,
    private language: LanguageService
  ) {
    super();
    const u: User = data.user;
    this.original = u;
    this.firstName = new FormControl(u.firstName ?? '', [Validators.required, this.validateName]);
    this.lastName = new FormControl(u.lastName ?? '', [Validators.required, this.validateName]);
    this.phone = new FormControl(u.phone ?? '', [Validators.required, this.validateIsraeliPhoneNumber]);
    this.birthDay = new FormControl(fromApiDate(u.birthDay), [Validators.required, this.validateBirthDay]);
    this.address = new FormControl(u.address ?? '', [Validators.required]);
    this.form = new FormGroup({
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      birthDay: this.birthDay,
      address: this.address,
    });
    this.currentPhoto = realPhotoUrl(u.imageURL);
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
        .pipe(switchMap((uploaded: string | null) => this.users.updateOwnProfile(this.buildUser(uploaded))))
        .subscribe(
          ({ user, token }: { user: User; token: string | null }) => {
            if (token) {
              this.auth.replaceToken(token);
            } else {
              this.auth.setCurrentUserSubject({ ...this.original, ...user });
            }
            this.toast.success(this.language.t('profile.toast.updated'));
            this.ref.close(user);
          },
          () => {
            this.saving = false;
            this.toast.error(this.language.t('profile.toast.saveError'));
          }
        )
    );
  }

  private buildUser(uploadedUrl: string | null): User {
    let imageURL: string = uploadedUrl ?? this.original.imageURL ?? AppConsts.USER_DEFULT_IMAGE;
    if (this.photo === null) {
      imageURL = AppConsts.USER_DEFULT_IMAGE;
    }
    return {
      ...this.original,
      // Never send the password back: an empty one keeps the stored password.
      password: '',
      firstName: String(this.firstName.value).trim(),
      lastName: String(this.lastName.value).trim(),
      phone: String(this.phone.value).trim(),
      birthDay: (toIsoDate(this.birthDay.value) ?? '') as unknown as Date,
      address: String(this.address.value).trim(),
      imageURL,
    };
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

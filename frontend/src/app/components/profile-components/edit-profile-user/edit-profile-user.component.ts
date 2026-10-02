import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { User } from 'src/app/model/user';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { GymsService } from 'src/app/services/gyms-service/gyms.service';
import { UsersService } from 'src/app/services/users-service/users.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';

@Component({
  selector: 'app-edit-profile-user',
  templateUrl: './edit-profile-user.component.html',
  styleUrls: ['./edit-profile-user.component.css'],
})
export class EditProfileUserComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  updateUserForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) private user: User,
    private gymsService: GymsService,
    private usersService: UsersService,
    private fileUploadService: FileUploadService,
    public dialogRef: MatDialogRef<EditProfileUserComponent>,
    private authService: AuthenticationService,
    private navigationHelperService: NavigationHelperService
  ) {
    super();
  }

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm = (): void => {
    this.updateUserForm = this.formBuilder.group({
  
      firstName: [
        this.user.firstName,
        [Validators.required, this.validateName],
      ],
      lastName: [this.user.lastName, [Validators.required, this.validateName]],
      email: [this.user.email, [Validators.required, Validators.email]],
      phone: [
        this.user.phone,
        [Validators.required, this.validateIsraeliPhoneNumber],
      ],
      imageURL: ['', []],
      birthDay: [
        this.user.birthDay,
        [Validators.required, this.validateBirthDay],
      ],
      address: [this.user.address, [Validators.required]],
    });
  };

  public update = (): Promise<void> => {
    if (!AppUtil.hasValue(this.user)) {
      AppUtil.showWarningMessage(
        `cannot update user because there is a missing fields`
      );
      return;
    }

    if (
      AppUtil.hasValue(this.imageToUpload) ||
      AppUtil.hasValue(this.user.imageURL)
    ) {
      this.subscriptions.push(
        this.fileUploadService
          .uploadImage(this.imageToUpload, this.user.imageURL)
          .pipe(
            switchMap((imgUrl) => {
              this.uploadedImageUrl = imgUrl;
              this.user.imageURL = imgUrl;
              return this.usersService.update(this.user);
            })
          )
          .subscribe(
            (user: User) => {
              this.authService.setCurrentUserSubject(user);
              this.navigationHelperService.openSnackBar(
                'start',
                'bottom',
                `Profile was updated successfully`
              );
              this.dialogRef.close();
            },
            (error: Error) => {
              AppUtil.showError(error);
            }
          )
      );
    } else {
      this.user.imageURL = AppConsts.USER_DEFULT_IMAGE;
      this.subscriptions.push(
        this.usersService.update(this.user).subscribe(
          (user: User) => {
            this.authService.setCurrentUserSubject(user);
            this.navigationHelperService.openSnackBar(
              'start',
              'bottom',
              `Profile was updated successfully`
            );
            this.dialogRef.close();
          },
          (error: Error) => {
            AppUtil.showError(error);
          }
        )
      );
    }
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

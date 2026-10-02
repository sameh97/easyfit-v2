import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { Gym } from 'src/app/model/gym';
import { User } from 'src/app/model/user';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { GymsService } from 'src/app/services/gyms-service/gyms.service';
import { UsersService } from 'src/app/services/users-service/users.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.css'],
})
export class UpdateUserComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  updateUserForm: FormGroup;
  private subscriptions: Subscription[] = [];
  gyms: Gym[];

  dropdownList = [];
  selectedItems = [];
  dropdownSettings: IDropdownSettings = {};

  constructor(
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) private user: User,
    private gymsService: GymsService,
    private usersService: UsersService,
    public dialogRef: MatDialogRef<UpdateUserComponent>,
    private fileUploadService: FileUploadService
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
      this.gymsService.getAll().subscribe((gyms) => {
        this.gyms = gyms;

        for (let gym of this.gyms) {
          const item: any = {
            item_id: gym.id,
            item_text: gym.name,
          };
          this.dropdownList.push(item);
        }

        for (let gym of this.gyms) {
          const item: any = {
            item_id: gym.id,
            item_text: gym.name,
          };

          if (gym.id === this.user.gymId) {
            this.selectedItems.push(item);
            break;
          }
        }

        this.dropdownList = [...this.dropdownList];
        this.buildForm();
      })
    );
  }

  private buildForm = (): void => {
    this.updateUserForm = this.formBuilder.group(
      {
        
        firstName: [
          this.user.firstName,
          [Validators.required, this.validateName],
        ],
        lastName: [
          this.user.lastName,
          [Validators.required, this.validateName],
        ],
        email: [this.user.email, [Validators.required, Validators.email]],
        password: [
          this.user.password,
          [Validators.required, this.validatePassword],
        ],
        confirmPassword: ['', [Validators.required]],
        phone: [
          this.user.phone,
          [Validators.required, this.validateIsraeliPhoneNumber],
        ],
        imageURL: [this.user.imageURL, []],
        birthDay: [
          this.user.birthDay,
          [Validators.required, this.validateBirthDay],
        ],
        address: [this.user.address, [Validators.required]],
        gymId: ['', [Validators.required]],
      },
      { validators: this.checkPasswords }
    );
  };

  onItemSelect(item: any) {
    for (let gym of this.gyms) {
      if (item.item_id === gym.id) {
        this.user.gymId = gym.id;
      }
    }
  }

  onItemDeSelect(item: any) {
    this.user.gymId = null;
  }

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
            () => {
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
          () => {
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

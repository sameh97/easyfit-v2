import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
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
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css'],
})
export class AddUserComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  addUserForm: FormGroup;
  user: User;
  gyms: Gym[];
  private subscriptions: Subscription[] = [];

  dropdownList = [];
  selectedItems = [];
  dropdownSettings: IDropdownSettings = {};

  constructor(
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private gymsService: GymsService,
    public dialogRef: MatDialogRef<AddUserComponent>,
    private fileUploadService: FileUploadService
  ) {
    super();
  }

  ngOnInit(): void {
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

        this.dropdownList = [...this.dropdownList];
      })
    );

    this.user = new User();
    this.addUserForm = this.formBuilder.group(
      {
    
        firstName: ['', [Validators.required, this.validateName]],
        lastName: ['', [Validators.required, this.validateName]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, this.validatePassword]],
        confirmPassword: ['', [Validators.required]],
        imageURL: ['', []],
        phone: ['', [Validators.required, this.validateIsraeliPhoneNumber]],
        birthDay: ['', [Validators.required, this.validateBirthDay]],
        address: ['', [Validators.required]],
        gymId: ['', [Validators.required]],
      },
      { validators: this.checkPasswords }
    );

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

  public create = (): Promise<void> => {
    if (!AppUtil.hasValue(this.user)) {
      AppUtil.showWarningMessage(
        `cannot create user because there is a missing fields`
      );
      return;
    }

    this.user.roleId = 1;

    if (AppUtil.hasValue(this.imageToUpload)) {
      this.subscriptions.push(
        this.fileUploadService
          .uploadImage(this.imageToUpload, null)
          .pipe(
            switchMap((imgUrl) => {
              this.uploadedImageUrl = imgUrl;
              this.user.imageURL = imgUrl;
              return this.usersService.create(this.user);
            })
          )
          .subscribe(
            (user) => {
              this.dialogRef.close();
            },
            (err: Error) => {
              AppUtil.showError(err);
            }
          )
      );
    } else {
      this.user.imageURL = AppConsts.USER_DEFULT_IMAGE;
      this.subscriptions.push(
        this.usersService.create(this.user).subscribe(
          (user) => {
            this.dialogRef.close();
          },
          (err: Error) => {
            AppUtil.showError(err);
          }
        )
      );
    }
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

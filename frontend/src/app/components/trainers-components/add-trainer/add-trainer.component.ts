import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { Trainer } from 'src/app/model/trainer';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { TrainersService } from 'src/app/services/trainers-service/trainers.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';

@Component({
  selector: 'app-add-trainer',
  templateUrl: './add-trainer.component.html',
  styleUrls: ['./add-trainer.component.css'],
})
export class AddTrainerComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  addTrainerForm: FormGroup;
  trainer: Trainer;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private trainersService: TrainersService,
    public dialogRef: MatDialogRef<AddTrainerComponent>,
    private fileUploadService: FileUploadService,
    private navigationHelperService: NavigationHelperService
  ) {
    super();
  }

  ngOnInit(): void {
    this.trainer = new Trainer();
    this.addTrainerForm = this.formBuilder.group({
      firstName: [
        '',
        [Validators.required, Validators.minLength(3), this.validateName],
      ],
      lastName: ['', [Validators.required, this.validateName]],
      email: ['', [Validators.required, Validators.email]],
      joinDate: ['', [Validators.required]],
      certificationDate: ['', [Validators.required]],

      gender: ['', [Validators.required]],
      phone: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          this.validatePhoneNumber,
        ],
      ],
      address: ['', [Validators.required, Validators.minLength(3)]],
      birthDay: ['', [Validators.required, this.validateBirthDay]],
      imageURL: ['', []],
    });
  }

  public create = (): Promise<void> => {
    if (!AppUtil.hasValue(this.trainer)) {
      AppUtil.showWarningMessage(
        `cannot create trainer because there is a missing fields`
      );
      return;
    }

    this.trainer.isActive = true; // TODO: remove from database

    if (AppUtil.hasValue(this.imageToUpload)) {
      this.subscriptions.push(
        this.fileUploadService
          .uploadImage(this.imageToUpload, null)
          .pipe(
            switchMap((imgUrl) => {
              this.uploadedImageUrl = imgUrl;
              this.trainer.imageURL = imgUrl;
              return this.trainersService.create(this.trainer);
            })
          )
          .subscribe(
            (trainer) => {
              this.dialogRef.close();
              this.navigationHelperService.openSnackBar(
                'start',
                'bottom',
                `Trainer was added successfully`
              );
            },
            (err: Error) => {
              AppUtil.showError(err);
            }
          )
      );
    } else {
      this.trainer.imageURL =
        Number(this.trainer.gender) === 1
          ? AppConsts.TRAINER_DEFULT_IMAGE
          : AppConsts.TRAINER_FEMALE_DEFULT_IMAGE;

      this.subscriptions.push(
        this.trainersService.create(this.trainer).subscribe(
          (trainer) => {
            this.dialogRef.close();
            this.navigationHelperService.openSnackBar(
              'start',
              'bottom',
              `Trainer was added successfully`
            );
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

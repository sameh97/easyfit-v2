import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { Machine } from 'src/app/model/machine';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { MachinesService } from 'src/app/services/machines-service/machines.service';
import { UserNotificationsService } from 'src/app/services/user-notifications.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';

@Component({
  selector: 'app-edit-machine',
  templateUrl: './edit-machine.component.html',
  styleUrls: ['./edit-machine.component.css'],
})
export class EditMachineComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  updateMachineForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) private machine: Machine,
    private machinesService: MachinesService,
    private fileUploadService: FileUploadService,
    private userNotificationsService: UserNotificationsService,
    public dialogRef: MatDialogRef<EditMachineComponent>,
    private navigationHelperService: NavigationHelperService
  ) {
    super();
  }

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm = (): void => {
  
    this.updateMachineForm = this.formBuilder.group({
      
      id: [this.machine.id, [Validators.required]],
      name: [
        this.machine.name,
        [Validators.required, this.validateMachineName],
      ],
      description: [this.machine.description, [Validators.required]],
      productionYear: [
        this.machine.productionYear,
        [Validators.required, this.validateYear],
      ],
      serialNumber: [
        this.machine.serialNumber,
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(50),
          this.validateSerialNumber,
        ],
      ],
      price: [
        this.machine.price,
        [Validators.required, Validators.min(0), this.validatePrice],
      ],
      imgUrl: ['', []],
      gymId: [this.machine.gymId, [Validators.required]],
    });
  };

  public update = (machine: Machine): Promise<void> => {
    if (!AppUtil.hasValue(machine)) {
      AppUtil.showWarningMessage(
        `cannot update machine because there is a missing fields`
      );
      return;
    }

    if (
      AppUtil.hasValue(this.imageToUpload) ||
      AppUtil.hasValue(this.machine.imgUrl)
    ) {
      this.subscriptions.push(
        this.fileUploadService
          .uploadImage(this.imageToUpload, this.machine.imgUrl)
          .pipe(
            switchMap((imgUrl) => {
              this.uploadedImageUrl = imgUrl;
              machine.imgUrl = imgUrl;
              return this.machinesService.update(machine);
            })
          )
          .subscribe(
            () => {
              this.dialogRef.close();
              this.showSnackBar();
            },
            (err: Error) => {
              AppUtil.showError(err);
            }
          )
      );
    } else {
      machine.imgUrl = AppConsts.MACHINE_DEFULT_IMAGE;

      this.subscriptions.push(
        this.machinesService.update(machine).subscribe(
          () => {
            this.dialogRef.close();
            this.showSnackBar();
          },
          (err: Error) => {
            AppUtil.showError(err);
          }
        )
      );
    }
  };

  private showSnackBar(): void {
    this.navigationHelperService.openSnackBar(
      'start',
      'bottom',
      `Machine was updated successfully`
    );
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

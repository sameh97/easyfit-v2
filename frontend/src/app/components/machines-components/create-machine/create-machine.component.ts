import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { Machine } from 'src/app/model/machine';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { MachinesService } from 'src/app/services/machines-service/machines.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';

@Component({
  selector: 'app-create-machine',
  templateUrl: './create-machine.component.html',
  styleUrls: ['./create-machine.component.css'],
})
export class CreateMachineComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  createMachineForm: FormGroup;
  private subscriptions: Subscription[] = [];
  machine: Machine;

  constructor(
    private formBuilder: FormBuilder,
    private machineService: MachinesService,
    private fileUploadService: FileUploadService,
    public dialogRef: MatDialogRef<CreateMachineComponent>,
    private navigationHelperService: NavigationHelperService
  ) {
    super();
  }

  ngOnInit(): void {
    this.machine = new Machine();
    this.createMachineForm = this.formBuilder.group({
      
      name: ['', [Validators.required, this.validateMachineName]],
      description: ['', [Validators.required]],
      productionYear: ['', [Validators.required, this.validateYear]],
      serialNumber: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(50),
          this.validateSerialNumber,
        ],
      ],
      price: ['', [Validators.required, Validators.min(0), this.validatePrice]],
      imgUrl: ['', []],
    });
  }

  public create = (): Promise<void> => {
    if (!AppUtil.hasValue(this.machine)) {
      AppUtil.showWarningMessage(
        `cannot create machine because there is a missing fields`
      );
      return;
    }

    if (AppUtil.hasValue(this.imageToUpload)) {
      this.subscriptions.push(
        this.fileUploadService
          .uploadImage(this.imageToUpload, null)
          .pipe(
            switchMap((imgUrl) => {
              this.uploadedImageUrl = imgUrl;
              this.machine.imgUrl = imgUrl;
              return this.machineService.create(this.machine);
            })
          )
          .subscribe(
            () => {
              this.dialogRef.close();
              this.navigationHelperService.openSnackBar(
                'start',
                'bottom',
                `Machine was added successfully`
              );
            },
            (err: Error) => {
              AppUtil.showError(err);
            }
          )
      );
    } else {
     
      this.machine.imgUrl = AppConsts.MACHINE_DEFULT_IMAGE;

      this.subscriptions.push(
        this.machineService.create(this.machine).subscribe(
          () => {
            this.dialogRef.close();
            this.navigationHelperService.openSnackBar(
              'start',
              'bottom',
              `Machine was added successfully`
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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { Gym } from 'src/app/model/gym';
import { GymsService } from 'src/app/services/gyms-service/gyms.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';

@Component({
  selector: 'app-create-gym',
  templateUrl: './create-gym.component.html',
  styleUrls: ['./create-gym.component.css'],
})
export class CreateGymComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  addGymForm: FormGroup;
  gym: Gym;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private gymsService: GymsService,
    public dialogRef: MatDialogRef<CreateGymComponent>
  ) {
    super();
  }

  ngOnInit(): void {
    this.gym = new Gym();
    this.addGymForm = this.formBuilder.group({
      
      name: ['', [Validators.required, this.validateGymName]],
      phone: ['', [Validators.required, this.validateIsraeliPhoneNumber]],
      address: ['', [Validators.required]],
    });
  }

  public create = (): Promise<void> => {
    if (!AppUtil.hasValue(this.gym)) {
      AppUtil.showWarningMessage(
        `cannot create gym because there is a missing fields`
      );
      return;
    }

    this.subscriptions.push(
      this.gymsService.create(this.gym).subscribe(
        () => {
          this.dialogRef.close();
        },
        (err: Error) => {
          AppUtil.showError(err);
        }
      )
    );
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

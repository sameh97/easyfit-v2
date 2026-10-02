import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppUtil } from 'src/app/common/app-util';
import { Catalog } from 'src/app/model/catalog';
import { CatalogService } from 'src/app/services/catalog-service/catalog.service';
import { Subscription } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { AppConsts } from 'src/app/common/consts';

@Component({
  selector: 'app-send-catalog',
  templateUrl: './send-catalog.component.html',
  styleUrls: ['./send-catalog.component.css'],
})
export class SendCatalogComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  sendCatalogForm: FormGroup;
  private subscriptions: Subscription[] = [];
  phones: string[] = [];
  message: string;
  constructor(
    private formBuilder: FormBuilder,
    private catalogService: CatalogService,
    @Inject(MAT_DIALOG_DATA) public catalog: Catalog
  ) {
    super();
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.catalogService.getAllPhones().subscribe((phones) => {
        this.phones = phones;
        for (let i = 0; i < this.phones.length; i++) {
          this.phones[i] = this.addPrefixToNumber(phones[i]);
        }
        this.message = '';
        this.buildForm();
      })
    );
  }

  private buildForm = (): void => {
    this.sendCatalogForm = this.formBuilder.group({
      message: [this.message, [Validators.required]],
      phones: ['', [this.validatePhones, Validators.required]],
    });
  };

  public isPhonesEmpty(): boolean {
    if (!this.phones) {
      return false;
    }

    return this.phones.length === 0;
  }

  private validatePhones(phones: AbstractControl): { [key: string]: any } {
    if (phones.value && phones.value.length === 0) {
      return {
        validatePhonesArray: { valid: false },
      };
    }

    return null;
  }

  // public validatePhoneNumber = (
  //   inputControl: AbstractControl
  // ): ValidationErrors | null => {
  //   if (!inputControl) {
  //     return null;
  //   }

  //   let phoneRegx = new RegExp('^[0][5][0|2|3|4|5|9]{1}[-]{0,1}[0-9]{7}$');

  //   let phoneNumbersArray: string[] = [];

  //   for (let number of inputControl.value) {
  //     number = number.substring(4);
  //     number = `0${number}`;
  //     phoneNumbersArray.push(number);
  //   }

  //   for (const number of phoneNumbersArray) {
  //     if (number === '') {
  //       return { empty: true };
  //     }

  //     if (!number.match(phoneRegx)) {
  //       return { phoneNotValid: true };
  //     }
  //   }

  //   return null;
  // };

  public send = (): Promise<void> => {
    if (!AppUtil.hasValue(this.message)) {
      AppUtil.showWarningMessage(
        `cannot send message because there is a missing fields`
      );
      return;
    }

    const messageContent: any = {
      message: `${this.message} Open the Link: ${this.getLink()}`,
      phones: this.phones,
    };

    this.subscriptions.push(
      this.catalogService.send(messageContent).subscribe()
    );
  };

  public getLink = (): string => {
    const link = `${AppConsts.BASE_URL}/api/catalog-url/${this.catalog.uuid}`;
    return link;
  };

  add(event: MatChipInputEvent): void {
    if (AppUtil.hasValue(this.sendCatalogForm.controls.phones.errors)) {
      if (this.sendCatalogForm.controls.phones.errors.phoneNotValid) {
        return;
      }
    }
    const value = (event.value || '').trim();

    if (value) {
      let phoneNum: string = this.addPrefixToNumber(value);
      this.phones.push(phoneNum);
    }

    event.input.value = '';
  }

  private addPrefixToNumber(phoneNum: string): string {
    const israeliNumberPrefix: string = `+972`;
    phoneNum = phoneNum.substring(1);
    phoneNum = `${israeliNumberPrefix}${phoneNum}`;

    return phoneNum;
  }

  remove(number: string): void {
    const index = this.phones.indexOf(number);

    if (index >= 0) {
      this.phones.splice(index, 1);
    }
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

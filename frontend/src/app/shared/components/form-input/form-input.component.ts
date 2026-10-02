import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { AppUtil } from 'src/app/common/app-util';
import isIsraeliIdValid from 'israeli-id-validator';

@Component({
  selector: 'app-form-input',
  template: ``,
})
export class FormInputComponent implements OnInit {
  imageToUpload: File = null;
  uploadedImageUrl = null;

  constructor() {}

  ngOnInit(): void {}

  public handleSelectedImage(files: FileList) {
    this.imageToUpload = files.item(0);
  }

  public isInputValidationFailed(inputControl: AbstractControl): boolean {
    if (!inputControl) {
      return false;
    }

    return inputControl.invalid && (inputControl.dirty || inputControl.touched);
  }

  public getInputBorderStyle(inputControl) {
    return this.isInputValidationFailed(inputControl) ? '2px solid red' : '';
  }

  public setInputBorderStyleInvalid(isInvalid) {
    return isInvalid === true ? '2px solid red' : '';
  }

  public checkPasswordsValidator: ValidatorFn = (
    group: FormGroup
  ): ValidationErrors | null => {
    const pass = group.controls.password.value;
    const confirmPass = group.controls.confirmPassword.value;
    return pass === confirmPass ? null : { notSame: true };
  };

  //TODO: use validatePassword
  public validatePassword = (inputControl: AbstractControl): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }
    
    if(!AppUtil.hasValue(inputControl.value)) { 
      return null;
    }

    const passwordRegex = new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$');


    if (!inputControl.value.match(passwordRegex)) {
      return { passwordNotValid: true };
    }

    return null;
  }

  public validateID = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }

    if (!isIsraeliIdValid(inputControl.value)) {
      return { idNotValid: true };
    }

    return null;
  };

  public checkDate = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }
    let dateNow: Date = new Date();

    let dateFromForm = new Date(inputControl.value);

    if (dateFromForm.getTime() <= dateNow.getTime()) {
      return { dateNotValid: true };
    }

    return null;
  };

  public validateGymName = (inputControl: AbstractControl): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }

    let gymNameRegx = new RegExp("^[a-zA-Z\u0590-\u05fe ]+[a-zA-Z0-9_ .]*$");

    

    if (!inputControl.value.match(gymNameRegx)) {
      return { gymNotValid: true };
    }

    return null;
  };

  public validateIsraeliPhoneNumber = (inputControl: AbstractControl): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }

    let gymPhoneRegx = new RegExp('^0(5[^7]|[2-4]|[8-9]|7[0-9])[0-9]{7}$');
   


    if (!inputControl.value.match(gymPhoneRegx)) {
      return { gymPhoneNotValid: true };
    }

    return null;
  };




 
  public vallidateAddress = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }

    let addresRegx = new RegExp('d{1,5}sw.s(\bw*\bs){1,2}w*.');

    if (!inputControl.value.match(addresRegx)) {
      return { addressNotValid: true };
    }

    return null;
  };

  public nonZero(control: AbstractControl): { [key: string]: any } {
    if (Number(control.value) <= 0) {
      return { nonZero: true };
    } else {
      return null;
    }
  }

  public validateMachineName = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }

    if(!AppUtil.hasValue(inputControl.value)) { 
      return null;
    }

    const regex = new RegExp('^[a-zA-Z][a-zA-Z0-9_ .]*$'); // first char must be character

    if (!inputControl.value.match(regex)) {
      return { machineNameNotValid: true };
    }
    return null;
  };

  public validateProductName = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }
    if(!AppUtil.hasValue(inputControl.value)) { 
      return null;
    }

    const regex = new RegExp('^[a-zA-Z\u0590-\u05fe ]+[a-zA-Z0-9_ .]*$'); // first char must be character

    if (!inputControl.value.match(regex)) {
      return { productNameNotValid: true };
    }
    return null;
  };

  public validateYear = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }
    if(!AppUtil.hasValue(inputControl.value)) { 
      return null;
    }
    if (isNaN(inputControl.value)) {
      const regex = new RegExp('^(19|20)d{2}$');
      if (!inputControl.value.match(regex)) {
        return { yearNotValid: true };
      }
    } else {
      const input = Number(inputControl.value);
      if (input < 1980 || input > 2030) {
        return { yearNotValid: true };
      }
    }

    return null;
  };

  public validateSerialNumber = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }
    if(!AppUtil.hasValue(inputControl.value)) { 
      return null;
    }
    const regex = new RegExp('^[a-zA-Z0-9_.-]*$');

    if (!inputControl.value.match(regex)) {
      return { serialNumberNotValid: true };
    }
    return null;
  };

  public validatePhoneNumber = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }
    

    if (inputControl.value === "") {
      return { empty: true };
    }

    if(!AppUtil.hasValue(inputControl.value)) {
      return null;
    }

    let phoneRegx = new RegExp('^[0][5][0|2|3|4|5|9]{1}[-]{0,1}[0-9]{7}$');

    if (!inputControl.value.match(phoneRegx)) {
      return { phoneNotValid: true };
    }

    return null;
  };

  public validatePrice = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl || !inputControl.value) {
      return null;
    }
    if (isNaN(inputControl.value)) {
      let priceRegx = new RegExp(
        '^[+]?([0-9]+(?:[.][0-9]*)?|.[0-9]+)(?:[eE][+-]?[0-9]+)?$'
      );

      if (!inputControl.value.match(priceRegx)) {
        return { priceNotValid: true };
      }
    } else {
      const input = Number(inputControl.value);
      if (input < 0) {
        return { priceNotValid: true };
      }
    }

    return null;
  };

  public validateProductCode = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }

    if(!AppUtil.hasValue(inputControl.value)) { 
      return null;
    }
    const regx = new RegExp('^[0-9A-Za-zs-]+$'); // accepts only numbers or chars

    if (!inputControl.value.match(regx)) {
      return { productCodeNotValid: true };
    }

    return null;
  };

  public validateName = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }

    if(!AppUtil.hasValue(inputControl.value)) {
      return null;
    }

    let nameRegx = new RegExp('^[A-Za-z\u0590-\u05fe ]+$');

    if (!inputControl.value.match(nameRegx)) {
      return { nameNotValid: true };
    }

    return null;
  };

  public validateBirthDay = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }

    let dateNow: Date = new Date();
    let dateFromForm = new Date(inputControl.value);

    if (dateFromForm.getTime() > dateNow.getTime()) {
      return { birthDayNotValid: true };
    }

    if (AppUtil.calculateAge(dateFromForm) < 16) {
      // if the age is less than 16
      return { ageUnder: true };
    }
    return null;
  };

  public validateQuantity = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }

    const regex = new RegExp('^+?(0|[1-9]d*)$');

    // TODO: cover number type input case
    if (!inputControl.value.match(regex)) {
      return { quantityNotValid: true };
    }

    return null;
  };

  public passwordsMatch(form: FormGroup): boolean {
    if (!form) {
      return false;
    }

    if (form.errors && form.errors['notSame']) {
      return false;
    }

    return true;
  }

  public checkPasswords: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    let pass = group.get('password').value;
    let confirmPass = group.get('confirmPassword').value;
    return pass === confirmPass ? null : { notSame: true };
  };

}

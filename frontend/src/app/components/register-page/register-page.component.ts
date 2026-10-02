import { Component, OnInit } from '@angular/core';
import { RegistrationService } from './../../services/registration.service';
import { AppUtil } from 'src/app/common/app-util';
import { User } from 'src/app/model/user';
@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css'],
})
export class RegisterPageComponent implements OnInit {
  constructor(private registerService: RegistrationService) {}

  ngOnInit(): void {}

  public register(signUpForm: any) {
    const user: User = {
      firstName: signUpForm.firstName,
      lastName: signUpForm.lastName,
      password: signUpForm.password,
      email: signUpForm.email,
      address: signUpForm.address,
      birthDay: signUpForm.birthDay,
      phone: signUpForm.phone,
    } as User;

    this.registerService.register(user).subscribe(
      (res) => {
        console.log(res);
      },
      (err: Error) => {
        console.log(JSON.stringify(err));
        AppUtil.showError(err);
      }
    );
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { AppUtil } from 'src/app/common/app-util';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/model/user';
import { AccessDeniedError } from 'src/app/exceptions/access-denied-error';
import { NotFoundError } from 'src/app/exceptions/not-found-error';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent extends FormInputComponent implements OnInit {
  showSpinner: boolean = false;
  hide: boolean = true;
  invalidLogin: boolean;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(3)]], // TODO: change in production
  });

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private fb: FormBuilder
  ) {
    super();
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.setCurrentUser();
      if (this.authService.isAdmin()) {
        this.router.navigate(['admin']);
      } else {
        this.router.navigateByUrl('/home');
      }
    } else {
      this.router.navigate(['login']);
    }
  }

  handleEnterKeyPress(event) {
    if (this.loginForm.valid) {
      return true;
    }
    const tagName = event.target.tagName.toLowerCase();
    if (tagName !== 'textarea') {
      return false;
    }
  }

  public login() {
    let user: User = this.loginForm.value as User;
    this.showSpinner = true;

    this.authService.login(user).subscribe(
      (res) => {
       
        this.authService.persistTokenFromResponse(res);
        if (this.authService.isAdmin()) {
          this.router.navigateByUrl('/admin');
        } else {
          this.router.navigateByUrl('/home');
        }
      },
      (err: Error) => {
        this.showSpinner = false;
        // if (err instanceof NotFoundError) {
        //   this.invalidLogin = true;
        //   return;
        // }
        AppUtil.showError(err);
      }
    );
  }
}

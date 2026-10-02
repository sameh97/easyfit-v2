import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { User } from 'src/app/model/user';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UsersService } from 'src/app/services/users-service/users.service';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { EditProfileUserComponent } from '../edit-profile-user/edit-profile-user.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  currentUser: User = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthenticationService,
    private navigationService: NavigationHelperService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.currentUser$
        .pipe(
          switchMap((userFromSubject) => {
            return this.usersService.getByEmail(userFromSubject.email);
          })
        )
        .subscribe((user: User) => {
          this.currentUser = user;
        })
    );
  }

  public openUpdateUserDialog() {
    this.subscriptions.push(
      this.navigationService
        .openDialog(EditProfileUserComponent, null, this.currentUser, true)
        .subscribe()
    );
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

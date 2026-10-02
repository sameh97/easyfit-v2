import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { Gym } from 'src/app/model/gym';
import { User } from 'src/app/model/user';
import { GymsService } from 'src/app/services/gyms-service/gyms.service';
import { UsersService } from 'src/app/services/users-service/users.service';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { AddUserComponent } from '../add-user/add-user.component';
import { UpdateUserComponent } from '../update-user/update-user.component';

@Component({
  selector: 'app-users-page',
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.css'],
})
export class UsersPageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //TODO: check the other inputs sort button issue
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<User>;
  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>();
  gyms: Gym[] = [];
  users: User[];
  columns: string[] = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'birthDay',
    'address',
    'gymName',
    'update',
    'delete',
  ];
  private subscriptions: Subscription[] = [];

  constructor(
    private usersService: UsersService,
    private gymsService: GymsService,
    private navigationService: NavigationHelperService
  ) {}

  ngOnInit(): void {
    this.getAll();
  }

  private getAll() {
    this.subscriptions.push(
      this.usersService.getAll().subscribe((users) => {
        this.users = users;
        this.dataSource = new MatTableDataSource<User>(this.users);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      })
    );

    this.subscriptions.push(
      this.gymsService.getAll().subscribe((gyms) => {
        this.gyms = gyms;
        // TODO: make api that retreves one gym by its id
      })
    );
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  };

  public showGymName(user: User): string {
    const gym: Gym = this.gyms.find(({ id }) => id === user.gymId);
    if (!AppUtil.hasValue(gym)) {
      return '';
    }
    return gym.name;
  }

  public openCreateUserDialog() {
    this.subscriptions.push(
      this.navigationService
        .openDialog(AddUserComponent, null, null, true)
        .subscribe()
    );
  }

  public openUpdateUserDialog(user: User) {
    this.subscriptions.push(
      this.navigationService
        .openDialog(UpdateUserComponent, null, user, true)
        .subscribe()
    );
  }

  public delete = (user: User) => {
    const message = `Are you sure you want to delete the user with the following email:
    ${user.email} ?`;

    this.navigationService
      .openYesNoDialogNoCallback(message, 500)
      .subscribe((res) => {
        if (res) {
          this.usersService
            .delete(Number(user.id)) // TODO: make user id type a number
            .pipe(
              tap((res) => {
                this.getAll();
              })
            )
            .subscribe(
              (res) => {
                console.log(res);
              },
              (err) => {
                AppUtil.showError(err);
              }
            );
        }
      });
  };

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

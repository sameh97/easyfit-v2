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
import { GymsService } from 'src/app/services/gyms-service/gyms.service';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { CreateGymComponent } from '../create-gym/create-gym.component';
import { UpdateGymComponent } from '../update-gym/update-gym.component';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.css'],
})
export class AdminPageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //TODO: check the other inputs sort button issue
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Gym>;
  dataSource: MatTableDataSource<Gym> = new MatTableDataSource<Gym>();

  gyms: Gym[];
  columns: string[] = ['name', 'phone', 'address', 'update', 'delete'];

  private subscriptions: Subscription[] = [];

  constructor(
    private gymService: GymsService,
    private navigationService: NavigationHelperService
  ) {}

  ngOnInit(): void {
    this.getAll();
  }

  private getAll() {
    this.subscriptions.push(
      this.gymService.getAll().subscribe((gyms) => {
        this.gyms = gyms;
        this.dataSource = new MatTableDataSource<Gym>(this.gyms);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      })
    );
  }

  public openCreateGymDialog() {
    this.subscriptions.push(
      this.navigationService
        .openDialog(CreateGymComponent, null, null, true)
        .subscribe()
    );
  }

  public delete = (gym: Gym) => {
    const message = `Are you sure you want to delete the gym with the following name:
    ${gym.name} ?`;

    this.navigationService
      .openYesNoDialogNoCallback(message, 500)
      .subscribe((res) => {
        if (res) {
          this.gymService.delete(gym.id).subscribe(
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

  public openUpdateGymDialog(gym: Gym) {
    this.subscriptions.push(
      this.navigationService
        .openDialog(UpdateGymComponent, null, gym, true)
        .subscribe()
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

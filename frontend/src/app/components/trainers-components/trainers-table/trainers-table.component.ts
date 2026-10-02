import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { Trainer } from 'src/app/model/trainer';
import { TrainersService } from './../../../services/trainers-service/trainers.service';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { Subscription } from 'rxjs';
import { UpdateTrainerComponent } from './../update-trainer/update-trainer.component';
@Component({
  selector: 'app-trainers-table',
  templateUrl: './trainers-table.component.html',
  styleUrls: ['./trainers-table.component.css'],
})
export class TrainersTableComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //TODO: check the other inputs sort button issue
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Trainer>;
  dataSource: MatTableDataSource<Trainer> = new MatTableDataSource<Trainer>();

  trainers: Trainer[];
  columns: string[] = [
    'FirstName',
    'LastName',
    'phone',
    'birthday',
    'email',
    'address',
    'Status',
    'JoinDate',
    'certificationDate',
    'Image',
    'update',
    'delete',
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private trainerService: TrainersService,
    private navigationService: NavigationHelperService
  ) {}

  private getAll() {
    this.trainerService.getAll().subscribe((trainers) => {
      this.trainers = trainers;
      this.dataSource = new MatTableDataSource<Trainer>(this.trainers);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    });
  }

  ngOnInit(): void {
    this.getAll();
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }

  public getActiveDisplayString(trainer: Trainer): string {
    if (!trainer) {
      return '';
    }
    return trainer.isActive ? 'Active' : 'Not Active';
  }

  public delete = (id: number, trainer: Trainer) => {
    const message = `Are you sure you want to delete the trainer with the following name:
    ${trainer.firstName} ${trainer.lastName} ?`;

    this.navigationService
      .openYesNoDialogNoCallback(message, 500)
      .subscribe((res) => {
        if (res) {
          this.trainerService.delete(id).subscribe(
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

  public openUpdateMemberDialog(trainer: Trainer) {
    this.subscriptions.push(
      this.navigationService
        .openDialog(UpdateTrainerComponent, null, trainer, true)
        .subscribe()
    );
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  };

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}

import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { GroupTraining } from 'src/app/model/group-training';
import { Member } from 'src/app/model/member';
import { Trainer } from 'src/app/model/trainer';
import { TrainersService } from 'src/app/services/trainers-service/trainers.service';

@Component({
  selector: 'app-show-single-training',
  templateUrl: './show-single-training.component.html',
  styleUrls: ['./show-single-training.component.css'],
})
export class ShowSingleTrainingComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //TODO: check the other inputs sort button issue
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Member>;
  dataSource: MatTableDataSource<Member> = new MatTableDataSource<Member>();

  members: Member[];
  columns: string[] = [
    'FirstName',
    'LastName',
    'phone',
    'birthday',
    'email',
    'address',
    'Status',
    'JoinDate',
    'endOfMembershipDate',
    'Image',
  ];

  trainer: Trainer = null;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public groupTraining: GroupTraining,
    private trainersService: TrainersService
  ) {}

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<Member>(
      this.groupTraining.members
    );
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this.subscriptions.push(
      this.trainersService
        .getById(this.groupTraining.trainerId)
        .subscribe((trainer) => {
          this.trainer = trainer;
        })
    );
  }

  public getActiveDisplayString(member: Member): string {
    if (!member) {
      return '';
    }
    return member.isActive ? 'Active' : 'Not Active';
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}

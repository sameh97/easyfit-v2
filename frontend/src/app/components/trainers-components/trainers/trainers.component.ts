import {
  AfterViewChecked,
  Component,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { Subscription } from 'rxjs';
import { AddTrainerComponent } from './../add-trainer/add-trainer.component';
import { AppUtil } from 'src/app/common/app-util';
import { TrainersTableComponent } from './../trainers-table/trainers-table.component';
@Component({
  selector: 'app-trainers-page',
  templateUrl: './trainers.component.html',
  styleUrls: ['./trainers.component.css'],
})
export class TrainersPageComponent implements OnDestroy {
  private subscriptions: Subscription[] = [];
  row: number;
  @ViewChild(TrainersTableComponent)
  trainersTableComponent: TrainersTableComponent;
  /** Based on the screen size, switch from standard to one column per row */
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [{ title: 'Trainers table', cols: 1, rows: 2 }];
      }

      return [{ title: 'Trainers table', cols: 2, rows: 2 }];
    })
  );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private navigationService: NavigationHelperService
  ) {}


  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }

  public openCreateTrainerDialog() {
    this.subscriptions.push(
      this.navigationService
        .openDialog(AddTrainerComponent, null, null, true)
        .subscribe()
    );
  }
}

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
import { AddMemberComponent } from '../add-member/add-member.component';
import { AppUtil } from 'src/app/common/app-util';
import { MembersTableComponent } from '../members-table/members-table.component';

@Component({
  selector: 'app-members-page',
  templateUrl: './members-page.component.html',
  styleUrls: ['./members-page.component.css'],
})
export class MembersPageComponent implements OnDestroy {
  private subscriptions: Subscription[] = [];

  @ViewChild(MembersTableComponent)
  membersTableComponent: MembersTableComponent;
  /** Based on the screen size, switch from standard to one column per row */
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [{ title: 'Members table', cols: 1, rows: 2 }];
      }

      return [{ title: 'Members table', cols: 2, rows: 2 }];
    })
  );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private navigationService: NavigationHelperService
  ) {}

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }

  public openCreateMemberDialog() {
    this.subscriptions.push(
      this.navigationService
        .openDialog(AddMemberComponent, null, null, true)
        .subscribe()
    );
  }
}

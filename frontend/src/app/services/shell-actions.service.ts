import { Injectable } from '@angular/core';
import { ComponentType } from '@angular/cdk/portal';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NavigationHelperService } from '../shared/services/navigation-helper.service';
import { AddMemberComponent } from '../components/members-components/add-member/add-member.component';
import { UpdateMemberComponent } from '../components/members-components/update-member/update-member.component';
import { AddTrainerComponent } from '../components/trainers-components/add-trainer/add-trainer.component';
import { AddGroupTrainingComponent } from '../components/group-training-components/add-group-training/add-group-training.component';
import { AddProductComponent } from '../components/products-components/add-product/add-product.component';
import { SellProductComponent } from '../components/products-components/sell-product/sell-product.component';
import { AddScheduledJobPageComponent } from '../components/scheduler-components/add-scheduled-job-page/add-scheduled-job-page.component';
import { Member } from '../model/member';
import { Product } from '../model/product';
import { DashboardService } from './dashboard-service/dashboard.service';

/** Actions that open an existing create dialog without extra input. */
export type CreateAction = 'add-member' | 'add-trainer' | 'new-class' | 'add-product' | 'schedule-maintenance';

const CREATE_DIALOGS: Record<CreateAction, ComponentType<object>> = {
  'add-member': AddMemberComponent,
  'add-trainer': AddTrainerComponent,
  'new-class': AddGroupTrainingComponent,
  'add-product': AddProductComponent,
  'schedule-maintenance': AddScheduledJobPageComponent,
};

/**
 * Opens the existing (Material) dialogs from the shell, palette and dashboard,
 * with the same options the owning pages use. Each method emits once when the dialog closes,
 * after which the dashboard summary (KPIs, gym card counts) is refreshed.
 */
@Injectable({
  providedIn: 'root',
})
export class ShellActionsService {
  constructor(private navigationService: NavigationHelperService, private dashboardService: DashboardService) {}

  create(action: CreateAction): Observable<unknown> {
    return this.afterClose(this.navigationService.openDialog(CREATE_DIALOGS[action], null, null, true));
  }

  editMember(member: Member): Observable<unknown> {
    return this.afterClose(this.navigationService.openDialog(UpdateMemberComponent, null, member, true));
  }

  sellProduct(product: Product): Observable<unknown> {
    return this.afterClose(this.navigationService.openDialog(SellProductComponent, null, product, true));
  }

  private afterClose(closed: Observable<unknown>): Observable<unknown> {
    return closed.pipe(tap(() => this.dashboardService.load().subscribe({ error: () => undefined })));
  }
}

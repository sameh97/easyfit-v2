import { Injectable } from '@angular/core';
import { ComponentType } from '@angular/cdk/portal';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NavigationHelperService } from '../shared/services/navigation-helper.service';
import { MemberFormComponent, MemberFormData } from '../components/members-components/member-form/member-form.component';
import { TrainerFormComponent, TrainerFormData } from '../components/trainers-components/trainer-form/trainer-form.component';
import { Trainer } from '../model/trainer';
import { ClassFormComponent, ClassFormData } from '../components/classes/class-form/class-form.component';
import { GroupTraining } from '../model/group-training';
import { MachineFormComponent, MachineFormData } from '../components/machines/machine-form/machine-form.component';
import { Machine } from '../model/machine';
import { JobFormComponent, JobFormData } from '../components/maintenance/job-form/job-form.component';
import { ScheduledJob } from '../model/scheduled-job';
import { AddGroupTrainingComponent } from '../components/group-training-components/add-group-training/add-group-training.component';
import { AddProductComponent } from '../components/products-components/add-product/add-product.component';
import { SellProductComponent } from '../components/products-components/sell-product/sell-product.component';
import { AddScheduledJobPageComponent } from '../components/scheduler-components/add-scheduled-job-page/add-scheduled-job-page.component';
import { Member } from '../model/member';
import { Product } from '../model/product';
import { DashboardService } from './dashboard-service/dashboard.service';
import { SidePanelService } from '../shared/ui/overlay/side-panel.service';
import { LanguageService } from './language.service';

/** Actions that open an existing create dialog without extra input. */
export type CreateAction = 'add-member' | 'add-trainer' | 'new-class' | 'add-product' | 'schedule-maintenance';

/** Legacy Material create dialogs; members and trainers use Studio side panels instead. */
const CREATE_DIALOGS: Record<Exclude<CreateAction, 'add-member' | 'add-trainer'>, ComponentType<object>> = {
  'new-class': AddGroupTrainingComponent,
  'add-product': AddProductComponent,
  'schedule-maintenance': AddScheduledJobPageComponent,
};

/**
 * Opens the create/edit UIs from the shell, palette and dashboard: Studio side panels for
 * members and trainers, the existing (Material) dialogs for pages not redesigned yet,
 * with the same options the owning pages use. Each method emits once when the dialog closes,
 * after which the dashboard summary (KPIs, gym card counts) is refreshed.
 */
@Injectable({
  providedIn: 'root',
})
export class ShellActionsService {
  constructor(
    private navigationService: NavigationHelperService,
    private dashboardService: DashboardService,
    private sidePanel: SidePanelService,
    private language: LanguageService
  ) {}

  create(action: CreateAction): Observable<unknown> {
    if (action === 'add-member') {
      return this.addMember();
    }
    if (action === 'add-trainer') {
      return this.addTrainer();
    }
    return this.afterClose(this.navigationService.openDialog(CREATE_DIALOGS[action], null, null, true));
  }

  /** Studio "Add member" side panel. Emits the new member, or undefined when cancelled. */
  addMember(): Observable<Member | undefined> {
    return this.openMemberForm(null);
  }

  /** Studio "Edit member" side panel. Emits the saved member, or undefined when cancelled. */
  editMember(member: Member): Observable<Member | undefined> {
    return this.openMemberForm(member);
  }

  /** Studio "Add trainer" side panel. Emits the new trainer, or undefined when cancelled. */
  addTrainer(): Observable<Trainer | undefined> {
    return this.openTrainerForm(null);
  }

  editTrainer(trainer: Trainer): Observable<Trainer | undefined> {
    return this.openTrainerForm(trainer);
  }

  /** Studio "New class" side panel, prefilled with `day`. Emits the new class, or undefined when cancelled. */
  addClass(day: Date | null = null): Observable<GroupTraining | undefined> {
    return this.openClassForm(null, day);
  }

  editClass(training: GroupTraining): Observable<GroupTraining | undefined> {
    return this.openClassForm(training, null);
  }

  private openClassForm(training: GroupTraining | null, day: Date | null): Observable<GroupTraining | undefined> {
    return this.sidePanel
      .open<ClassFormComponent, ClassFormData, GroupTraining>(ClassFormComponent, {
        data: { training, day },
        ariaLabel: this.language.t(training ? 'classes.form.editTitle' : 'classes.form.addTitle'),
      })
      .afterClosed$.pipe(tap(() => this.dashboardService.load().subscribe({ error: () => undefined })));
  }

  private openTrainerForm(trainer: Trainer | null): Observable<Trainer | undefined> {
    return this.sidePanel.open<TrainerFormComponent, TrainerFormData, Trainer>(TrainerFormComponent, {
      data: { trainer },
      ariaLabel: this.language.t(trainer ? 'trainers.form.editTitle' : 'trainers.form.addTitle'),
    }).afterClosed$;
  }

  private openMemberForm(member: Member | null): Observable<Member | undefined> {
    return this.sidePanel.open<MemberFormComponent, MemberFormData, Member>(MemberFormComponent, {
      data: { member },
      ariaLabel: this.language.t(member ? 'members.form.editTitle' : 'members.form.addTitle'),
    }).afterClosed$;
  }

  /** Studio "Add machine" side panel. Emits the new machine, or undefined when cancelled. */
  addMachine(): Observable<Machine | undefined> {
    return this.openMachineForm(null, false);
  }

  /** `hasMaintenance`: jobs or alerts are linked to its serial number (the form warns before it changes). */
  editMachine(machine: Machine, hasMaintenance: boolean): Observable<Machine | undefined> {
    return this.openMachineForm(machine, hasMaintenance);
  }

  private openMachineForm(machine: Machine | null, hasMaintenance: boolean): Observable<Machine | undefined> {
    return this.sidePanel.open<MachineFormComponent, MachineFormData, Machine>(MachineFormComponent, {
      data: { machine, hasMaintenance },
      ariaLabel: this.language.t(machine ? 'machines.form.editTitle' : 'machines.form.addTitle'),
    }).afterClosed$;
  }

  /** Studio "Schedule maintenance" side panel, optionally for one machine. Emits the new job, or undefined. */
  scheduleMaintenance(machineSerialNumber: string | null = null): Observable<ScheduledJob | undefined> {
    return this.openJobForm(null, machineSerialNumber);
  }

  editJob(job: ScheduledJob): Observable<ScheduledJob | undefined> {
    return this.openJobForm(job, null);
  }

  private openJobForm(job: ScheduledJob | null, machineSerialNumber: string | null): Observable<ScheduledJob | undefined> {
    return this.sidePanel.open<JobFormComponent, JobFormData, ScheduledJob>(JobFormComponent, {
      data: { job, machineSerialNumber },
      ariaLabel: this.language.t(job ? 'maintenance.form.editTitle' : 'maintenance.form.addTitle'),
    }).afterClosed$;
  }

  sellProduct(product: Product): Observable<unknown> {
    return this.afterClose(this.navigationService.openDialog(SellProductComponent, null, product, true));
  }

  private afterClose(closed: Observable<unknown>): Observable<unknown> {
    return closed.pipe(tap(() => this.dashboardService.load().subscribe({ error: () => undefined })));
  }
}

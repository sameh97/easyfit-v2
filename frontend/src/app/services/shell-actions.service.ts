import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MemberFormComponent, MemberFormData } from '../components/members-components/member-form/member-form.component';
import { TrainerFormComponent, TrainerFormData } from '../components/trainers-components/trainer-form/trainer-form.component';
import { Trainer } from '../model/trainer';
import { ClassFormComponent, ClassFormData } from '../components/classes/class-form/class-form.component';
import { GroupTraining } from '../model/group-training';
import { MachineFormComponent, MachineFormData } from '../components/machines/machine-form/machine-form.component';
import { Machine } from '../model/machine';
import { JobFormComponent, JobFormData } from '../components/maintenance/job-form/job-form.component';
import { ScheduledJob } from '../model/scheduled-job';
import { ProductFormComponent, ProductFormData } from '../components/products/product-form/product-form.component';
import { SellFormComponent, SellFormData } from '../components/products/sell-form/sell-form.component';
import { Bill } from '../model/bill';
import { CatalogFormComponent, CatalogFormData } from '../components/catalogs/catalog-form/catalog-form.component';
import { CatalogShareComponent, CatalogShareData } from '../components/catalogs/catalog-share/catalog-share.component';
import { Catalog } from '../model/catalog';
import { ProfileFormComponent, ProfileFormData } from '../components/profile/profile-form/profile-form.component';
import { User } from '../model/user';
import { GymFormComponent, GymFormData } from '../components/admin/gym-form/gym-form.component';
import { UserFormComponent, UserFormData } from '../components/admin/user-form/user-form.component';
import { Gym } from '../model/gym';
import { Member } from '../model/member';
import { Product } from '../model/product';
import { DashboardService } from './dashboard-service/dashboard.service';
import { SidePanelService } from '../shared/ui/overlay/side-panel.service';
import { LanguageService } from './language.service';

/** Actions that open a create panel without extra input. */
export type CreateAction = 'add-member' | 'add-trainer' | 'new-class' | 'add-product' | 'schedule-maintenance' | 'add-gym' | 'add-user';

/**
 * Opens the Studio create/edit side panels from the shell, palette, dashboard and pages
 * (members, trainers, classes, machines, maintenance jobs, products, sales). Each method emits
 * once when the panel closes: the saved record, or undefined when cancelled.
 */
@Injectable({
  providedIn: 'root',
})
export class ShellActionsService {
  constructor(
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
    if (action === 'new-class') {
      return this.addClass();
    }
    if (action === 'schedule-maintenance') {
      return this.scheduleMaintenance();
    }
    if (action === 'add-gym') {
      return this.addGym();
    }
    if (action === 'add-user') {
      return this.addUser();
    }
    return this.addProduct();
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
    return this.openMachineForm(null);
  }

  /** Changing the serial number also moves the machine's jobs and alerts (backend). */
  editMachine(machine: Machine): Observable<Machine | undefined> {
    return this.openMachineForm(machine);
  }

  private openMachineForm(machine: Machine | null): Observable<Machine | undefined> {
    return this.sidePanel.open<MachineFormComponent, MachineFormData, Machine>(MachineFormComponent, {
      data: { machine },
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

  /** Studio "Add product" side panel. Emits the new product, or undefined when cancelled. */
  addProduct(): Observable<Product | undefined> {
    return this.openProductForm(null);
  }

  editProduct(product: Product): Observable<Product | undefined> {
    return this.openProductForm(product);
  }

  private openProductForm(product: Product | null): Observable<Product | undefined> {
    return this.sidePanel
      .open<ProductFormComponent, ProductFormData, Product>(ProductFormComponent, {
        data: { product },
        ariaLabel: this.language.t(product ? 'products.form.editTitle' : 'products.form.addTitle'),
      })
      .afterClosed$.pipe(tap(() => this.dashboardService.load().subscribe({ error: () => undefined })));
  }

  /** Studio "Sell product" side panel. Emits the new sale, or undefined when cancelled. */
  sellProduct(product: Product): Observable<Bill | undefined> {
    return this.sidePanel.open<SellFormComponent, SellFormData, Bill>(SellFormComponent, {
      data: { product },
      ariaLabel: this.language.t('sales.form.title'),
    }).afterClosed$;
  }

  /** Studio "New catalog" side panel. Emits the new catalog, or undefined when cancelled. */
  addCatalog(): Observable<Catalog | undefined> {
    return this.openCatalogForm(null);
  }

  editCatalog(catalog: Catalog): Observable<Catalog | undefined> {
    return this.openCatalogForm(catalog);
  }

  private openCatalogForm(catalog: Catalog | null): Observable<Catalog | undefined> {
    return this.sidePanel.open<CatalogFormComponent, CatalogFormData, Catalog>(CatalogFormComponent, {
      data: { catalog },
      ariaLabel: this.language.t(catalog ? 'catalogs.form.editTitle' : 'catalogs.form.addTitle'),
    }).afterClosed$;
  }

  /** Share catalog panel: link, message and WhatsApp per member. */
  shareCatalog(catalog: Catalog): Observable<void | undefined> {
    return this.sidePanel.open<CatalogShareComponent, CatalogShareData, void>(CatalogShareComponent, {
      data: { catalog },
      ariaLabel: this.language.t('catalogs.share.title'),
    }).afterClosed$;
  }

  /** Studio "Edit profile" side panel for the signed-in user. */
  editProfile(user: User): Observable<User | undefined> {
    return this.sidePanel.open<ProfileFormComponent, ProfileFormData, User>(ProfileFormComponent, {
      data: { user },
      ariaLabel: this.language.t('profile.form.title'),
    }).afterClosed$;
  }

  /** Admin: "Add gym" side panel. */
  addGym(): Observable<Gym | undefined> {
    return this.openGymForm(null);
  }

  editGym(gym: Gym): Observable<Gym | undefined> {
    return this.openGymForm(gym);
  }

  private openGymForm(gym: Gym | null): Observable<Gym | undefined> {
    return this.sidePanel.open<GymFormComponent, GymFormData, Gym>(GymFormComponent, {
      data: { gym },
      ariaLabel: this.language.t(gym ? 'admin.gyms.form.editTitle' : 'admin.gyms.form.addTitle'),
    }).afterClosed$;
  }

  /** Admin: "Add user" side panel. */
  addUser(): Observable<User | undefined> {
    return this.openUserForm(null);
  }

  editUser(user: User): Observable<User | undefined> {
    return this.openUserForm(user);
  }

  private openUserForm(user: User | null): Observable<User | undefined> {
    return this.sidePanel.open<UserFormComponent, UserFormData, User>(UserFormComponent, {
      data: { user },
      ariaLabel: this.language.t(user ? 'admin.users.form.editTitle' : 'admin.users.form.addTitle'),
    }).afterClosed$;
  }
}

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule, CanActivate } from '@angular/router';

import { AuthGuardService as AuthGuard } from './services/auth-guard.service';
import { RegisterPageComponent } from './components/register-page/register-page.component';

import { SearchfilterPipe } from './searchfilter.pipe';
import { AddMemberComponent } from './components/members-components/add-member/add-member.component';
import { UpdateMemberComponent } from './components/members-components/update-member/update-member.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { SharedModule } from './shared/shared.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MachinesComponent } from './components/machines-components/machines/machines.component';
import { CreateMachineComponent } from './components/machines-components/create-machine/create-machine.component';
import { EditMachineComponent } from './components/machines-components/edit-machine/edit-machine.component';
import { MachinesTableComponent } from './components/machines-components/machines-table/machines-table.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { NavComponent } from './components/nav/nav.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { HomeComponent } from './components/home/home.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MembersChartComponent } from './components/members-chart/members-chart.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MembersPageComponent } from './components/members-components/members-page/members-page.component';
import { MembersTableComponent } from './components/members-components/members-table/members-table.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatRadioModule } from '@angular/material/radio';
import { SchedulerPageComponent } from './components/scheduler-components/scheduler-page/scheduler-page.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MachineDetailsComponent } from './components/scheduler-components/machine-details/machine-details.component';
import { UpdateScheduledJobComponent } from './components/scheduler-components/update-scheduled-job/update-scheduled-job.component';
import { MatDividerModule } from '@angular/material/divider';
import {
  NgxMatDatetimePickerModule,
  NgxMatTimepickerModule,
  NgxMatNativeDateModule,
} from '@angular-material-components/datetime-picker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AddScheduledJobPageComponent } from './components/scheduler-components/add-scheduled-job-page/add-scheduled-job-page.component';
import { ProductsPageComponent } from './components/products-components/products-page/products-page.component';
import { AddProductComponent } from './components/products-components/add-product/add-product.component';
import { UpdateProductPageComponent } from './components/products-components/update-product-page/update-product-page.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MachineNotificationsComponent } from './components/machines-components/machine-notifications/machine-notifications.component';
import { MatInputModule } from '@angular/material/input';
import { CatalogPageComponent } from './components/catalog-components/catalog-page/catalog-page.component';
import { AddCatalogComponent } from './components/catalog-components/add-catalog/add-catalog.component';
import { UpdateCatalogComponent } from './components/catalog-components/update-catalog/update-catalog.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { SendCatalogComponent } from './components/catalog-components/send-catalog/send-catalog.component';
import { MatChipsModule } from '@angular/material/chips';
import { SellProductComponent } from './components/products-components/sell-product/sell-product.component';
import { CreateGymComponent } from './components/registration-components/create-gym/create-gym.component';
import { AdminPageComponent } from './components/registration-components/admin-page/admin-page.component';
import { AdminNavComponent } from './components/registration-components/admin-nav/admin-nav.component';
import { UpdateGymComponent } from './components/registration-components/update-gym/update-gym.component';
import { UsersPageComponent } from './components/registration-components/users-components/users-page/users-page.component';
import { AddUserComponent } from './components/registration-components/users-components/add-user/add-user.component';
import { UpdateUserComponent } from './components/registration-components/users-components/update-user/update-user.component';
import { NotificationsDropdownComponent } from './components/notifications/notifications-dropdown.component';
import { MatBadgeModule } from '@angular/material/badge';
import { AddTrainerComponent } from './components/trainers-components/add-trainer/add-trainer.component';
import { TrainersPageComponent } from './components/trainers-components/trainers/trainers.component';
import { UpdateTrainerComponent } from './components/trainers-components/update-trainer/update-trainer.component';
import { TrainersTableComponent } from './components/trainers-components/trainers-table/trainers-table.component';
import { DoughnutChartComponent } from './components/members-components/doughnut-chart/doughnut-chart.component';
import { DisplayTrainingsComponent } from './components/group-training-components/display-trainings/display-trainings.component';
import { AddGroupTrainingComponent } from './components/group-training-components/add-group-training/add-group-training.component';
import { EditGroupTrainingComponent } from './components/group-training-components/edit-group-training/edit-group-training.component';
import { ShowSingleTrainingComponent } from './components/group-training-components/show-single-training/show-single-training.component';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { UserProfileComponent } from './components/profile-components/user-profile/user-profile.component';
import { EditProfileUserComponent } from './components/profile-components/edit-profile-user/edit-profile-user.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductsChartComponent } from './components/products-components/products-chart/products-chart.component';
import { IncomeChartComponent } from './components/products-components/income-chart/income-chart.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  {
    path: 'members',
    component: MembersPageComponent,
    canActivate: [AuthGuard],
  },
  { path: 'machines', component: MachinesComponent, canActivate: [AuthGuard] },
  {
    path: 'products',
    component: ProductsPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'trainers',
    component: TrainersPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'scheduler',
    component: SchedulerPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'catalog',
    component: CatalogPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'admin',
    component: AdminPageComponent,
    canActivate: [AuthGuard], //TODO: add admin guard
  },
  {
    path: 'users',
    component: UsersPageComponent,
    canActivate: [AuthGuard], //TODO: add admin guard
  },
  {
    path: 'group-trainings',
    component: DisplayTrainingsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [AuthGuard],
  },

  //TODO: make 404 page
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterPageComponent,
    SearchfilterPipe,
    AddMemberComponent,
    UpdateMemberComponent,
    MachinesComponent,
    CreateMachineComponent,
    EditMachineComponent,
    MachinesTableComponent,
    NavComponent,
    HomeComponent,
    MembersChartComponent,
    MembersPageComponent,
    MembersTableComponent,
    SchedulerPageComponent,
    MachineDetailsComponent,
    UpdateScheduledJobComponent,
    AddScheduledJobPageComponent,
    ProductsPageComponent,
    AddProductComponent,
    UpdateProductPageComponent,
    MachineNotificationsComponent,
    CatalogPageComponent,
    AddCatalogComponent,
    UpdateCatalogComponent,
    SendCatalogComponent,
    SellProductComponent,
    CreateGymComponent,
    AdminPageComponent,
    AdminNavComponent,
    UpdateGymComponent,
    UsersPageComponent,
    AddUserComponent,
    UpdateUserComponent,
    NotificationsDropdownComponent,
    AddTrainerComponent,
    TrainersPageComponent,
    UpdateTrainerComponent,
    TrainersTableComponent,
    DoughnutChartComponent,
    DisplayTrainingsComponent,
    AddGroupTrainingComponent,
    EditGroupTrainingComponent,
    ShowSingleTrainingComponent,
    UserProfileComponent,
    EditProfileUserComponent,
    ProductsChartComponent,
    IncomeChartComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    FlexLayoutModule,
    MatRadioModule,
    ScrollingModule,
    MatDividerModule,
    MatSlideToggleModule,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule,
    MatTabsModule,
    MatInputModule,
    NgMultiSelectDropDownModule.forRoot(),
    MatChipsModule,
    MatBadgeModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    MatSnackBarModule,
  ],

  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

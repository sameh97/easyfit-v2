import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { LanguageService } from './services/language.service';
import { I18nModule } from './shared/i18n/i18n.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule, CanActivate } from '@angular/router';

import { AuthGuardService as AuthGuard } from './services/auth-guard.service';
import { RegisterPageComponent } from './components/register-page/register-page.component';

import { SearchfilterPipe } from './searchfilter.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogConfig, MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { SharedModule } from './shared/shared.module';
import { UiModule } from './shared/ui/ui.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { NavComponent } from './components/nav/nav.component';
import { CommandPaletteComponent } from './components/shell/command-palette/command-palette.component';
import { AiPanelComponent } from './components/shell/ai-panel/ai-panel.component';
import { LayoutModule } from '@angular/cdk/layout';
import { A11yModule } from '@angular/cdk/a11y';
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
import { MemberDetailComponent } from './components/members-components/member-detail/member-detail.component';
import { MemberFormComponent } from './components/members-components/member-form/member-form.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatRadioModule } from '@angular/material/radio';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatDividerModule } from '@angular/material/divider';
import {
  NgxMatDatetimePickerModule,
  NgxMatTimepickerModule,
  NgxMatNativeDateModule,
} from '@angular-material-components/datetime-picker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ProductsPageComponent } from './components/products-components/products-page/products-page.component';
import { AddProductComponent } from './components/products-components/add-product/add-product.component';
import { UpdateProductPageComponent } from './components/products-components/update-product-page/update-product-page.component';
import { MatTabsModule } from '@angular/material/tabs';
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
import { NotificationsPanelComponent } from './components/shell/notifications-panel/notifications-panel.component';
import { ClassesPageComponent } from './components/classes/classes-page/classes-page.component';
import { ClassDetailComponent } from './components/classes/class-detail/class-detail.component';
import { ClassFormComponent } from './components/classes/class-form/class-form.component';
import { MachinesPageComponent } from './components/machines/machines-page/machines-page.component';
import { MachineDetailComponent } from './components/machines/machine-detail/machine-detail.component';
import { MachineFormComponent } from './components/machines/machine-form/machine-form.component';
import { JobTypePillComponent, MachineBadgeComponent } from './components/machines/machine-badges.component';
import { MaintenancePageComponent } from './components/maintenance/maintenance-page/maintenance-page.component';
import { JobFormComponent } from './components/maintenance/job-form/job-form.component';
import { ProductsPageComponent as StudioProductsPageComponent } from './components/products/products-page/products-page.component';
import { ProductDetailComponent } from './components/products/product-detail/product-detail.component';
import { ProductFormComponent } from './components/products/product-form/product-form.component';
import { SellFormComponent } from './components/products/sell-form/sell-form.component';
import { SalesTabComponent } from './components/products/sales-tab/sales-tab.component';
import { MatBadgeModule } from '@angular/material/badge';
import { TrainersPageComponent } from './components/trainers-components/trainers/trainers.component';
import { TrainerDetailComponent } from './components/trainers-components/trainer-detail/trainer-detail.component';
import { TrainerFormComponent } from './components/trainers-components/trainer-form/trainer-form.component';
import { DoughnutChartComponent } from './components/members-components/doughnut-chart/doughnut-chart.component';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { UserProfileComponent } from './components/profile-components/user-profile/user-profile.component';
import { EditProfileUserComponent } from './components/profile-components/edit-profile-user/edit-profile-user.component';
import { MatSnackBarConfig, MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { ProductsChartComponent } from './components/products-components/products-chart/products-chart.component';
import { IncomeChartComponent } from './components/products-components/income-chart/income-chart.component';

export function createTranslateLoader(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

/** Load the saved language before the first render, so nothing flashes in the wrong language. */
export function initLanguage(language: LanguageService): () => Promise<void> {
  return () => language.init();
}

// `data: { studio: true }` marks redesigned pages: they follow the UI language and direction.
// Every other page is pinned to English, left to right, until its phase (redesign.md §7.8).
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, data: { studio: true } },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard], data: { studio: true } },
  {
    path: 'members',
    component: MembersPageComponent,
    canActivate: [AuthGuard],
    data: { studio: true },
  },
  { path: 'machines', component: MachinesPageComponent, canActivate: [AuthGuard], data: { studio: true } },
  {
    path: 'products',
    component: StudioProductsPageComponent,
    canActivate: [AuthGuard],
    data: { studio: true },
  },
  {
    path: 'trainers',
    component: TrainersPageComponent,
    canActivate: [AuthGuard],
    data: { studio: true },
  },
  {
    path: 'scheduler',
    component: MaintenancePageComponent,
    canActivate: [AuthGuard],
    data: { studio: true },
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
    component: ClassesPageComponent,
    canActivate: [AuthGuard],
    data: { studio: true },
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
    NavComponent,
    CommandPaletteComponent,
    AiPanelComponent,
    HomeComponent,
    MembersChartComponent,
    MembersPageComponent,
    MemberDetailComponent,
    MemberFormComponent,
    ProductsPageComponent,
    AddProductComponent,
    UpdateProductPageComponent,
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
    NotificationsPanelComponent,
    ClassesPageComponent,
    ClassDetailComponent,
    ClassFormComponent,
    MachinesPageComponent,
    MachineDetailComponent,
    MachineFormComponent,
    MachineBadgeComponent,
    JobTypePillComponent,
    MaintenancePageComponent,
    JobFormComponent,
    StudioProductsPageComponent,
    ProductDetailComponent,
    ProductFormComponent,
    SellFormComponent,
    SalesTabComponent,
    TrainersPageComponent,
    TrainerDetailComponent,
    TrainerFormComponent,
    DoughnutChartComponent,
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
    UiModule,
    I18nModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: { provide: TranslateLoader, useFactory: createTranslateLoader, deps: [HttpClient] },
    }),
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    LayoutModule,
    A11yModule,
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

  providers: [
    { provide: APP_INITIALIZER, useFactory: initLanguage, deps: [LanguageService], multi: true },
    // Legacy Material dialogs and snackbars attach to <body>, outside the page's dir="ltr" wrapper;
    // pin them to LTR so they don't inherit <html dir="rtl"> in Hebrew. Studio overlays set their own.
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { ...new MatDialogConfig(), direction: 'ltr' } },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { ...new MatSnackBarConfig(), direction: 'ltr' } },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

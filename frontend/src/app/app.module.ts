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
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { MatChipsModule } from '@angular/material/chips';
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
import { ProductsPageComponent } from './components/products/products-page/products-page.component';
import { ProductDetailComponent } from './components/products/product-detail/product-detail.component';
import { ProductFormComponent } from './components/products/product-form/product-form.component';
import { SellFormComponent } from './components/products/sell-form/sell-form.component';
import { SalesTabComponent } from './components/products/sales-tab/sales-tab.component';
import { CatalogsPageComponent } from './components/catalogs/catalogs-page/catalogs-page.component';
import { CatalogFormComponent } from './components/catalogs/catalog-form/catalog-form.component';
import { CatalogShareComponent } from './components/catalogs/catalog-share/catalog-share.component';
import { ProfilePageComponent } from './components/profile/profile-page/profile-page.component';
import { ProfileFormComponent } from './components/profile/profile-form/profile-form.component';
import { GymsPageComponent } from './components/admin/gyms-page/gyms-page.component';
import { UsersPageComponent } from './components/admin/users-page/users-page.component';
import { GymFormComponent } from './components/admin/gym-form/gym-form.component';
import { UserFormComponent } from './components/admin/user-form/user-form.component';
import { AdminGuardService as AdminGuard } from './services/admin-guard.service';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { MatBadgeModule } from '@angular/material/badge';
import { TrainersPageComponent } from './components/trainers-components/trainers/trainers.component';
import { TrainerDetailComponent } from './components/trainers-components/trainer-detail/trainer-detail.component';
import { TrainerFormComponent } from './components/trainers-components/trainer-form/trainer-form.component';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { MatSnackBarConfig, MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

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
    component: ProductsPageComponent,
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
    component: CatalogsPageComponent,
    canActivate: [AuthGuard],
    data: { studio: true },
  },
  {
    path: 'admin',
    component: GymsPageComponent,
    canActivate: [AuthGuard, AdminGuard],
    data: { studio: true },
  },
  {
    path: 'users',
    component: UsersPageComponent,
    canActivate: [AuthGuard, AdminGuard],
    data: { studio: true },
  },
  {
    path: 'group-trainings',
    component: ClassesPageComponent,
    canActivate: [AuthGuard],
    data: { studio: true },
  },
  {
    path: 'profile',
    component: ProfilePageComponent,
    canActivate: [AuthGuard],
    data: { studio: true },
  },

  // Any other URL: the 404 page (§5.12), inside the shell when signed in.
  { path: '**', component: NotFoundComponent, data: { studio: true } },
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SearchfilterPipe,
    NavComponent,
    CommandPaletteComponent,
    AiPanelComponent,
    HomeComponent,
    MembersPageComponent,
    MemberDetailComponent,
    MemberFormComponent,
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
    ProductsPageComponent,
    ProductDetailComponent,
    ProductFormComponent,
    SellFormComponent,
    SalesTabComponent,
    CatalogsPageComponent,
    CatalogFormComponent,
    CatalogShareComponent,
    ProfilePageComponent,
    ProfileFormComponent,
    GymsPageComponent,
    UsersPageComponent,
    GymFormComponent,
    UserFormComponent,
    NotFoundComponent,
    TrainersPageComponent,
    TrainerDetailComponent,
    TrainerFormComponent,
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

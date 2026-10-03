import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon/icon.component';
import { ButtonComponent } from './button/button.component';
import { IconButtonComponent } from './icon-button/icon-button.component';
import { CardComponent } from './card/card.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { StatusPillComponent } from './status-pill/status-pill.component';
import { AvatarComponent } from './avatar/avatar.component';
import { KpiCardComponent } from './kpi-card/kpi-card.component';
import { SegmentedControlComponent } from './segmented-control/segmented-control.component';
import { EmptyStateComponent } from './empty-state/empty-state.component';
import { SkeletonComponent } from './skeleton/skeleton.component';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { I18nModule } from '../i18n/i18n.module';
import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { ConfirmDialogComponent } from './overlay/confirm-dialog.component';
import { PanelLayoutComponent } from './overlay/panel-layout.component';
import { SidePanelComponent } from './overlay/side-panel.component';
import { ToastHostComponent } from './overlay/toast-host.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FieldErrorComponent } from './form/field-error.component';
import { TextFieldComponent } from './form/text-field.component';
import { TextAreaComponent } from './form/text-area.component';
import { SelectComponent } from './form/select.component';
import { DateFieldComponent } from './form/date-field.component';
import { SegmentedFieldComponent } from './form/segmented-field.component';
import { ImageUploadComponent } from './form/image-upload.component';
import { FormSectionComponent } from './form/form-section.component';

const COMPONENTS = [
  IconComponent,
  ButtonComponent,
  IconButtonComponent,
  CardComponent,
  PageHeaderComponent,
  StatusPillComponent,
  AvatarComponent,
  KpiCardComponent,
  SegmentedControlComponent,
  EmptyStateComponent,
  SkeletonComponent,
  BarChartComponent,
  ConfirmDialogComponent,
  PanelLayoutComponent,
  SidePanelComponent,
  ToastHostComponent,
  FieldErrorComponent,
  TextFieldComponent,
  TextAreaComponent,
  SelectComponent,
  DateFieldComponent,
  SegmentedFieldComponent,
  ImageUploadComponent,
  FormSectionComponent,
];

/** Studio component kit (redesign.md §7.10 step 2–3). Tailwind only, no Material. */
@NgModule({
  declarations: COMPONENTS,
  imports: [CommonModule, I18nModule, A11yModule, OverlayModule, PortalModule, ReactiveFormsModule, MatDatepickerModule],
  exports: [...COMPONENTS, I18nModule],
})
export class UiModule {}

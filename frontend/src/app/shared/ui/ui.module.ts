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
];

/** Studio component kit (redesign.md §7.10 step 2–3). Tailwind only, no Material. */
@NgModule({
  declarations: COMPONENTS,
  imports: [CommonModule, I18nModule],
  exports: COMPONENTS,
})
export class UiModule {}

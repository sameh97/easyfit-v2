import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon/icon.component';

const COMPONENTS = [IconComponent];

/** Studio component kit (redesign.md §7.10 step 2–3). Tailwind only, no Material. */
@NgModule({
  declarations: COMPONENTS,
  imports: [CommonModule],
  exports: COMPONENTS,
})
export class UiModule {}

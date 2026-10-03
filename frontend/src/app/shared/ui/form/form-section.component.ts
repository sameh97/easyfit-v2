import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Uppercase section label followed by its fields, inside a side-panel form. */
@Component({
  selector: 'app-form-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-4" [attr.aria-label]="title">
      <h3 class="pt-1 text-[11px] font-bold uppercase tracking-label text-ink-4">{{ title }}</h3>
      <ng-content></ng-content>
    </section>
  `,
  styles: [':host { display: block; }'],
})
export class FormSectionComponent {
  @Input() title: string = '';
}

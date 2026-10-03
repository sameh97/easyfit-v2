import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LocalDatePipe } from './local-date.pipe';
import { PluralPipe } from './plural.pipe';

/** Translation pipes for Studio components: `translate`, `localDate`, `plural`. */
@NgModule({
  declarations: [LocalDatePipe, PluralPipe],
  imports: [TranslateModule],
  exports: [TranslateModule, LocalDatePipe, PluralPipe],
})
export class I18nModule {}

import { Direction, Directionality } from '@angular/cdk/bidi';
import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LanguageService, TextDir } from 'src/app/services/language.service';

/**
 * CDK Directionality that follows the UI language at runtime. The root Directionality only
 * reads <html dir> once, so Studio components that open overlays (the datepicker inside a
 * side panel, for example) provide this one to get the current direction.
 */
@Injectable()
export class LanguageDirectionality implements Directionality, OnDestroy {
  readonly change: EventEmitter<Direction> = new EventEmitter<Direction>();
  private current: TextDir;
  private readonly subscription: Subscription;

  constructor(language: LanguageService) {
    this.current = language.dir;
    this.subscription = language.dir$.subscribe((dir: TextDir) => {
      if (dir !== this.current) {
        this.current = dir;
        this.change.emit(dir);
      }
    });
  }

  get value(): Direction {
    return this.current;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.change.complete();
  }
}

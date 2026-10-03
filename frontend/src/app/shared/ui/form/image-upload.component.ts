import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { newFieldId } from './field';

const ACCEPTED_TYPES: readonly string[] = ['image/png', 'image/jpeg'];

/**
 * Photo picker for forms: a 72px preview (dashed circle when empty), "Upload photo" and "Remove".
 * It only picks the file; the form uploads it with the existing FileUploadService on save.
 */
@Component({
  selector: 'app-image-upload',
  template: `
    <div class="flex items-center gap-4">
      <span
        class="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-ink-4"
        [ngClass]="previewUrl ? '' : 'border-2 border-dashed border-line-strong'"
      >
        <img *ngIf="previewUrl; else emptyIcon" [src]="previewUrl" alt="" class="h-full w-full object-cover" />
        <ng-template #emptyIcon><app-icon name="camera" [size]="24"></app-icon></ng-template>
      </span>
      <div class="flex flex-col items-start gap-1.5">
        <div class="flex flex-wrap gap-2">
          <button appButton variant="secondary" size="sm" type="button" icon="upload" (click)="fileInput.click()" [attr.aria-describedby]="id + '-help'">
            {{ (previewUrl ? 'common.form.changePhoto' : 'common.form.uploadPhoto') | translate }}
          </button>
          <button *ngIf="previewUrl" appButton variant="ghost" size="sm" type="button" (click)="remove()">
            {{ 'common.form.removePhoto' | translate }}
          </button>
        </div>
        <span [id]="id + '-help'" class="text-xs" [ngClass]="typeError ? 'font-semibold text-danger' : 'text-ink-3'">
          {{ (typeError ? 'validation.imageType' : 'common.form.photoHelp') | translate }}
        </span>
      </div>
      <input #fileInput type="file" class="sr-only" tabindex="-1" aria-hidden="true" accept=".png,.jpg,.jpeg" (change)="onFile(fileInput)" />
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class ImageUploadComponent implements OnDestroy {
  /** Photo already saved (S3 URL), shown until a new file is picked. */
  @Input() set currentUrl(url: string | null) {
    if (!this.objectUrl) {
      this.previewUrl = url;
    }
  }
  /** The picked file, or null when the photo is removed. */
  @Output() fileChange: EventEmitter<File | null> = new EventEmitter<File | null>();

  readonly id: string = newFieldId('photo');
  previewUrl: string | null = null;
  typeError: boolean = false;
  private objectUrl: string | null = null;

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  onFile(input: HTMLInputElement): void {
    const file: File | undefined = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.typeError = true;
      return;
    }
    this.typeError = false;
    this.revoke();
    this.objectUrl = URL.createObjectURL(file);
    this.previewUrl = this.objectUrl;
    this.fileChange.emit(file);
  }

  remove(): void {
    this.revoke();
    this.previewUrl = null;
    this.typeError = false;
    this.fileChange.emit(null);
  }

  private revoke(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  ngOnDestroy(): void {
    this.revoke();
  }
}

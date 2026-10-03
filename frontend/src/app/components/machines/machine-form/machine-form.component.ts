import { Component, ElementRef, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppConsts } from 'src/app/common/consts';
import { Machine } from 'src/app/model/machine';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { LanguageService } from 'src/app/services/language.service';
import { MachinesService } from 'src/app/services/machines-service/machines.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { validateAndFocus } from 'src/app/shared/ui/form/field';
import { CloseGuard, SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';

export interface MachineFormData {
  /** null = a new machine. */
  machine: Machine | null;
}

/**
 * Add / edit machine side panel (§5.5): name, serial number (LTR), description, production year,
 * price (LTR) and photo. Validation rules are exactly the legacy create/edit dialogs' ones.
 */
@Component({
  selector: 'app-machine-form',
  templateUrl: './machine-form.component.html',
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class MachineFormComponent extends FormInputComponent implements CloseGuard, OnDestroy {
  readonly original: Machine | null;
  readonly isEdit: boolean;

  readonly name: FormControl;
  readonly serialNumber: FormControl;
  readonly description: FormControl;
  readonly productionYear: FormControl;
  readonly price: FormControl;
  readonly form: FormGroup;

  currentPhoto: string | null;
  saving: boolean = false;
  /** undefined = unchanged, null = removed, File = new photo. */
  private photo: File | null | undefined = undefined;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: MachineFormData,
    public ref: SidePanelRef<Machine>,
    private host: ElementRef<HTMLElement>,
    private machines: MachinesService,
    private fileUpload: FileUploadService,
    private toast: ToastService,
    private language: LanguageService
  ) {
    super();
    this.original = data?.machine ?? null;
    this.isEdit = !!this.original;
    const m: Machine | null = this.original;

    // Same validators as the legacy create/edit machine dialogs.
    this.name = new FormControl(m?.name ?? '', [Validators.required, this.validateMachineName]);
    this.serialNumber = new FormControl(m?.serialNumber ?? '', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(50),
      this.validateSerialNumber,
    ]);
    this.description = new FormControl(m?.description ?? '', [Validators.required]);
    this.productionYear = new FormControl(m ? String(m.productionYear ?? '') : '', [Validators.required, this.validateYear]);
    this.price = new FormControl(m ? String(m.price ?? '') : '', [Validators.required, Validators.min(0), this.validatePrice]);
    this.form = new FormGroup({
      name: this.name,
      serialNumber: this.serialNumber,
      description: this.description,
      productionYear: this.productionYear,
      price: this.price,
    });
    this.currentPhoto = realPhotoUrl(m?.imgUrl);
  }

  get title(): string {
    return this.language.t(this.isEdit ? 'machines.form.editTitle' : 'machines.form.addTitle');
  }

  isDirty(): boolean {
    return this.form.dirty || this.photo !== undefined;
  }

  onPhoto(file: File | null): void {
    this.photo = file;
  }

  save(): void {
    if (this.saving || !validateAndFocus(this.form, this.host.nativeElement)) {
      return;
    }
    this.saving = true;
    const name: string = String(this.name.value).trim();
    const upload$: Observable<string | null> = this.photo ? this.fileUpload.uploadImage(this.photo, null) : of(null);
    this.subscriptions.push(
      upload$
        .pipe(
          switchMap((uploaded: string | null) => {
            const machine: Machine = this.buildMachine(uploaded);
            return this.isEdit ? this.machines.update(machine) : (this.machines.create(machine) as Observable<Machine>);
          })
        )
        .subscribe(
          (saved: Machine) => {
            this.toast.success(this.language.t(this.isEdit ? 'machines.toast.updated' : 'machines.toast.added', { name }));
            this.ref.close(saved);
          },
          (error: unknown) => {
            this.saving = false;
            const message: string = error instanceof Error ? error.message : String(error);
            const duplicate: boolean = /already exists/i.test(message);
            this.toast.error(
              this.language.t(duplicate ? 'machines.toast.duplicateSerial' : 'machines.toast.saveError', {
                name,
                serial: String(this.serialNumber.value).trim(),
              })
            );
          }
        )
    );
  }

  private buildMachine(uploadedUrl: string | null): Machine {
    // No photo → the placeholder image the legacy form saved (shown as an icon tile in Studio).
    let imgUrl: string = uploadedUrl ?? this.original?.imgUrl ?? AppConsts.MACHINE_DEFULT_IMAGE;
    if (this.photo === null) {
      imgUrl = AppConsts.MACHINE_DEFULT_IMAGE;
    }
    const machine: Machine = Object.assign(new Machine(), this.original ?? {});
    return Object.assign(machine, {
      name: String(this.name.value).trim(),
      serialNumber: String(this.serialNumber.value).trim(),
      description: String(this.description.value).trim(),
      productionYear: Number(this.productionYear.value),
      price: Number(this.price.value),
      imgUrl,
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

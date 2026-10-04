import { Component, ElementRef, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { Gym } from 'src/app/model/gym';
import { GymsService } from 'src/app/services/gyms-service/gyms.service';
import { LanguageService } from 'src/app/services/language.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { validateAndFocus } from 'src/app/shared/ui/form/field';
import { CloseGuard, SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';

export interface GymFormData {
  /** null = a new gym. */
  gym: Gym | null;
}

/** Add / edit gym side panel (§5.11): name, phone (LTR), address. Rules as the legacy gym dialogs. */
@Component({
  selector: 'app-gym-form',
  templateUrl: './gym-form.component.html',
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class GymFormComponent extends FormInputComponent implements CloseGuard, OnDestroy {
  readonly original: Gym | null;
  readonly isEdit: boolean;
  readonly name: FormControl;
  readonly phone: FormControl;
  readonly address: FormControl;
  readonly form: FormGroup;
  saving: boolean = false;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: GymFormData,
    public ref: SidePanelRef<Gym>,
    private host: ElementRef<HTMLElement>,
    private gyms: GymsService,
    private toast: ToastService,
    private language: LanguageService
  ) {
    super();
    this.original = data?.gym ?? null;
    this.isEdit = !!this.original;
    this.name = new FormControl(this.original?.name ?? '', [Validators.required, this.validateGymName]);
    this.phone = new FormControl(this.original?.phone ?? '', [Validators.required, this.validateIsraeliPhoneNumber]);
    this.address = new FormControl(this.original?.address ?? '', [Validators.required]);
    this.form = new FormGroup({ name: this.name, phone: this.phone, address: this.address });
  }

  get title(): string {
    return this.language.t(this.isEdit ? 'admin.gyms.form.editTitle' : 'admin.gyms.form.addTitle');
  }

  isDirty(): boolean {
    return this.form.dirty;
  }

  save(): void {
    if (this.saving || !validateAndFocus(this.form, this.host.nativeElement)) {
      return;
    }
    this.saving = true;
    const name: string = String(this.name.value).trim();
    const gym: Gym = Object.assign(new Gym(), this.original ?? {}, {
      name,
      phone: String(this.phone.value).trim(),
      address: String(this.address.value).trim(),
    });
    const save$: Observable<Gym> = this.isEdit ? this.gyms.update(gym) : this.gyms.create(gym);
    this.subscriptions.push(
      save$.subscribe(
        (saved: Gym) => {
          this.toast.success(this.language.t(this.isEdit ? 'admin.gyms.toast.updated' : 'admin.gyms.toast.added', { name }));
          this.ref.close(saved);
        },
        () => {
          this.saving = false;
          this.toast.error(this.language.t('admin.gyms.toast.saveError', { name }));
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

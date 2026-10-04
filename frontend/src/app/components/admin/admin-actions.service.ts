import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Gym } from 'src/app/model/gym';
import { User } from 'src/app/model/user';
import { GymsService } from 'src/app/services/gyms-service/gyms.service';
import { LanguageService } from 'src/app/services/language.service';
import { UsersService } from 'src/app/services/users-service/users.service';
import { ConfirmDialogService } from 'src/app/shared/ui/overlay/confirm-dialog.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';

/** Deletes gyms and users through the existing admin endpoints, with confirm + toasts. */
@Injectable({
  providedIn: 'root',
})
export class AdminActionsService {
  constructor(
    private gyms: GymsService,
    private users: UsersService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private language: LanguageService
  ) {}

  deleteGym(gym: Gym, userCount: number): Observable<boolean> {
    const name: string = gym.name;
    return this.confirm(
      this.language.t('admin.gyms.confirm.deleteTitle', { name }),
      userCount ? this.language.tCount('admin.gyms.confirm.deleteBodyUsers', userCount) : this.language.t('admin.gyms.confirm.deleteBody')
    ).pipe(
      switchMap((ok: boolean) => (ok ? this.gyms.delete(gym.id).pipe(map(() => true)) : of(false))),
      map((done: boolean) => {
        if (done) {
          this.toast.success(this.language.t('admin.gyms.toast.deleted', { name }));
        }
        return done;
      }),
      catchError(() => {
        this.toast.error(this.language.t('admin.gyms.toast.deleteError', { name }));
        return of(false);
      })
    );
  }

  deleteUser(user: User): Observable<boolean> {
    const name: string = `${user.firstName} ${user.lastName}`.trim();
    return this.confirm(this.language.t('admin.users.confirm.deleteTitle', { name }), this.language.t('admin.users.confirm.deleteBody')).pipe(
      switchMap((ok: boolean) => (ok ? this.users.delete(Number(user.id)).pipe(map(() => true)) : of(false))),
      map((done: boolean) => {
        if (done) {
          this.toast.success(this.language.t('admin.users.toast.deleted', { name }));
        }
        return done;
      }),
      catchError(() => {
        this.toast.error(this.language.t('admin.users.toast.deleteError', { name }));
        return of(false);
      })
    );
  }

  private confirm(title: string, message: string): Observable<boolean> {
    return this.confirmDialog.confirm({ title, message, confirmLabel: this.language.t('common.actions.delete'), tone: 'danger' });
  }
}

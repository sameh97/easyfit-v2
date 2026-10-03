import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Member } from 'src/app/model/member';
import { DashboardService } from 'src/app/services/dashboard-service/dashboard.service';
import { LanguageService } from 'src/app/services/language.service';
import { MembersService } from 'src/app/services/members-service/members.service';
import { toIsoDate } from 'src/app/shared/ui/form/field';
import { ConfirmDialogService } from 'src/app/shared/ui/overlay/confirm-dialog.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { fullName, renewedEnd } from './member-status';

/**
 * Renew, activate/deactivate and delete, shared by the members table and the detail panel.
 * Everything goes through the existing endpoints; each emits the updated member (or null on
 * cancel/failure) and shows a toast. Dashboard numbers refresh after every change.
 */
@Injectable({
  providedIn: 'root',
})
export class MemberActionsService {
  constructor(
    private members: MembersService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private language: LanguageService,
    private dashboard: DashboardService
  ) {}

  /** Extends from the later of today and the current end date, re-activates, and offers Undo. */
  renew(member: Member, months: number): Observable<Member | null> {
    const newEnd: Date = renewedEnd(member, months);
    const before: Pick<Member, 'endOfMembershipDate' | 'isActive'> = {
      endOfMembershipDate: member.endOfMembershipDate,
      isActive: member.isActive,
    };
    return this.save({ ...member, endOfMembershipDate: toIsoDate(newEnd) ?? '', isActive: true }, 'members.toast.renewError').pipe(
      tap((updated: Member | null) => {
        if (updated) {
          this.toast.success(this.language.t('members.toast.renewed', { date: this.language.date(newEnd) }), {
            label: this.language.t('common.actions.undo'),
            run: () => this.undoRenew(updated, before),
          });
        }
      })
    );
  }

  /** Deactivating asks first (§7.4); activating doesn't. */
  setActive(member: Member, active: boolean): Observable<Member | null> {
    const name: string = fullName(member);
    const confirmed$: Observable<boolean> = active
      ? of(true)
      : this.confirmDialog.confirm({
          title: this.language.t('members.confirm.deactivateTitle', { name }),
          message: this.language.t('members.confirm.deactivateBody'),
          confirmLabel: this.language.t('members.actions.deactivate'),
          tone: 'danger',
        });
    return confirmed$.pipe(
      switchMap((ok: boolean) => (ok ? this.save({ ...member, isActive: active }, 'members.toast.saveError') : of(null))),
      tap((updated: Member | null) => {
        if (updated) {
          this.toast.success(this.language.t(active ? 'members.toast.activated' : 'members.toast.deactivated', { name }));
        }
      })
    );
  }

  /** Emits true when the member was deleted. */
  delete(member: Member): Observable<boolean> {
    const name: string = fullName(member);
    return this.confirmDialog
      .confirm({
        title: this.language.t('members.confirm.deleteTitle', { name }),
        message: this.language.t('members.confirm.deleteBody'),
        confirmLabel: this.language.t('common.actions.delete'),
        tone: 'danger',
      })
      .pipe(
        switchMap((ok: boolean) => {
          if (!ok) {
            return of(false);
          }
          return this.members.delete(member.id).pipe(
            map(() => {
              this.toast.success(this.language.t('members.toast.deleted', { name }));
              this.refreshDashboard();
              return true;
            }),
            catchError(() => {
              this.toast.error(this.language.t('members.toast.deleteError', { name }));
              return of(false);
            })
          );
        })
      );
  }

  private undoRenew(member: Member, before: Pick<Member, 'endOfMembershipDate' | 'isActive'>): void {
    this.save({ ...member, ...before }, 'members.toast.undoError').subscribe((restored: Member | null) => {
      if (restored) {
        this.toast.success(this.language.t('members.toast.renewUndone'));
      }
    });
  }

  private save(member: Member, errorKey: string): Observable<Member | null> {
    return this.members.update(member).pipe(
      tap(() => this.refreshDashboard()),
      catchError(() => {
        this.toast.error(this.language.t(errorKey, { name: fullName(member) }));
        return of(null);
      })
    );
  }

  private refreshDashboard(): void {
    this.dashboard.load().subscribe({ error: () => undefined });
  }
}

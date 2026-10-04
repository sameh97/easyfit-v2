import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Trainer } from 'src/app/model/trainer';
import { User } from 'src/app/model/user';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { LanguageService } from 'src/app/services/language.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { ShellContext, ShellContextService } from 'src/app/services/shell-context.service';
import { TrainersService } from 'src/app/services/trainers-service/trainers.service';
import { initialsOf } from 'src/app/shared/ui/avatar/avatar.component';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';

const ROLE_KEYS: Record<number, string> = { 1: 'shell.user.roles.manager', 2: 'shell.user.roles.admin' };

/**
 * Profile and settings (redesign.md §5.9): the signed-in user's details with Edit, the gym (read
 * only: gym details are the admin's), and preferences (language).
 */
@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  user: User | null = null;
  context: ShellContext = { gymName: null, memberCount: null, maintenanceDue: null };
  trainerCount: number | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private auth: AuthenticationService,
    private shellContext: ShellContextService,
    private trainers: TrainersService,
    private shellActions: ShellActionsService,
    public language: LanguageService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.auth.currentUser$.subscribe((user: User | null) => (this.user = user)),
      this.shellContext.context$.subscribe((context: ShellContext) => (this.context = context)),
      this.trainers
        .getAll()
        .pipe(take(1))
        .subscribe(
          (trainers: Trainer[] | null) => (this.trainerCount = trainers ? trainers.length : null),
          () => (this.trainerCount = null)
        )
    );
  }

  get name(): string {
    return this.user ? `${this.user.firstName ?? ''} ${this.user.lastName ?? ''}`.trim() : '';
  }

  get photo(): string | null {
    return realPhotoUrl(this.user?.imageURL);
  }

  /** "Manager · Power House TLV · since Mar 2024" */
  get summary(): string {
    if (!this.user) {
      return '';
    }
    const parts: string[] = [];
    const role: string | undefined = ROLE_KEYS[this.user.roleId];
    if (role) {
      parts.push(this.language.t(role));
    }
    if (this.context.gymName) {
      parts.push(this.context.gymName);
    }
    if (this.user.createdAt) {
      parts.push(this.language.t('profile.since', { date: `${this.language.date(this.user.createdAt, 'monthShort')} ${new Date(this.user.createdAt).getFullYear()}` }));
    }
    return parts.join(' · ');
  }

  get gymInitials(): string {
    const words: string[] = (this.context.gymName ?? '').trim().split(/\s+/).slice(0, 2);
    return initialsOf(words.join(' ')) || 'G';
  }

  /** "486 members · 6 trainers" */
  get gymCounts(): string {
    const parts: string[] = [];
    if (this.context.memberCount !== null) {
      parts.push(this.language.tCount('shell.gym.members', this.context.memberCount));
    }
    if (this.trainerCount !== null) {
      parts.push(this.language.tCount('trainers.page.count', this.trainerCount));
    }
    return parts.join(' · ');
  }

  edit(): void {
    if (this.user) {
      this.shellActions.editProfile(this.user).subscribe();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

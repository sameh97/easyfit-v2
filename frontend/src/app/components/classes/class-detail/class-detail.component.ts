import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { GroupTraining } from 'src/app/model/group-training';
import { Member } from 'src/app/model/member';
import { Trainer } from 'src/app/model/trainer';
import { LanguageService } from 'src/app/services/language.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { PillStatus } from 'src/app/shared/ui/status-pill/status-pill.component';
import { fullName, memberStatus, STATUS_PILL } from '../../members-components/member-status';
import { ClassActionsService } from '../class-actions.service';
import { classNote, classTitle } from '../class-schedule';

/** Participants shown before "Show all". */
const PARTICIPANTS_PREVIEW: number = 8;

/** Class detail panel (§5.4): when, description, trainer (opens the trainer), participants (open the member), Edit and Delete. */
@Component({
  selector: 'app-class-detail',
  templateUrl: './class-detail.component.html',
  styles: [':host { display: flex; flex-direction: column; min-height: 0; }'],
})
export class ClassDetailComponent implements OnChanges {
  @Input() training!: GroupTraining;
  /** null when the trainer is unknown (deleted). */
  @Input() trainer: Trainer | null = null;
  @Output() deleted: EventEmitter<void> = new EventEmitter<void>();

  showAll: boolean = false;

  constructor(
    private shellActions: ShellActionsService,
    private actions: ClassActionsService,
    private menu: MenuService,
    public language: LanguageService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const previous: GroupTraining | undefined = changes.training?.previousValue;
    if (previous && previous.id !== this.training.id) {
      this.showAll = false;
    }
  }

  get title(): string {
    return classTitle(this.training.description);
  }

  get note(): string {
    return classNote(this.training.description);
  }

  /** "Wed, 30 Sep · 19:00" */
  get when(): string {
    return `${this.language.date(this.training.startTime, 'shortDay')} · ${this.language.date(this.training.startTime, 'time')}`;
  }

  get participants(): Member[] {
    return [...(this.training.members ?? [])].sort((a: Member, b: Member) => fullName(a).localeCompare(fullName(b)));
  }

  get visibleParticipants(): Member[] {
    return this.showAll ? this.participants : this.participants.slice(0, PARTICIPANTS_PREVIEW);
  }

  get hasMore(): boolean {
    return this.participants.length > PARTICIPANTS_PREVIEW;
  }

  name(person: { firstName: string; lastName: string }): string {
    return fullName(person);
  }

  photo(person: Member | Trainer): string | null {
    return realPhotoUrl(person.imageURL);
  }

  pill(member: Member): PillStatus {
    return STATUS_PILL[memberStatus(member)];
  }

  edit(): void {
    this.shellActions.editClass(this.training).subscribe();
  }

  openMoreMenu(event: Event): void {
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [{ id: 'delete', label: this.language.t('common.actions.delete'), icon: 'trash', tone: 'danger' }];
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'delete') {
        this.actions.delete(this.training).subscribe((done: boolean) => done && this.deleted.emit());
      }
    });
  }

  trackById(_index: number, member: Member): number {
    return member.id;
  }
}

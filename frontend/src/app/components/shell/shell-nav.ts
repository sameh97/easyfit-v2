import { IconName } from 'src/app/shared/ui/icon/icons';

export type NavBadge = 'members' | 'maintenance';

export interface NavItem {
  /** Translation key (shell.nav.items.*). */
  labelKey: string;
  path: string;
  icon: IconName;
  badge?: NavBadge;
}

export interface NavGroup {
  /** Translation key (shell.nav.groups.*). */
  labelKey: string;
  items: NavItem[];
}

/** Sidebar groups (redesign.md §7.3). Also the "Pages" group of the command palette. */
export const NAV_GROUPS: NavGroup[] = [
  { labelKey: 'shell.nav.groups.overview', items: [{ labelKey: 'shell.nav.items.dashboard', path: '/home', icon: 'home' }] },
  {
    labelKey: 'shell.nav.groups.people',
    items: [
      { labelKey: 'shell.nav.items.members', path: '/members', icon: 'users', badge: 'members' },
      { labelKey: 'shell.nav.items.trainers', path: '/trainers', icon: 'user-check' },
      { labelKey: 'shell.nav.items.classes', path: '/group-trainings', icon: 'calendar' },
    ],
  },
  {
    labelKey: 'shell.nav.groups.equipment',
    items: [
      { labelKey: 'shell.nav.items.machines', path: '/machines', icon: 'dumbbell' },
      { labelKey: 'shell.nav.items.maintenance', path: '/scheduler', icon: 'wrench', badge: 'maintenance' },
    ],
  },
  {
    labelKey: 'shell.nav.groups.shop',
    items: [
      { labelKey: 'shell.nav.items.products', path: '/products', icon: 'shopping-bag' },
      { labelKey: 'shell.nav.items.catalogs', path: '/catalog', icon: 'send' },
    ],
  },
];

export const PROFILE_PAGE: NavItem = { labelKey: 'shell.nav.items.profile', path: '/profile', icon: 'settings' };

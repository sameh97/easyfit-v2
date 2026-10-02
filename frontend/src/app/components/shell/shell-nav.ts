import { IconName } from 'src/app/shared/ui/icon/icons';

export type NavBadge = 'members' | 'maintenance';

export interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  badge?: NavBadge;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Sidebar groups (redesign.md §7.3). Also the "Pages" group of the command palette. */
export const NAV_GROUPS: NavGroup[] = [
  { label: 'Overview', items: [{ label: 'Dashboard', path: '/home', icon: 'home' }] },
  {
    label: 'People',
    items: [
      { label: 'Members', path: '/members', icon: 'users', badge: 'members' },
      { label: 'Trainers', path: '/trainers', icon: 'user-check' },
      { label: 'Classes', path: '/group-trainings', icon: 'calendar' },
    ],
  },
  {
    label: 'Equipment',
    items: [
      { label: 'Machines', path: '/machines', icon: 'dumbbell' },
      { label: 'Maintenance', path: '/scheduler', icon: 'wrench', badge: 'maintenance' },
    ],
  },
  {
    label: 'Shop',
    items: [
      { label: 'Products', path: '/products', icon: 'shopping-bag' },
      { label: 'Catalogs', path: '/catalog', icon: 'send' },
    ],
  },
];

export const PROFILE_PAGE: NavItem = { label: 'Profile & settings', path: '/profile', icon: 'settings' };

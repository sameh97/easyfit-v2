// Lucide-style outline icons (24px grid, 2px stroke, round caps).
// Paths follow lucide.dev (ISC licence). Add new icons here; IconName is
// derived from the map so a typo in a template fails the build.

export type IconShape =
  | { readonly kind: 'path'; readonly d: string }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number }
  | {
      readonly kind: 'rect';
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly rx: number;
    };

const p = (d: string): IconShape => ({ kind: 'path', d });
const c = (cx: number, cy: number, r: number): IconShape => ({ kind: 'circle', cx, cy, r });
const r = (x: number, y: number, width: number, height: number, rx: number): IconShape => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  rx,
});

export const ICONS = {
  home: [p('m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'), p('M9 22V12h6v10')],
  users: [
    p('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'),
    c(9, 7, 4),
    p('M22 21v-2a4 4 0 0 0-3-3.87'),
    p('M16 3.13a4 4 0 0 1 0 7.75'),
  ],
  'user-check': [c(9, 7, 4), p('M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2'), p('m16 11 2 2 4-4')],
  user: [c(12, 8, 4), p('M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1')],
  'user-plus': [
    p('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'),
    c(9, 7, 4),
    p('M19 8v6M22 11h-6'),
  ],
  calendar: [r(3, 4, 18, 18, 2), p('M16 2v4M8 2v4M3 10h18')],
  'calendar-plus': [r(3, 4, 18, 18, 2), p('M16 2v4M8 2v4M3 10h18'), p('M12 14v4M10 16h4')],
  dumbbell: [p('M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11')],
  wrench: [
    p(
      'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'
    ),
  ],
  'shopping-bag': [p('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z'), p('M3 6h18'), p('M16 10a4 4 0 0 1-8 0')],
  send: [p('m22 2-7 20-4-9-9-4Z'), p('M22 2 11 13')],
  package: [
    p(
      'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'
    ),
    p('M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12'),
  ],
  sparkle: [p('M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z')],
  search: [c(11, 11, 8), p('m21 21-4.3-4.3')],
  bell: [p('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'), p('M10.3 21a1.94 1.94 0 0 0 3.4 0')],
  settings: [
    c(12, 12, 3),
    p(
      'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
    ),
  ],
  'panel-left': [r(3, 3, 18, 18, 2), p('M9 3v18')],
  'chevron-down': [p('m6 9 6 6 6-6')],
  'chevron-right': [p('m9 18 6-6-6-6')],
  'chevron-left': [p('m15 18-6-6 6-6')],
  plus: [p('M12 5v14M5 12h14')],
  x: [p('M18 6 6 18M6 6l12 12')],
  menu: [p('M4 6h16M4 12h16M4 18h16')],
  'log-out': [p('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'), p('m16 17 5-5-5-5'), p('M21 12H9')],
  pen: [p('M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z')],
  paperclip: [
    p('m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48'),
  ],
  'arrow-up': [p('M12 19V5M5 12l7-7 7 7')],
  'arrow-right': [p('M5 12h14M12 5l7 7-7 7')],
  'refresh-cw': [p('M21 12a9 9 0 1 1-3-6.7L21 8'), p('M21 3v5h-5')],
  'message-circle': [
    p(
      'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'
    ),
  ],
  'file-text': [p('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'), p('M14 2v6h6'), p('M16 13H8M16 17H8M10 9H8')],
  'alert-circle': [c(12, 12, 10), p('M12 8v4M12 16h.01')],
  inbox: [
    p('M22 12h-6l-2 3h-4l-2-3H2'),
    p('M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'),
  ],
  mail: [r(2, 4, 20, 16, 2), p('m22 7-10 6L2 7')],
  lock: [r(3, 11, 18, 11, 2), p('M7 11V7a5 5 0 0 1 10 0v4')],
  eye: [p('M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z'), c(12, 12, 3)],
  'eye-off': [
    p('M9.88 9.88a3 3 0 1 0 4.24 4.24'),
    p('M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68'),
    p('M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61'),
    p('M2 2l20 20'),
  ],
  clock: [c(12, 12, 10), p('M12 6v6l4 2')],
  check: [p('M20 6 9 17l-5-5')],
  'bar-chart': [p('M12 20V10M18 20V4M6 20v-4')],
  loader: [p('M21 12a9 9 0 1 1-6.22-8.56')],
} as const;

export type IconName = keyof typeof ICONS;

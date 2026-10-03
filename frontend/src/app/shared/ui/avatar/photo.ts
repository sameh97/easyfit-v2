import { AppConsts } from 'src/app/common/consts';

/** Placeholder images the legacy forms saved when no photo was uploaded. */
const DEFAULT_IMAGES: ReadonlySet<string> = new Set<string>([
  AppConsts.USER_DEFULT_IMAGE,
  AppConsts.TRAINER_DEFULT_IMAGE,
  AppConsts.TRAINER_FEMALE_DEFULT_IMAGE,
  AppConsts.MALE_MEMBER_DEFULT_IMAGE,
  AppConsts.FEMALE_MEMBER_DEFULT_IMAGE,
]);

/** A real uploaded photo, or null for none / a legacy default image (initials are shown instead). */
export function realPhotoUrl(url: string | null | undefined): string | null {
  return url && !DEFAULT_IMAGES.has(url) ? url : null;
}

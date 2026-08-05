/**
 * Banner field validation, mirroring the server.
 *
 * Transcribed from `app/Http/Requests/Panel/Banner/Concerns/ValidatesBannerFields.php`
 * (backend `f9be15c`). The API is the enforcement point — this exists so the
 * admin gets immediate, per-field feedback instead of submitting a banner and
 * getting back a 422 with no indication of which field was wrong.
 *
 * The messages match `lang/ar/admin.php` so the client and server say the same
 * thing about the same problem.
 */

/**
 * A link is either an absolute http(s) URL or an in-app path.
 *
 * Anything else is rejected — `url` previously accepted free text, including
 * `javascript:` URIs, which the storefront would render as a tappable target.
 * In-app paths are allowed because most existing rows use them
 * ("/categories/makeup"), and requiring absolute URLs would reject them all.
 */
const URL_PATTERN = /^(https?:\/\/[^\s]+|\/[^\s]*)$/;

/** Titles legitimately mix scripts, so Arabic only has to be *present*. */
// JS needs the explicit `Script=` form; PHP's `\p{Arabic}` shorthand is a
// SyntaxError here.
const CONTAINS_ARABIC = /\p{Script=Arabic}/u;

/** An English title carrying Arabic is always a mistake. */
const CONTAINS_NO_ARABIC = /^[^\p{Script=Arabic}]+$/u;

/** …and it has to actually contain a Latin letter, not just digits. */
const CONTAINS_LATIN = /[A-Za-z]/;

const MAX_TITLE = 255;
const MAX_URL = 2048;

export interface BannerFieldErrors {
  title_ar?: string;
  title_en?: string;
  url?: string;
  image?: string;
  position?: string;
}

export interface BannerFieldValues {
  title_ar: string;
  title_en: string;
  url: string;
  position?: number;
  /** Only required when creating; an edit keeps the existing image. */
  image?: File | null;
}

/**
 * Validates a banner form.
 *
 * @param values     The form values.
 * @param isEditing  On edit the image is optional, matching `UpdateBannerRequest`.
 * @returns          Field-keyed messages; empty when the banner is valid.
 */
export const validateBanner = (
  values: BannerFieldValues,
  isEditing: boolean
): BannerFieldErrors => {
  const errors: BannerFieldErrors = {};

  const titleAr = values.title_ar?.trim() ?? '';
  const titleEn = values.title_en?.trim() ?? '';
  const url = values.url?.trim() ?? '';

  // ── Arabic title ────────────────────────────────────────────────────────
  if (!titleAr) {
    errors.title_ar = 'العنوان بالعربي مطلوب.';
  } else if (titleAr.length > MAX_TITLE) {
    errors.title_ar = `العنوان بالعربي يجب ألا يتجاوز ${MAX_TITLE} حرفاً.`;
  } else if (!CONTAINS_ARABIC.test(titleAr)) {
    errors.title_ar = 'العنوان بالعربي يجب أن يكون مكتوباً بالعربية.';
  }

  // ── English title ───────────────────────────────────────────────────────
  if (!titleEn) {
    errors.title_en = 'العنوان بالإنجليزي مطلوب.';
  } else if (titleEn.length > MAX_TITLE) {
    errors.title_en = `العنوان بالإنجليزي يجب ألا يتجاوز ${MAX_TITLE} حرفاً.`;
  } else if (!CONTAINS_NO_ARABIC.test(titleEn) || !CONTAINS_LATIN.test(titleEn)) {
    errors.title_en = 'العنوان بالإنجليزي يجب أن يكون مكتوباً بالإنجليزية.';
  }

  // ── Link ────────────────────────────────────────────────────────────────
  // `nullable` server-side, so an empty link is allowed; only the format of a
  // supplied one is constrained.
  if (url) {
    if (url.length > MAX_URL) {
      errors.url = `الرابط يجب ألا يتجاوز ${MAX_URL} حرفاً.`;
    } else if (!URL_PATTERN.test(url)) {
      errors.url = 'الرابط يجب أن يكون رابطاً كاملاً (https://…) أو مساراً داخلياً يبدأ بـ /.';
    }
  }

  // ── Position ────────────────────────────────────────────────────────────
  if (values.position !== undefined) {
    if (!Number.isInteger(values.position) || values.position < 0) {
      errors.position = 'الترتيب يجب أن يكون رقماً صحيحاً أكبر من أو يساوي صفر.';
    }
  }

  // ── Image ───────────────────────────────────────────────────────────────
  if (!isEditing && !values.image) {
    errors.image = 'يرجى اختيار صورة للبانر.';
  }

  return errors;
};

export const hasBannerErrors = (errors: BannerFieldErrors): boolean =>
  Object.keys(errors).length > 0;

/**
 * Whether a stored link is safe to render as a real anchor.
 *
 * The new server rules stop *new* bad links being saved, but rows created
 * before them can still hold anything — and the banners table renders `url`
 * as a clickable link, so a `javascript:` URI left over from then is a live
 * target for whoever opens that screen. Anything failing the same check is
 * shown as plain text instead.
 */
export const isSafeBannerUrl = (url: unknown): boolean =>
  typeof url === 'string' && url.trim() !== '' && URL_PATTERN.test(url.trim());

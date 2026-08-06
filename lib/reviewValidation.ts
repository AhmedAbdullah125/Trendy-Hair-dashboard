/**
 * Review field validation.
 *
 * The form checked only that the two titles were non-empty, so "123" was a
 * valid Arabic title and a review could be submitted with no thumbnail — which
 * the API then rejected, because `CreateReviewRequest` has
 * `'image' => 'required|image|max:10240'` while the field was labelled
 * "(اختياري)". The rejection surfaced as a generic failure, so the admin was
 * told something went wrong without being told what.
 *
 * The script rules mirror `lib/bannerValidation` so the two admin forms agree
 * about what a bilingual title is. They are deliberately stricter than the
 * server, which only asks for `string|max:255`: catching a digits-only title
 * here costs a round trip and cannot cause a false rejection, since anything
 * accepted here still satisfies the looser server rule.
 */

/** Titles legitimately mix scripts, so Arabic only has to be *present*. */
const CONTAINS_ARABIC = /\p{Script=Arabic}/u;

/** An English title carrying Arabic is always a mistake. */
const CONTAINS_NO_ARABIC = /^[^\p{Script=Arabic}]+$/u;

/** …and it has to actually contain a Latin letter, not just digits. */
const CONTAINS_LATIN = /[A-Za-z]/;

const MAX_TITLE = 255;

/** `CreateReviewRequest` caps both uploads at 10MB. */
const MAX_UPLOAD_BYTES = 10240 * 1024;

/** `'video' => 'required|mimes:mp4,mov,avi'`. */
const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi'];

export interface ReviewFieldErrors {
  title_ar?: string;
  title_en?: string;
  video?: string;
  image?: string;
}

export interface ReviewFieldValues {
  title_ar: string;
  title_en: string;
  video?: File | null;
  image?: File | null;
}

const extensionOf = (file: File): string => file.name.split('.').pop()?.toLowerCase() ?? '';

/**
 * Validates a review form.
 *
 * @param values    The form values.
 * @param isEditing On edit both uploads are optional — `UpdateReviewRequest`
 *                  marks them `nullable`, so omitting one keeps the existing file.
 * @returns         Field-keyed messages; empty when the review is valid.
 */
export const validateReview = (
  values: ReviewFieldValues,
  isEditing: boolean
): ReviewFieldErrors => {
  const errors: ReviewFieldErrors = {};

  const titleAr = values.title_ar?.trim() ?? '';
  const titleEn = values.title_en?.trim() ?? '';

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

  // ── Video ───────────────────────────────────────────────────────────────
  if (!isEditing && !values.video) {
    errors.video = 'فيديو المراجعة مطلوب.';
  } else if (values.video) {
    if (!ALLOWED_VIDEO_EXTENSIONS.includes(extensionOf(values.video))) {
      errors.video = 'صيغة الفيديو يجب أن تكون mp4 أو mov أو avi.';
    } else if (values.video.size > MAX_UPLOAD_BYTES) {
      errors.video = 'حجم الفيديو يجب ألا يتجاوز 10 ميجابايت.';
    }
  }

  // ── Image ───────────────────────────────────────────────────────────────
  // Required on create, despite the field having been labelled optional.
  if (!isEditing && !values.image) {
    errors.image = 'الصورة المصغرة مطلوبة.';
  } else if (values.image) {
    if (!values.image.type.startsWith('image/')) {
      errors.image = 'يرجى اختيار صورة صالحة.';
    } else if (values.image.size > MAX_UPLOAD_BYTES) {
      errors.image = 'حجم الصورة يجب ألا يتجاوز 10 ميجابايت.';
    }
  }

  return errors;
};

/** The first message, for a form that reports one problem at a time. */
export const firstReviewError = (errors: ReviewFieldErrors): string | null => {
  const order: (keyof ReviewFieldErrors)[] = ['title_ar', 'title_en', 'video', 'image'];
  for (const field of order) {
    if (errors[field]) return errors[field] as string;
  }
  return null;
};

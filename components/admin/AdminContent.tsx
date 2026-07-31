import React, { useState, useEffect } from 'react';
import { LayoutTemplate, Link as LinkIcon, Save, Gamepad2, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetAdminSettings, useUpdateAdminSettings, AdminSettings } from '../requests/useAdminSettings';

/**
 * Content and competition settings.
 *
 * Previously this screen saved to a localStorage-backed context, so an admin
 * could edit the booking link, press save, and nothing reached any customer —
 * the customer app read from its own separate localStorage. It now reads and
 * writes the backend `settings` table via /v1/admin/settings.
 *
 * Two dead sections were removed rather than left in place:
 *  - a banner "slider" placeholder whose upload boxes had no handlers (banners
 *    are managed for real on the Banners screen, linked below);
 *  - four social-link inputs with no state, no save and no backend route.
 */

type EditableKeys =
  | 'tech_booking_url'
  | 'admin_whatsapp'
  | 'email'
  | 'phone'
  | 'competition_interval_minutes'
  | 'competition_question_time'
  | 'game_balance_cap';

const EMPTY: Record<EditableKeys, string> = {
  tech_booking_url: '',
  admin_whatsapp: '',
  email: '',
  phone: '',
  competition_interval_minutes: '',
  competition_question_time: '',
  game_balance_cap: '',
};

const AdminContent: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useGetAdminSettings();
  const updateMutation = useUpdateAdminSettings();

  const [form, setForm] = useState<Record<EditableKeys, string>>(EMPTY);

  useEffect(() => {
    const settings = data?.items?.settings;
    if (!settings) return;

    setForm({
      tech_booking_url: settings.tech_booking_url ?? '',
      admin_whatsapp: settings.admin_whatsapp ?? '',
      email: settings.email ?? '',
      phone: settings.phone ?? '',
      competition_interval_minutes: settings.competition_interval_minutes ?? '',
      competition_question_time: settings.competition_question_time ?? '',
      game_balance_cap: settings.game_balance_cap ?? '',
    });
  }, [data]);

  const set = (key: EditableKeys) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    // Send blanks as null so a cleared field unsets the value rather than
    // storing an empty string that later reads as a real setting.
    const payload: Partial<AdminSettings> = {};
    (Object.keys(form) as EditableKeys[]).forEach((key) => {
      payload[key] = form[key].trim() === '' ? null : form[key].trim();
    });

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center gap-3 text-app-textSec">
        <Loader2 size={32} className="animate-spin" />
        <span className="text-sm">جارٍ تحميل الإعدادات…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-16 flex flex-col items-center gap-3 text-red-500">
        <AlertCircle size={32} />
        <span className="text-sm font-bold">تعذّر تحميل الإعدادات</span>
        <span className="text-xs text-app-textSec">
          {error instanceof Error ? error.message : 'حدث خطأ غير متوقع'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-app-text">الإعدادات والمحتوى</h2>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-app-gold text-white px-6 py-2 rounded-xl font-bold hover:bg-app-goldDark flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{updateMutation.isPending ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</span>
        </button>
      </div>

      {/* Links / contact */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-app-card/30">
        <h3 className="text-lg font-bold text-app-text mb-4 flex items-center gap-2">
          <LinkIcon size={20} className="text-app-gold" />
          الروابط وبيانات التواصل
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-app-text mb-2">
              رابط زر حجز التكنك أونلاين (المرة الأولى مجاناً)
            </label>
            <input
              type="url"
              placeholder="https://..."
              className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold text-left"
              dir="ltr"
              value={form.tech_booking_url}
              onChange={set('tech_booking_url')}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-app-text mb-2">رقم واتساب الإدارة</label>
            <input
              type="text"
              placeholder="965..."
              className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold text-left"
              dir="ltr"
              value={form.admin_whatsapp}
              onChange={set('admin_whatsapp')}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-app-text mb-2">رقم الهاتف</label>
            <input
              type="text"
              className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold text-left"
              dir="ltr"
              value={form.phone}
              onChange={set('phone')}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-app-text mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold text-left"
              dir="ltr"
              value={form.email}
              onChange={set('email')}
            />
          </div>
        </div>
      </div>

      {/* Competition rules */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-app-card/30">
        <h3 className="text-lg font-bold text-app-text mb-1 flex items-center gap-2">
          <Gamepad2 size={20} className="text-app-gold" />
          قواعد المسابقة
        </h3>
        <p className="text-xs text-app-textSec mb-4">
          هذه القيم كانت مثبتة داخل التطبيق سابقاً، والآن يقرأها التطبيق من هنا.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-app-text mb-2">الفاصل بين المحاولات (دقيقة)</label>
            <input
              type="number"
              min={0}
              className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
              value={form.competition_interval_minutes}
              onChange={set('competition_interval_minutes')}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-app-text mb-2">وقت السؤال (ثانية)</label>
            <input
              type="number"
              min={5}
              className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
              value={form.competition_question_time}
              onChange={set('competition_question_time')}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-app-text mb-2">الحد الأقصى للرصيد (د.ك)</label>
            <input
              type="number"
              min={0}
              step="0.001"
              placeholder="اتركه فارغاً لإلغاء الحد"
              className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
              value={form.game_balance_cap}
              onChange={set('game_balance_cap')}
            />
            <p className="text-[11px] text-app-textSec mt-1">
              عند بلوغ العميل هذا الرصيد يتوقف عن اللعب. اتركه فارغاً لإلغاء الحد.
            </p>
          </div>
        </div>
      </div>

      {/* Banners live on their own screen */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-app-card/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate size={20} className="text-app-gold" />
          <div>
            <h3 className="text-lg font-bold text-app-text">البنرات الرئيسية</h3>
            <p className="text-xs text-app-textSec">تُدار البنرات من شاشة مستقلة مرتبطة بالـ API.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/banners')}
          className="px-5 py-2 rounded-xl bg-app-bg font-bold text-sm hover:bg-app-card/40"
        >
          إدارة البنرات
        </button>
      </div>
    </div>
  );
};

export default AdminContent;

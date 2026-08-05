import React, { useEffect, useRef, useState } from 'react';
import { History, Search, AlertCircle, Loader2, Inbox, Coins, Save, Wallet, Gift, ShoppingBag } from 'lucide-react';
import { useGetWalletTransactions, WalletTransaction } from '../requests/useGetWalletTransactions';
import { useGetStatistics } from '../requests/useGetStatistics';
import { useGetAdminSettings, useUpdateAdminSettings, AdminSettings } from '../requests/useAdminSettings';

/** The ledger is denominated in whole points, so no decimals. */
const formatPoints = (value: number): string =>
    Math.round(Number(value) || 0).toLocaleString('en-US');

/** Matches the customer app's `formatDinars` — 3dp, the fils resolution. */
const formatDinars = (value: number): string => `${(Number(value) || 0).toFixed(3)} د.ك`;

/** Same fallback the server uses when `points_per_dinar` is unset. */
const DEFAULT_POINTS_PER_DINAR = 100;

/**
 * Wallet / points ledger.
 *
 * This screen previously showed two "settings" cards (balance expiry, max
 * discount per order, cashback percentage, points-to-KD conversion) and three
 * hardcoded transaction rows. None of it was connected to anything: the save
 * buttons had no handlers, and the backend has no cashback, loyalty-points or
 * expiry concept at all. Showing an admin controls that silently do nothing is
 * worse than not showing them, so they were removed.
 *
 * What remains is real: the ledger below is the actual `wallet_transactions`
 * table, which every credit and debit writes to, the outstanding-liability
 * figures come from /v1/admin/statistics, and the two settings below are the
 * only knobs the backend actually reads (`points_per_dinar` decides what a
 * point is worth, `min_wallet_redemption` decides when redeeming is offered).
 * They used to sit on the content screen, which has no sidebar entry — so the
 * rate that prices every balance in the product was effectively unreachable.
 */

const ACTION_LABELS: Array<{ match: RegExp; label: string }> = [
    { match: /^competition_prize_stage_/, label: 'فوز بمرحلة المسابقة' },
    { match: /^rewards_claimed_/, label: 'استلام مكافأة' },
    { match: /^refund_order_/, label: 'استرجاع مبلغ طلب' },
    { match: /^payment_order$/, label: 'استخدام في طلب' },
];

/** Turn a raw ledger key into something an admin can read. */
const describeAction = (action: string): string => {
    const known = ACTION_LABELS.find((entry) => entry.match.test(action));
    if (!known) return action;

    const stage = action.match(/^competition_prize_stage_(\d+)$/);
    if (stage) return `${known.label} ${stage[1]}`;

    const order = action.match(/^refund_order_(\d+)$/);
    if (order) return `${known.label} #${order[1]}`;

    const level = action.match(/^rewards_claimed_(.+)$/);
    if (level) return `${known.label} (${level[1]})`;

    return known.label;
};

/** One summary figure: points on top, what they are worth underneath. */
const PointsTile: React.FC<{
    icon: React.ReactNode;
    label: string;
    points: number;
    rate: number;
    hint: string;
}> = ({ icon, label, points, rate, hint }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 p-5">
        <div className="flex items-center gap-2 text-app-textSec mb-3">
            <span className="p-2 rounded-xl bg-app-bg text-app-gold">{icon}</span>
            <span className="text-sm font-bold text-app-text">{label}</span>
        </div>
        <div className="text-2xl font-bold text-app-text leading-none">
            {formatPoints(points)} <span className="text-sm font-normal text-app-textSec">نقطة</span>
        </div>
        <div className="text-sm font-bold text-app-gold mt-1">{formatDinars(points / rate)}</div>
        <p className="text-[11px] text-app-textSec mt-2 leading-relaxed">{hint}</p>
    </div>
);

const AdminWallets: React.FC = () => {
    const [search, setSearch] = useState('');
    const [direction, setDirection] = useState<'credit' | 'debit' | ''>('');
    const [pageNumber, setPageNumber] = useState(1);

    const { data, isLoading, isError, error } = useGetWalletTransactions({
        pageNumber,
        search: search.trim() || undefined,
        direction: direction || undefined,
    });

    const transactions: WalletTransaction[] = data?.items?.transactions ?? [];
    const pagination = data?.items?.pagination;

    const statistics = useGetStatistics();
    const settings = useGetAdminSettings();
    const updateSettings = useUpdateAdminSettings();

    const [rateInput, setRateInput] = useState('');
    const [minRedemptionInput, setMinRedemptionInput] = useState('');

    const storedRate = settings.data?.items?.settings?.points_per_dinar ?? '';
    const storedMinRedemption = settings.data?.items?.settings?.min_wallet_redemption ?? '';

    // Hydrated once, deliberately: react-query refetches on window focus, and
    // syncing on every fetch would wipe a half-typed rate the moment the admin
    // tabbed away and back. After a save the inputs already hold what was sent.
    const hydrated = useRef(false);
    useEffect(() => {
        if (hydrated.current || !settings.data) return;

        hydrated.current = true;
        setRateInput(storedRate ?? '');
        setMinRedemptionInput(storedMinRedemption ?? '');
    }, [settings.data, storedRate, storedMinRedemption]);

    /** The rate currently in force — what every existing balance is priced at. */
    const savedRate = Number(storedRate) > 0 ? Number(storedRate) : DEFAULT_POINTS_PER_DINAR;
    /** The rate being typed, used only for the live preview below the field. */
    const draftRate = Number(rateInput) > 0 ? Number(rateInput) : savedRate;

    const totals = statistics.data?.items?.totals;
    const outstanding = totals?.wallet_outstanding ?? 0;

    const isDirty = rateInput !== (storedRate ?? '') || minRedemptionInput !== (storedMinRedemption ?? '');

    const handleSaveSettings = () => {
        // Blank clears the setting, so the server falls back to its own default
        // (100 points/د.ك) rather than storing an empty string that would then
        // read back as a real value.
        const payload: Partial<AdminSettings> = {
            points_per_dinar: rateInput.trim() === '' ? null : rateInput.trim(),
            min_wallet_redemption: minRedemptionInput.trim() === '' ? null : minRedemptionInput.trim(),
        };

        updateSettings.mutate(payload);
    };

    const onFilterChange = (next: 'credit' | 'debit' | '') => {
        setDirection(next);
        setPageNumber(1);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-2xl font-bold text-app-text">المحفظة والنقاط</h2>
                <p className="text-sm text-app-textSec mt-1">
                    قيمة النقطة، والرصيد القائم لدى العملاء، وكل عمليات الإضافة والخصم. الرصيد يُضاف عند الفوز بالمسابقة أو استلام مكافأة أو الشراء، ويُخصم عند استخدامه في طلب.
                </p>
            </div>

            {/* Outstanding liability */}
            {statistics.isError && (
                <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 p-6 flex items-center gap-3 text-red-500">
                    <AlertCircle size={20} />
                    <span className="text-sm font-bold">تعذّر تحميل ملخص الأرصدة</span>
                </div>
            )}

            {statistics.isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 p-10 flex items-center justify-center gap-3 text-app-textSec">
                    <Loader2 size={22} className="animate-spin" />
                    <span className="text-sm">جارٍ تحميل ملخص الأرصدة…</span>
                </div>
            )}

            {totals && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PointsTile
                        icon={<Wallet size={18} />}
                        label="الرصيد القائم لدى العملاء"
                        points={outstanding}
                        rate={savedRate}
                        hint="مجموع نقاط كل العملاء — الالتزام المالي غير المستخدم حتى الآن."
                    />
                    <PointsTile
                        icon={<Gift size={18} />}
                        label="نقاط مُنحت (منذ البداية)"
                        points={totals.rewards_granted_all_time}
                        rate={savedRate}
                        hint="جوائز المسابقة والمكافآت المستلمة. لا تشمل نقاط الشراء ولا الاسترجاعات."
                    />
                    <PointsTile
                        icon={<ShoppingBag size={18} />}
                        label="نقاط استُخدمت في الطلبات"
                        points={totals.wallet_spent_all_time}
                        rate={savedRate}
                        hint="ما خصمه العملاء فعلياً من أرصدتهم على الطلبات."
                    />
                </div>
            )}

            {/* Points economy */}
            <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 p-6">
                <div className="flex flex-wrap items-center justify-between mb-1 gap-3">
                    <h3 className="text-lg font-bold text-app-text flex items-center gap-2">
                        <Coins size={20} className="text-app-gold" />
                        قيمة النقطة
                    </h3>
                    <button
                        onClick={handleSaveSettings}
                        disabled={!isDirty || updateSettings.isPending || settings.isLoading}
                        className="bg-app-gold text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-app-goldDark flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {updateSettings.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        <span>{updateSettings.isPending ? 'جارٍ الحفظ…' : 'حفظ'}</span>
                    </button>
                </div>
                <p className="text-xs text-app-textSec mb-4">
                    الأرصدة مخزّنة بالنقاط فقط، وتُحوَّل إلى دنانير عند العرض. لذلك تغيير السعر يعيد تسعير كل الأرصدة القائمة فوراً.
                </p>

                {settings.isLoading ? (
                    <div className="py-8 flex items-center justify-center gap-3 text-app-textSec">
                        <Loader2 size={22} className="animate-spin" />
                        <span className="text-sm">جارٍ تحميل الإعدادات…</span>
                    </div>
                ) : settings.isError ? (
                    <div className="py-8 flex items-center justify-center gap-3 text-red-500">
                        <AlertCircle size={20} />
                        <span className="text-sm font-bold">تعذّر تحميل الإعدادات</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-app-text mb-2">عدد النقاط لكل دينار</label>
                            <input
                                type="number"
                                min={1}
                                max={100000}
                                step="1"
                                placeholder={`اتركه فارغاً للقيمة الافتراضية (${DEFAULT_POINTS_PER_DINAR})`}
                                className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                value={rateInput}
                                onChange={(e) => setRateInput(e.target.value)}
                            />
                            <div className="mt-2 bg-app-bg rounded-xl p-3 text-[11px] text-app-textSec leading-relaxed">
                                <div>
                                    كل <span className="font-bold text-app-text">{formatPoints(draftRate)}</span> نقطة = 1.000 د.ك،
                                    والنقطة الواحدة = <span className="font-bold text-app-text">{(1 / draftRate).toFixed(4)}</span> د.ك.
                                </div>
                                <div className="mt-1">
                                    بهذا السعر يصبح الرصيد القائم ({formatPoints(outstanding)} نقطة) مساوياً{' '}
                                    <span className="font-bold text-app-gold">{formatDinars(outstanding / draftRate)}</span>
                                    {draftRate !== savedRate && (
                                        <span> بدلاً من {formatDinars(outstanding / savedRate)} حالياً.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-app-text mb-2">أقل رصيد قابل للاستخدام (د.ك)</label>
                            <input
                                type="number"
                                min={0}
                                max={1000}
                                step="0.001"
                                placeholder="0 = بدون حد أدنى"
                                className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                value={minRedemptionInput}
                                onChange={(e) => setMinRedemptionInput(e.target.value)}
                            />
                            <div className="mt-2 bg-app-bg rounded-xl p-3 text-[11px] text-app-textSec leading-relaxed">
                                لا يظهر خيار استخدام النقاط في السلة قبل أن تبلغ قيمة الرصيد هذا الحد — أي{' '}
                                <span className="font-bold text-app-text">
                                    {formatPoints(Math.ceil((Number(minRedemptionInput) || 0) * draftRate))}
                                </span>{' '}
                                نقطة بالسعر أعلاه.
                            </div>
                        </div>
                    </div>
                )}

                <p className="text-[11px] text-app-textSec mt-4 leading-relaxed border-t border-app-card/30 pt-3">
                    ملاحظة: ما يكسبه العميل من الشراء مثبّت في الخادم بنقطة واحدة لكل دينار من قيمة الطلب، ولا يتأثر بهذا السعر. لذلك هذا الحقل يحدد فعلياً نسبة الاسترجاع: 500 نقطة/د.ك ≈ 0.2%، و100 نقطة/د.ك ≈ 1%.
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 p-4 flex flex-col md:flex-row gap-3 md:items-center">
                <div className="relative flex-1">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-app-textSec" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }}
                        placeholder="ابحث باسم العميل أو رقم الهاتف أو نوع العملية"
                        className="w-full ps-3 pe-9 py-2.5 border border-app-card rounded-xl outline-none focus:border-app-gold text-sm"
                    />
                </div>

                <div className="flex gap-2">
                    {([
                        { value: '', label: 'الكل' },
                        { value: 'credit', label: 'إضافة' },
                        { value: 'debit', label: 'خصم' },
                    ] as const).map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onFilterChange(option.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                                direction === option.value
                                    ? 'bg-app-gold text-white'
                                    : 'bg-app-bg text-app-textSec hover:bg-app-card/40'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ledger */}
            <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 overflow-hidden">
                <div className="p-6 border-b border-app-card/30 flex items-center gap-2">
                    <History size={20} className="text-app-textSec" />
                    <h3 className="text-lg font-bold text-app-text">سجل العمليات</h3>
                    {pagination && (
                        <span className="text-xs text-app-textSec">({pagination.total_items} عملية)</span>
                    )}
                </div>

                {isLoading && (
                    <div className="p-12 flex flex-col items-center gap-3 text-app-textSec">
                        <Loader2 size={28} className="animate-spin" />
                        <span className="text-sm">جارٍ تحميل السجل…</span>
                    </div>
                )}

                {isError && !isLoading && (
                    <div className="p-12 flex flex-col items-center gap-3 text-red-500">
                        <AlertCircle size={28} />
                        <span className="text-sm font-bold">تعذّر تحميل سجل العمليات</span>
                        <span className="text-xs text-app-textSec">
                            {error instanceof Error ? error.message : 'حدث خطأ غير متوقع'}
                        </span>
                    </div>
                )}

                {!isLoading && !isError && transactions.length === 0 && (
                    <div className="p-12 flex flex-col items-center gap-3 text-app-textSec">
                        <Inbox size={28} />
                        <span className="text-sm">لا توجد عمليات مطابقة</span>
                    </div>
                )}

                {!isLoading && !isError && transactions.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-[640px]">
                            <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                                <tr>
                                    <th className="px-6 py-4">العميل</th>
                                    <th className="px-6 py-4">نوع العملية</th>
                                    <th className="px-6 py-4">المبلغ</th>
                                    <th className="px-6 py-4">الرصيد بعد العملية</th>
                                    <th className="px-6 py-4">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-app-card/30 text-sm">
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td className="px-6 py-4">
                                            <span className="font-bold block">{transaction.user?.name || '—'}</span>
                                            <span className="text-xs text-app-textSec">{transaction.user?.phone || ''}</span>
                                        </td>
                                        <td className="px-6 py-4">{describeAction(transaction.action)}</td>
                                        <td
                                            className={`px-6 py-4 font-bold ${
                                                transaction.direction === 'debit' ? 'text-red-500' : 'text-green-600'
                                            }`}
                                        >
                                            <span className="block">
                                                {transaction.amount > 0 ? '+' : ''}
                                                {formatPoints(transaction.amount)} نقطة
                                            </span>
                                            {/* Priced at today's rate, not the rate in force when the
                                                row was written — the ledger stores points only. */}
                                            <span className="block text-[11px] font-normal text-app-textSec">
                                                {formatDinars(transaction.amount / savedRate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-app-textSec">
                                            <span className="block">{formatPoints(transaction.balance)} نقطة</span>
                                            <span className="block text-[11px]">
                                                {formatDinars(transaction.balance / savedRate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-app-textSec">{transaction.created_at}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination && pagination.total_pages > 1 && (
                    <div className="p-4 border-t border-app-card/30 flex items-center justify-between text-sm">
                        <button
                            onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
                            disabled={pageNumber <= 1}
                            className="px-4 py-2 rounded-xl bg-app-bg font-bold disabled:opacity-40"
                        >
                            السابق
                        </button>
                        <span className="text-app-textSec">
                            صفحة {pagination.current_page} من {pagination.total_pages}
                        </span>
                        <button
                            onClick={() => setPageNumber((page) => Math.min(pagination.total_pages, page + 1))}
                            disabled={pageNumber >= pagination.total_pages}
                            className="px-4 py-2 rounded-xl bg-app-bg font-bold disabled:opacity-40"
                        >
                            التالي
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminWallets;

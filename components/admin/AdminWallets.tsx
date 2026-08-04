import React, { useState } from 'react';
import { History, Search, AlertCircle, Loader2, Inbox } from 'lucide-react';
import { useGetWalletTransactions, WalletTransaction } from '../requests/useGetWalletTransactions';

/** The ledger is denominated in whole points, so no decimals. */
const formatPoints = (value: number): string =>
    Math.round(Number(value) || 0).toLocaleString('en-US');

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
 * table, which every credit and debit writes to.
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

    const onFilterChange = (next: 'credit' | 'debit' | '') => {
        setDirection(next);
        setPageNumber(1);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-2xl font-bold text-app-text">سجل المحفظة والنقاط</h2>
                <p className="text-sm text-app-textSec mt-1">
                    كل عمليات إضافة وخصم الرصيد. الرصيد يُضاف عند الفوز بالمسابقة أو استلام مكافأة، ويُخصم عند استخدامه في طلب.
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
                                            {transaction.amount > 0 ? '+' : ''}
                                            {formatPoints(transaction.amount)} نقطة
                                        </td>
                                        <td className="px-6 py-4 text-app-textSec">{formatPoints(transaction.balance)} نقطة</td>
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

import React from 'react';
import {
  TrendingUp, Users, ShoppingBag, Award,
  ArrowUpRight, ArrowDownRight, Coins, Loader2, AlertCircle, Inbox, Gamepad2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetStatistics } from '../requests/useGetStatistics';
import { useGetAdminOrders } from '../requests/useGetAdminOrders';
import { statusBadge } from '../../lib/orderStatus';

/**
 * Dashboard home.
 *
 * Everything on this screen used to be hardcoded: the four stat tiles, a bar
 * chart of invented heights, wallet progress bars, a "145 players" counter and
 * five fabricated orders attributed to a made-up customer. None of it moved
 * when the business did. It is now driven by /v1/admin/statistics and the real
 * orders endpoint.
 *
 * The sales-over-time bar chart was removed rather than re-pointed: there is no
 * time-series endpoint behind it, and a chart is the easiest thing to mistake
 * for real data.
 */

const formatKD = (value: number) => `${value.toFixed(3)} د.ك`;

/** Renders a trend chip, or a neutral dash when there is no baseline. */
const Trend: React.FC<{ percent?: number | null; fallbackLabel?: string }> = ({ percent, fallbackLabel }) => {
  if (percent === null || percent === undefined) {
    return <span className="text-xs font-bold text-app-textSec">{fallbackLabel ?? '—'}</span>;
  }

  const isUp = percent >= 0;

  return (
    <div className={`flex items-center text-xs font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
      {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      <span className="mr-1">{isUp ? '+' : ''}{percent}%</span>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useGetStatistics();
  const stats = data?.items;

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
  } = useGetAdminOrders({ pageSize: 5, pageNumber: 1 });

  const recentOrders = ordersData?.items?.data ?? [];

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center gap-3 text-app-textSec">
        <Loader2 size={32} className="animate-spin" />
        <span className="text-sm">جارٍ تحميل الإحصائيات…</span>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-16 flex flex-col items-center gap-3 text-red-500">
        <AlertCircle size={32} />
        <span className="text-sm font-bold">تعذّر تحميل الإحصائيات</span>
        <span className="text-xs text-app-textSec">
          {error instanceof Error ? error.message : 'حدث خطأ غير متوقع'}
        </span>
      </div>
    );
  }

  const tiles = [
    {
      label: 'مبيعات اليوم',
      value: formatKD(stats.sales_today.value),
      trend: <Trend percent={stats.sales_today.trend_percent} />,
      icon: <TrendingUp size={24} className="text-white" />,
      bg: 'bg-green-500',
    },
    {
      label: 'طلبات اليوم',
      value: String(stats.orders_today.value),
      trend: <Trend percent={stats.orders_today.trend_percent} />,
      icon: <ShoppingBag size={24} className="text-white" />,
      bg: 'bg-app-gold',
    },
    {
      label: 'عملاء نشطين',
      value: stats.active_customers.value.toLocaleString('en-US'),
      trend: (
        <span className="text-xs font-bold text-app-textSec">
          {stats.active_customers.new_today ?? 0} جديد اليوم
        </span>
      ),
      icon: <Users size={24} className="text-white" />,
      bg: 'bg-blue-500',
    },
    {
      label: 'مكافآت ممنوحة اليوم',
      value: formatKD(stats.rewards_granted_today.value),
      trend: <Trend percent={stats.rewards_granted_today.trend_percent} />,
      icon: <Award size={24} className="text-white" />,
      bg: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiles.map((tile, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-app-card/30 flex items-center justify-between">
            <div>
              <p className="text-sm text-app-textSec font-medium mb-1">{tile.label}</p>
              <h3 className="text-2xl font-bold text-app-text mb-1">{tile.value}</h3>
              {tile.trend}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-gray-100 ${tile.bg}`}>
              {tile.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Wallet + competition summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-app-card/30">
          <h3 className="text-lg font-bold text-app-text mb-6">ملخص المحفظة</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-app-bg rounded-xl border border-app-card/50">
              <div className="flex items-center gap-2 mb-2 text-app-textSec">
                <Award size={16} className="text-purple-500" />
                <span className="text-xs font-bold">إجمالي المكافآت الممنوحة</span>
              </div>
              <span className="text-xl font-bold text-app-text">
                {formatKD(stats.totals.rewards_granted_all_time)}
              </span>
            </div>

            <div className="p-4 bg-app-bg rounded-xl border border-app-card/50">
              <div className="flex items-center gap-2 mb-2 text-app-textSec">
                <Coins size={16} className="text-blue-500" />
                <span className="text-xs font-bold">تم استخدامه في الطلبات</span>
              </div>
              <span className="text-xl font-bold text-app-text">
                {formatKD(stats.totals.wallet_spent_all_time)}
              </span>
            </div>

            <div className="p-4 bg-app-bg rounded-xl border border-app-card/50">
              <div className="flex items-center gap-2 mb-2 text-app-textSec">
                <Coins size={16} className="text-app-gold" />
                <span className="text-xs font-bold">الرصيد القائم لدى العملاء</span>
              </div>
              <span className="text-xl font-bold text-app-text">
                {formatKD(stats.totals.wallet_outstanding)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-app-card/30">
          <h3 className="text-lg font-bold text-app-text mb-6">المسابقة</h3>

          <div className="p-4 bg-app-bg rounded-xl border border-app-card/50 mb-4">
            <div className="flex items-center gap-2 mb-2 text-app-textSec">
              <Gamepad2 size={16} className="text-app-gold" />
              <span className="text-xs font-bold">لعبوا اليوم</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-app-goldDark">{stats.competition_plays_today}</span>
              <span className="text-xs text-app-textSec mb-1">لاعب</span>
            </div>
          </div>

          <div className="p-4 bg-app-bg rounded-xl border border-app-card/50">
            <span className="text-xs font-bold text-app-textSec block mb-2">إجمالي العملاء</span>
            <span className="text-2xl font-bold text-app-text">
              {stats.totals.customers.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 overflow-hidden">
        <div className="p-6 border-b border-app-card/30 flex justify-between items-center">
          <h3 className="text-lg font-bold text-app-text">أحدث الطلبات</h3>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-sm text-app-gold font-bold hover:underline"
          >
            عرض الكل
          </button>
        </div>

        {ordersLoading && (
          <div className="p-12 flex flex-col items-center gap-3 text-app-textSec">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-xs">جارٍ تحميل الطلبات…</span>
          </div>
        )}

        {ordersError && !ordersLoading && (
          <div className="p-12 flex flex-col items-center gap-2 text-red-500">
            <AlertCircle size={24} />
            <span className="text-xs font-bold">تعذّر تحميل الطلبات</span>
          </div>
        )}

        {!ordersLoading && !ordersError && recentOrders.length === 0 && (
          <div className="p-12 flex flex-col items-center gap-2 text-app-textSec">
            <Inbox size={24} />
            <span className="text-xs">لا توجد طلبات بعد</span>
          </div>
        )}

        {!ordersLoading && !ordersError && recentOrders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[640px]">
              <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">رقم الطلب</th>
                  <th className="px-6 py-4">العميل</th>
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4">الإجمالي</th>
                  <th className="px-6 py-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-card/30">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate('/admin/orders')}
                    className="hover:bg-app-bg/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-app-text">#{order.order_number ?? order.id}</td>
                    <td className="px-6 py-4 text-sm">{order.user?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-app-textSec">{order.created_at}</td>
                    <td className="px-6 py-4 font-bold text-app-gold">{order.total} د.ك</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge(order.status).colors}`}>
                        {statusBadge(order.status).label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

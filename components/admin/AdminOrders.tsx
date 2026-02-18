import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Printer, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { useGetAdminOrders, Order, OrderStatus } from '../requests/useGetAdminOrders';
import { useChangeOrderStatus, OrderStatusType } from '../requests/useChangeOrderStatus';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const AdminOrders: React.FC = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatusType>('pending');

  // Filter and pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState<OrderStatus>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPageNumber(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch orders with filters
  const { data, isLoading, isError, error } = useGetAdminOrders({
    pageSize,
    pageNumber,
    status,
    from: fromDate,
    to: toDate,
    search: debouncedSearch,
  });

  // Change order status mutation
  const changeOrderStatusMutation = useChangeOrderStatus();

  const orders = data?.items?.data || [];
  const pagination = data?.items?.pagination;

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status as OrderStatusType);
    setView('detail');
  };

  const handleStatusChangeSubmit = async () => {
    if (!selectedOrder) return;

    try {
      await changeOrderStatusMutation.mutateAsync({
        orderId: selectedOrder.id,
        status: selectedStatus,
      });

      // Update the local order object
      setSelectedOrder({
        ...selectedOrder,
        status: selectedStatus,
      });

      toast.success('تم تحديث حالة الطلب بنجاح');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  const handleExportToExcel = () => {
    if (!orders || orders.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    // Prepare data for Excel
    const excelData = orders.map((order, index) => ({
      '#': index + 1,
      'رقم الطلب': order.order_number,
      'اسم العميل': order.user.name,
      'رقم الهاتف': order.user.phone,
      'البريد الإلكتروني': order.user.email,
      'المحافظة': order.governorate.name,
      'المنطقة': order.city.name,
      'عدد المنتجات': order.items_count,
      'المجموع الفرعي': parseFloat(order.subtotal),
      'التوصيل': parseFloat(order.delivery_cost),
      'الخصم': parseFloat(order.discount),
      'المحفظة': parseFloat(order.wallet_amount),
      'الإجمالي': parseFloat(order.total),
      'طريقة الدفع': order.payment_type,
      'حالة الدفع': getStatusInfo(order.payment_status).label,
      'حالة الطلب': getStatusInfo(order.status).label,
      'التاريخ': new Date(order.created_at).toLocaleDateString('ar-EG'),
      'ملاحظات': order.notes || '-',
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبات');

    // Set column widths
    const columnWidths = [
      { wch: 5 },  // #
      { wch: 20 }, // رقم الطلب
      { wch: 20 }, // اسم العميل
      { wch: 15 }, // رقم الهاتف
      { wch: 25 }, // البريد الإلكتروني
      { wch: 15 }, // المحافظة
      { wch: 15 }, // المنطقة
      { wch: 12 }, // عدد المنتجات
      { wch: 12 }, // المجموع الفرعي
      { wch: 10 }, // التوصيل
      { wch: 10 }, // الخصم
      { wch: 10 }, // المحفظة
      { wch: 12 }, // الإجمالي
      { wch: 12 }, // طريقة الدفع
      { wch: 12 }, // حالة الدفع
      { wch: 12 }, // حالة الطلب
      { wch: 15 }, // التاريخ
      { wch: 30 }, // ملاحظات
    ];
    worksheet['!cols'] = columnWidths;

    // Generate filename with current date
    const fileName = `الطلبات_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, fileName);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as OrderStatus);
    setPageNumber(1); // Reset to first page on filter change
  };

  const handleResetFilters = () => {
    setStatus('');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setDebouncedSearch('');
    setPageNumber(1);
  };

  // Status mapping from English to Arabic with colors
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; colors: string }> = {
      'pending': { label: 'قيد الانتظار', colors: 'bg-yellow-100 text-yellow-700' },
      'confirmed': { label: 'مؤكد', colors: 'bg-cyan-100 text-cyan-600' },
      'processing': { label: 'قيد التجهيز', colors: 'bg-blue-100 text-blue-600' },
      'shipped': { label: 'تم الشحن', colors: 'bg-purple-100 text-purple-600' },
      'delivered': { label: 'تم التوصيل', colors: 'bg-emerald-100 text-emerald-600' },
      'completed': { label: 'مكتمل', colors: 'bg-green-100 text-green-600' },
      'cancelled': { label: 'ملغي', colors: 'bg-red-100 text-red-600' },
    };
    return statusMap[status] || { label: status, colors: 'bg-gray-100 text-gray-600' };
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const { label, colors } = getStatusInfo(status);
    return (
      <span className={`px-3 py-1 rounded-full text-xs text-nowrap font-bold ${colors}`}>
        {label}
      </span>
    );
  };

  if (view === 'detail' && selectedOrder) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('list')}
            className="text-app-textSec hover:text-app-gold font-bold flex items-center gap-2"
          >
            ← العودة للقائمة
          </button>
          <div className="flex gap-2">
            <button className="bg-white border border-app-card text-app-text px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-app-bg">
              <Printer size={18} />
              طباعة الفاتورة
            </button>
            <button
              onClick={handleStatusChangeSubmit}
              disabled={changeOrderStatusMutation.isPending}
              className="bg-app-gold text-white px-4 py-2 rounded-xl font-bold hover:bg-app-goldDark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {changeOrderStatusMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 p-6">
              <h3 className="text-lg font-bold text-app-text mb-4">المنتجات</h3>
              <div className="space-y-4">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-2 border-b border-app-card/20 last:border-0">
                    <div
                      className="w-16 h-16 bg-app-bg rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.product.main_image})` }}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-app-text">{item.product.name}</h4>
                      <p className="text-xs text-app-textSec">{item.product.brand.name}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-app-text">{item.price} د.ك</p>
                      <p className="text-xs text-app-textSec">الكمية: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials */}
            <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 p-6">
              <h3 className="text-lg font-bold text-app-text mb-4">تفاصيل الدفع</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-app-textSec">المجموع الفرعي</span>
                  <span className="font-bold">{selectedOrder.subtotal} د.ك</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-app-textSec">رسوم التوصيل</span>
                  <span className="font-bold">{selectedOrder.delivery_cost} د.ك</span>
                </div>
                {parseFloat(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-app-gold">
                    <span className="flex items-center gap-1"><AlertCircle size={14} /> الخصم</span>
                    <span className="font-bold">- {selectedOrder.discount} د.ك</span>
                  </div>
                )}
                {parseFloat(selectedOrder.wallet_amount) > 0 && (
                  <div className="flex justify-between text-app-gold">
                    <span className="flex items-center gap-1"><AlertCircle size={14} /> خصم رصيد الجوائز</span>
                    <span className="font-bold">- {selectedOrder.wallet_amount} د.ك</span>
                  </div>
                )}
                <div className="flex justify-between pt-4 border-t border-app-card/30 text-lg font-bold text-app-text">
                  <span>الإجمالي النهائي</span>
                  <span>{selectedOrder.total} د.ك</span>
                </div>
                <div className="mt-4 pt-4 border-t border-app-card/30">
                  <p className="text-xs text-app-textSec mb-1">طريقة الدفع</p>
                  <p className="font-bold text-app-text capitalize">{selectedOrder.payment_type}</p>
                  <p className="text-xs text-app-textSec mt-2 mb-1">حالة الدفع</p>
                  <StatusBadge status={selectedOrder.payment_status} />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 p-6">
              <h3 className="text-lg font-bold text-app-text mb-4">بيانات العميل</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-app-textSec block">الاسم</label>
                  <p className="font-bold text-app-text">{selectedOrder.user.name}</p>
                </div>
                <div>
                  <label className="text-xs text-app-textSec block">رقم الهاتف</label>
                  <p className="font-bold text-app-text" dir="ltr">{selectedOrder.user.phone}</p>
                </div>
                <div>
                  <label className="text-xs text-app-textSec block">البريد الإلكتروني</label>
                  <p className="text-sm text-app-text">{selectedOrder.user.email}</p>
                </div>
                <div>
                  <label className="text-xs text-app-textSec block">العنوان</label>
                  <p className="text-sm text-app-text">
                    {selectedOrder.governorate.name}، {selectedOrder.city.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 p-6">
              <h3 className="text-lg font-bold text-app-text mb-4">حالة الطلب</h3>
              <select
                className="w-full p-3 bg-app-bg border border-app-card rounded-xl font-bold text-app-text outline-none focus:border-app-gold"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatusType)}
              >
                <option value="pending">قيد الانتظار</option>
                <option value="confirmed">مؤكد</option>
                <option value="processing">قيد التجهيز</option>
                <option value="shipped">تم الشحن</option>
                <option value="delivered">تم التوصيل</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>

              {selectedOrder.notes && (
                <div className="mt-4">
                  <label className="text-xs text-app-textSec block mb-2">ملاحظات العميل</label>
                  <p className="p-3 bg-app-bg border border-app-card rounded-xl text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="mt-4">
                <label className="text-xs text-app-textSec block mb-2">ملاحظات داخلية</label>
                <textarea className="w-full p-3 bg-app-bg border border-app-card rounded-xl h-24 text-sm outline-none focus:border-app-gold" placeholder="اكتب ملاحظات للموظفين..."></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-app-text">إدارة الطلبات</h2>
        <div className="flex gap-3">
          <button
            onClick={handleResetFilters}
            className="p-2 bg-white border border-app-card rounded-xl text-app-textSec hover:text-app-gold hover:border-app-gold"
          >
            <Filter size={20} />
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={isLoading || orders.length === 0}
            className="bg-app-gold text-white px-6 py-2 rounded-xl font-bold hover:bg-app-goldDark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download size={18} />
            تصدير الى ملف Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-app-card/30 flex flex-wrap gap-4 items-center bg-gray-50/50">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-app-textSec" size={18} />
            <input
              type="text"
              placeholder="بحث برقم الطلب أو اسم العميل..."
              className="w-full pr-10 pl-4 py-2 border border-app-card rounded-xl outline-none focus:border-app-gold bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-app-card rounded-xl bg-white outline-none focus:border-app-gold text-sm"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="confirmed">مؤكد</option>
            <option value="processing">قيد التجهيز</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التوصيل</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
          <input
            type="date"
            className="px-4 py-2 border border-app-card rounded-xl bg-white outline-none focus:border-app-gold text-sm"
            placeholder="من تاريخ"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPageNumber(1);
            }}
          />
          <input
            type="date"
            className="px-4 py-2 border border-app-card rounded-xl bg-white outline-none focus:border-app-gold text-sm"
            placeholder="إلى تاريخ"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPageNumber(1);
            }}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-app-gold" size={40} />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex items-center justify-center py-12 px-4">
            <div className="text-center">
              <AlertCircle className="mx-auto text-red-500 mb-2" size={40} />
              <p className="text-app-text font-bold">حدث خطأ في تحميل الطلبات</p>
              <p className="text-app-textSec text-sm mt-1">{error?.message || 'يرجى المحاولة مرة أخرى'}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && orders.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="mx-auto text-app-textSec mb-2" size={40} />
              <p className="text-app-text font-bold">لا توجد طلبات</p>
              <p className="text-app-textSec text-sm mt-1">لم يتم العثور على أي طلبات بالفلاتر المحددة</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && orders.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">رقم الطلب</th>
                    <th className="px-6 py-4">العميل</th>
                    <th className="px-6 py-4">التاريخ</th>
                    <th className="px-6 py-4">عدد العناصر</th>
                    <th className="px-6 py-4">الإجمالي</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-card/30 text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-app-bg/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-app-text">#{order.order_number}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold">{order.user.name}</div>
                        <div className="text-xs text-app-textSec" dir="ltr">{order.user.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-app-textSec">{new Date(order.created_at).toLocaleDateString('ar-EG')}</td>
                      <td className="px-6 py-4">{order.items_count}</td>
                      <td className="px-6 py-4 font-bold text-app-gold">{order.total} د.ك</td>
                      <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 text-app-gold hover:bg-app-gold/10 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="p-4 border-t border-app-card/30 flex justify-between items-center text-xs text-app-textSec">
                <span>
                  عرض {((pagination.current_page - 1) * pagination.page_size) + 1}-
                  {Math.min(pagination.current_page * pagination.page_size, pagination.total_items)} من أصل {pagination.total_items}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.current_page === 1}
                    onClick={() => setPageNumber(prev => prev - 1)}
                    className={`px-3 py-1 border rounded ${pagination.current_page === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-app-gold hover:text-white hover:border-app-gold'
                      }`}
                  >
                    السابق
                  </button>
                  <span className="px-3 py-1">
                    صفحة {pagination.current_page} من {pagination.total_pages}
                  </span>
                  <button
                    disabled={pagination.current_page === pagination.total_pages}
                    onClick={() => setPageNumber(prev => prev + 1)}
                    className={`px-3 py-1 border rounded ${pagination.current_page === pagination.total_pages
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-app-gold hover:text-white hover:border-app-gold'
                      }`}
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
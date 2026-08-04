import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Printer, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { useGetAdminOrders, Order, OrderStatus, PaymentStatus } from '../requests/useGetAdminOrders';
import { useChangeOrderStatus, OrderStatusType } from '../requests/useChangeOrderStatus';
import { useMarkOrderPaid } from '../requests/useMarkOrderPaid';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const AdminOrders: React.FC = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatusType>('pending');
  const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState(false);

  // Filter and pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState<OrderStatus>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('');
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
    paymentStatus,
    from: fromDate,
    to: toDate,
    search: debouncedSearch,
  });

  // Change order status mutation
  const changeOrderStatusMutation = useChangeOrderStatus();
  const markOrderPaidMutation = useMarkOrderPaid();

  const orders = data?.items?.data || [];
  const pagination = data?.items?.pagination;

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);

    // Convert Arabic status back to English key for state management (select input)
    const arToEnMap: Record<string, OrderStatusType> = {
      'قيد الانتظار': 'pending',
      'مؤكد': 'confirmed',
      'قيد التجهيز': 'processing',
      'تم الشحن': 'shipped',
      'تم التوصيل': 'delivered',
      'مكتمل': 'completed',
      'ملغي': 'cancelled',
    };

    const mappedStatus = arToEnMap[order.status] || (order.status as OrderStatusType);
    setSelectedStatus(mappedStatus);
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

  /**
   * Cash-on-delivery orders that have not been settled yet.
   *
   * `payment_status` arrives localised from the API, so both spellings are
   * matched rather than the raw enum value.
   */
  const isUnpaidCashOrder = (order: Order): boolean =>
    order.payment_type === 'cash' &&
    order.payment_status !== 'مدفوع' &&
    order.payment_status !== 'Paid';

  /**
   * Records payment for a cash order, leaving its delivery status alone.
   *
   * Uses the dedicated `mark-paid` endpoint. This previously had to post
   * `status: delivered`, because settling a cash order was only possible as a
   * side effect of declaring it delivered.
   */
  const handleMarkAsPaid = async () => {
    if (!selectedOrder) return;

    try {
      await markOrderPaidMutation.mutateAsync(selectedOrder.id);

      setSelectedOrder({ ...selectedOrder, payment_status: 'مدفوع' });
      setShowMarkPaidConfirm(false);
      toast.success('تم تسجيل الدفع بنجاح');
    } catch (error) {
      console.error('Error marking order as paid:', error);
      setShowMarkPaidConfirm(false);
      toast.error('حدث خطأ أثناء تسجيل الدفع');
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
      'طريقة الدفع': order.payment_type === 'cash' ? 'نقداً (الدفع عند الاستلام)' : order.payment_type === 'knet' ? 'كي نت (Knet)' : order.payment_type,
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
    setPageNumber(1);
  };

  const handlePaymentStatusChange = (newPaymentStatus: string) => {
    setPaymentStatus(newPaymentStatus as PaymentStatus);
    setPageNumber(1);
  };

  const handleResetFilters = () => {
    setStatus('');
    setPaymentStatus('');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setDebouncedSearch('');
    setPageNumber(1);
  };

  // Status mapping from English and Arabic to localized labels and colors
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; colors: string }> = {
      // Order Statuses (English keys)
      'pending': { label: 'قيد الانتظار', colors: 'bg-yellow-100 text-yellow-700' },
      'confirmed': { label: 'مؤكد', colors: 'bg-cyan-100 text-cyan-600' },
      'processing': { label: 'قيد التجهيز', colors: 'bg-blue-100 text-blue-600' },
      'shipped': { label: 'تم الشحن', colors: 'bg-purple-100 text-purple-600' },
      'delivered': { label: 'تم التوصيل', colors: 'bg-emerald-100 text-emerald-600' },
      'completed': { label: 'مكتمل', colors: 'bg-green-100 text-green-600' },
      'cancelled': { label: 'ملغي', colors: 'bg-red-100 text-red-600' },

      // Order Statuses (Arabic response from API)
      'قيد الانتظار': { label: 'قيد الانتظار', colors: 'bg-yellow-100 text-yellow-700' },
      'مؤكد': { label: 'مؤكد', colors: 'bg-cyan-100 text-cyan-600' },
      'قيد التجهيز': { label: 'قيد التجهيز', colors: 'bg-blue-100 text-blue-600' },
      'تم الشحن': { label: 'تم الشحن', colors: 'bg-purple-100 text-purple-600' },
      'تم التوصيل': { label: 'تم التوصيل', colors: 'bg-emerald-100 text-emerald-600' },
      'مكتمل': { label: 'مكتمل', colors: 'bg-green-100 text-green-600' },
      'ملغي': { label: 'ملغي', colors: 'bg-red-100 text-red-600' },

      // Payment Statuses (Arabic response from API)
      'مدفوع': { label: 'مدفوع', colors: 'bg-emerald-100 text-emerald-600' },
      'فشل الدفع': { label: 'فشل الدفع', colors: 'bg-red-100 text-red-600' },
      'فشل': { label: 'فشل', colors: 'bg-red-100 text-red-600' },
      'قيد الدفع': { label: 'قيد الدفع', colors: 'bg-yellow-100 text-yellow-700' },
      'cash': { label: 'الدفع عند الاستلام', colors: 'bg-blue-100 text-blue-700' },
      'الدفع عند الاستلام': { label: 'الدفع عند الاستلام', colors: 'bg-blue-100 text-blue-700' },
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

  const handlePrint = () => {
    if (!selectedOrder) return;

    const itemsRows = selectedOrder.items.map((item) => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <img src="${item.product.main_image}" alt="" style="width:50px;height:50px;object-fit:cover;border-radius:6px;border:1px solid #eee" />
            <div>
              <div style="font-weight:700;font-size:13px">${item.product.name}</div>
              <div style="color:#888;font-size:11px">${item.product.brand?.name ?? ''}</div>
            </div>
          </div>
        </td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:center">${item.price} د.ك</td>
        <td style="text-align:center;font-weight:700">${item.total} د.ك</td>
      </tr>
    `).join('');

    const discountRow = parseFloat(selectedOrder.discount) > 0
      ? `<tr><td colspan="3" style="text-align:left;color:#b8962e">الخصم</td><td style="text-align:center;color:#b8962e;font-weight:700">- ${selectedOrder.discount} د.ك</td></tr>` : '';

    const walletRow = parseFloat(selectedOrder.wallet_amount) > 0
      ? `<tr><td colspan="3" style="text-align:left;color:#b8962e">خصم رصيد الجوائز</td><td style="text-align:center;color:#b8962e;font-weight:700">- ${selectedOrder.wallet_amount} د.ك</td></tr>` : '';

    const notesRow = selectedOrder.notes
      ? `<div style="margin-top:20px;padding:12px 16px;background:#fffbe6;border-right:4px solid #D6AD60;border-radius:6px;font-size:13px"><strong>ملاحظات العميل:</strong> ${selectedOrder.notes}</div>` : '';

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>فاتورة - ${selectedOrder.order_number}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Cairo', sans-serif; background: #fff; color: #1a1a1a; direction: rtl; }
          .page { max-width: 800px; margin: 0 auto; padding: 40px 30px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #D6AD60; margin-bottom: 28px; }
          .brand { font-size: 26px; font-weight: 900; color: #D6AD60; }
          .brand span { display: block; font-size: 12px; color: #888; font-weight: 400; margin-top: 2px; }
          .order-meta { text-align: left; font-size: 13px; }
          .order-meta strong { display: block; font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
          .order-meta .date { color: #888; font-size: 12px; }
          .section-title { font-size: 14px; font-weight: 700; color: #D6AD60; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
          .info-box { background: #fafafa; border: 1px solid #eee; border-radius: 10px; padding: 16px; }
          .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; border-bottom: 1px dashed #eee; }
          .info-row:last-child { border-bottom: none; }
          .info-row .label { color: #888; }
          .info-row .val { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead tr { background: #D6AD60; color: #fff; }
          thead th { padding: 10px 14px; font-size: 13px; font-weight: 700; }
          tbody tr { border-bottom: 1px solid #f0f0f0; }
          tbody tr:nth-child(even) { background: #fafafa; }
          tbody td { padding: 10px 14px; font-size: 13px; vertical-align: middle; }
          .totals { background: #fafafa; border: 1px solid #eee; border-radius: 10px; padding: 16px 20px; max-width: 320px; margin-right: auto; }
          .totals table { margin-bottom: 0; }
          .totals tr td { padding: 6px 4px; border: none; font-size: 13px; background: transparent; }
          .totals .grand { font-size: 16px; font-weight: 900; color: #D6AD60; border-top: 2px solid #D6AD60; padding-top: 10px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="brand">Trendy Hair<span>متجر ترندي هير</span></div>
            <div class="order-meta">
              <strong># ${selectedOrder.order_number}</strong>
              <div class="date">${new Date(selectedOrder.created_at).toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' })}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <div class="section-title">بيانات العميل</div>
              <div class="info-row"><span class="label">الاسم</span><span class="val">${selectedOrder.user.name}</span></div>
              <div class="info-row"><span class="label">الهاتف</span><span class="val" dir="ltr">${selectedOrder.user.phone}</span></div>
              ${selectedOrder.user.email ? `<div class="info-row"><span class="label">البريد</span><span class="val">${selectedOrder.user.email}</span></div>` : ''}
              <div class="info-row"><span class="label">العنوان</span><span class="val">${selectedOrder.governorate.name}، ${selectedOrder.city.name}</span></div>
            </div>
            <div class="info-box">
              <div class="section-title">تفاصيل الطلب</div>
              <div class="info-row"><span class="label">حالة الطلب</span><span class="val">${selectedOrder.status}</span></div>
              <div class="info-row"><span class="label">حالة الدفع</span><span class="val">${selectedOrder.payment_status}</span></div>
              <div class="info-row"><span class="label">طريقة الدفع</span><span class="val">${selectedOrder.payment_type === 'cash' ? 'نقداً (الدفع عند الاستلام)' : selectedOrder.payment_type === 'knet' ? 'كي نت (Knet)' : selectedOrder.payment_type}</span></div>
              <div class="info-row"><span class="label">عدد المنتجات</span><span class="val">${selectedOrder.items_count}</span></div>
            </div>
          </div>

          <div class="section-title">المنتجات</div>
          <table>
            <thead><tr><th style="text-align:right">المنتج</th><th style="text-align:center">الكمية</th><th style="text-align:center">السعر</th><th style="text-align:center">الإجمالي</th></tr></thead>
            <tbody>${itemsRows}</tbody>
          </table>

          <div class="totals">
            <table>
              <tr><td>المجموع الفرعي</td><td style="text-align:left;font-weight:600">${selectedOrder.subtotal} د.ك</td></tr>
              <tr><td>رسوم التوصيل</td><td style="text-align:left;font-weight:600">${selectedOrder.delivery_cost} د.ك</td></tr>
              ${discountRow}${walletRow}
              <tr class="grand"><td>الإجمالي النهائي</td><td style="text-align:left">${selectedOrder.total} د.ك</td></tr>
            </table>
          </div>

          ${notesRow}

          <div class="footer">شكراً لتسوقك مع Trendy Hair &bull; trandyhairapp.com</div>
        </div>
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  if (view === 'detail' && selectedOrder) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-white border border-app-card text-app-text px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-app-bg"
            >
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
          <button
            onClick={() => setView('list')}
            className="text-app-textSec hover:text-app-gold font-bold flex items-center gap-2"
          >
            العودة للقائمة
            ←
          </button>
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
                  <p className="font-bold text-app-text capitalize">
                    {selectedOrder.payment_type === 'cash' 
                      ? 'نقداً (الدفع عند الاستلام)' 
                      : selectedOrder.payment_type === 'knet' 
                        ? 'كي نت (Knet)' 
                        : selectedOrder.payment_type}
                  </p>
                  <p className="text-xs text-app-textSec mt-2 mb-1">حالة الدفع</p>
                  <StatusBadge status={selectedOrder.payment_status} />

                  {/* Cash is collected by the courier, so payment is recorded here. */}
                  {isUnpaidCashOrder(selectedOrder) && (
                    <button
                      onClick={() => setShowMarkPaidConfirm(true)}
                      disabled={markOrderPaidMutation.isPending}
                      className="mt-4 w-full bg-green-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      <span>تحديد كمدفوع</span>
                    </button>
                  )}
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

        {/* Mark-as-paid confirmation — this move is not reversible from here */}
        {showMarkPaidConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-app-text mb-4">تأكيد تسجيل الدفع</h3>

              <p className="text-sm text-app-textSec mb-4 leading-relaxed">
                سيتم تسجيل الطلب رقم <span className="font-bold text-app-text">{selectedOrder.order_number}</span> كمدفوع.
              </p>

              <ul className="text-sm text-app-text bg-app-bg border border-app-card rounded-xl p-4 mb-4 space-y-2 list-disc pr-5">
                <li>لن تتغير حالة التوصيل — سيتم تسجيل الدفع فقط.</li>
                {parseFloat(selectedOrder.wallet_amount) > 0 && (
                  <li>
                    سيتم خصم ما يعادل{' '}
                    <span className="font-bold text-app-gold">{selectedOrder.wallet_amount} د.ك</span>{' '}
                    من نقاط العميل.
                  </li>
                )}
                <li>سيتم إضافة نقاط الشراء إلى رصيد العميل.</li>
                <li className="text-red-600 font-bold">لا يمكن التراجع عن هذا الإجراء من لوحة التحكم.</li>
              </ul>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowMarkPaidConfirm(false)}
                  disabled={markOrderPaidMutation.isPending}
                  className="px-6 py-3 border border-app-card rounded-xl font-bold text-app-textSec hover:bg-app-bg transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={markOrderPaidMutation.isPending}
                  className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {markOrderPaidMutation.isPending && <Loader2 size={18} className="animate-spin" />}
                  <span>تأكيد</span>
                </button>
              </div>
            </div>
          </div>
        )}
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
          {/* Search */}
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

          {/* Delivery Status Filter */}
          <div className="relative flex items-center">
            <select
              className={`pl-7 pr-4 py-2 border rounded-xl bg-white outline-none focus:border-app-gold text-sm transition-colors ${status ? 'border-app-gold text-app-goldDark font-bold' : 'border-app-card'}`}
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">كل حالات التوصيل</option>
              <option value="pending">قيد الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="processing">قيد التجهيز</option>
              <option value="shipped">تم الشحن</option>
              <option value="delivered">تم التوصيل</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
            {status && (
              <button
                onClick={() => { setStatus(''); setPageNumber(1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-app-gold text-white text-xs leading-none hover:bg-app-goldDark"
                title="إزالة الفلتر"
              >×</button>
            )}
          </div>

          {/* Payment Status Filter */}
          <div className="relative flex items-center">
            <select
              className={`pl-7 pr-4 py-2 border rounded-xl bg-white outline-none focus:border-app-gold text-sm transition-colors ${paymentStatus ? 'border-app-gold text-app-goldDark font-bold' : 'border-app-card'}`}
              value={paymentStatus}
              onChange={(e) => handlePaymentStatusChange(e.target.value)}
            >
              <option value="">كل حالات الدفع</option>
              <option value="pending">في انتظار الدفع</option>
              <option value="paid">تم الدفع</option>
              <option value="failed">فشل الدفع</option>
              <option value="refunded">تم الإرجاع المالي</option>
              <option value="cash">الدفع عند الاستلام</option>
            </select>
            {paymentStatus && (
              <button
                onClick={() => { setPaymentStatus(''); setPageNumber(1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-app-gold text-white text-xs leading-none hover:bg-app-goldDark"
                title="إزالة الفلتر"
              >×</button>
            )}
          </div>

          {/* From Date */}
          <div className="relative flex items-center">
            <input
              type="date"
              className={`pl-7 pr-4 py-2 border rounded-xl bg-white outline-none focus:border-app-gold text-sm transition-colors ${fromDate ? 'border-app-gold text-app-goldDark font-bold' : 'border-app-card'}`}
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPageNumber(1); }}
            />
            {fromDate && (
              <button
                onClick={() => { setFromDate(''); setPageNumber(1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-app-gold text-white text-xs leading-none hover:bg-app-goldDark"
                title="إزالة الفلتر"
              >×</button>
            )}
          </div>

          {/* To Date */}
          <div className="relative flex items-center">
            <input
              type="date"
              className={`pl-7 pr-4 py-2 border rounded-xl bg-white outline-none focus:border-app-gold text-sm transition-colors ${toDate ? 'border-app-gold text-app-goldDark font-bold' : 'border-app-card'}`}
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPageNumber(1); }}
            />
            {toDate && (
              <button
                onClick={() => { setToDate(''); setPageNumber(1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-app-gold text-white text-xs leading-none hover:bg-app-goldDark"
                title="إزالة الفلتر"
              >×</button>
            )}
          </div>
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
                    <th className="px-6 py-4">حالة التوصيل</th>
                    <th className="px-6 py-4">حالة الدفع</th>
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
                      <td className="px-6 py-4"><StatusBadge status={order.payment_status} /></td>

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
import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Loader2, X, Upload, AlertCircle, Image as ImageIcon, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { useGetAdminBanners, Banner } from '../requests/useGetAdminBanners';
import { useCreateAdminBanner, CreateAdminBannerParams } from '../requests/useCreateAdminBanner';
import { useUpdateAdminBanner, UpdateAdminBannerParams } from '../requests/useUpdateAdminBanner';
import { useDeleteAdminBanner } from '../requests/useDeleteAdminBanner';
import { toast } from 'sonner';

const AdminBanners: React.FC = () => {
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title_ar: '',
        title_en: '',
        url: '',
        position: 1,
        image: null as File | null,
    });

    // Fetch banners
    const { data, isLoading, isError, error } = useGetAdminBanners({
        pageSize,
        pageNumber,
    });

    // Mutations
    const createBannerMutation = useCreateAdminBanner();
    const updateBannerMutation = useUpdateAdminBanner();
    const deleteBannerMutation = useDeleteAdminBanner();

    const banners = data?.items?.data || [];
    const pagination = data?.items?.pagination;

    const resetForm = () => {
        setFormData({
            title_ar: '',
            title_en: '',
            url: '',
            position: 1,
            image: null,
        });
        setImagePreview(null);
        setEditingBanner(null);
    };

    const handleOpenModal = (banner?: Banner) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title_ar: banner.title_ar,
                title_en: banner.title_en,
                url: banner.url,
                position: banner.position,
                image: null,
            });
            setImagePreview(banner.image);
        } else {
            const maxPosition = banners.length > 0 ? Math.max(...banners.map(b => b.position)) : 0;
            resetForm();
            setFormData(prev => ({ ...prev, position: maxPosition + 1 }));
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title_ar || !formData.title_en || !formData.url) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (!editingBanner && !formData.image) {
            toast.error('يرجى اختيار صورة للبانر');
            return;
        }

        try {
            if (editingBanner) {
                // Update banner
                const updateData: UpdateAdminBannerParams = {
                    id: editingBanner.id,
                    title_ar: formData.title_ar,
                    title_en: formData.title_en,
                    url: formData.url,
                    position: formData.position,
                };

                if (formData.image) {
                    updateData.image = formData.image;
                }

                await updateBannerMutation.mutateAsync(updateData);
                toast.success('تم تحديث البانر بنجاح');
            } else {
                // Create banner
                const createData: CreateAdminBannerParams = {
                    title_ar: formData.title_ar,
                    title_en: formData.title_en,
                    url: formData.url,
                    position: formData.position,
                    image: formData.image!,
                };

                await createBannerMutation.mutateAsync(createData);
                toast.success('تم إضافة البانر بنجاح');
            }

            handleCloseModal();
        } catch (error) {
            console.error('Error saving banner:', error);
            toast.error('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const handleDelete = async (bannerId: number, bannerTitle: string) => {
        if (window.confirm(`هل أنت متأكد من حذف البانر "${bannerTitle}"؟`)) {
            try {
                await deleteBannerMutation.mutateAsync(bannerId);
                toast.success('تم حذف البانر بنجاح');
            } catch (error) {
                console.error('Error deleting banner:', error);
                toast.error('حدث خطأ أثناء حذف البانر');
            }
        }
    };

    const StatusBadge = ({ isActive }: { isActive: number }) => {
        return isActive === 1 ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 flex items-center gap-1 w-fit">
                <CheckCircle2 size={14} />
                نشط
            </span>
        ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 flex items-center gap-1 w-fit">
                <AlertCircle size={14} />
                غير نشط
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-app-text">البنرات</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-app-gold text-white px-6 py-3 rounded-xl font-bold hover:bg-app-goldDark flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span>إضافة بانر جديد</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 overflow-hidden">
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
                            <p className="text-app-text font-bold">حدث خطأ في تحميل البنرات</p>
                            <p className="text-app-textSec text-sm mt-1">{error?.message || 'يرجى المحاولة مرة أخرى'}</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !isError && banners.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <AlertCircle className="mx-auto text-app-textSec mb-2" size={40} />
                            <p className="text-app-text font-bold">لا توجد بنرات</p>
                        </div>
                    </div>
                )}

                {/* Table */}
                {!isLoading && !isError && banners.length > 0 && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                                    <tr>
                                        <th className="px-6 py-4">الصورة</th>
                                        <th className="px-6 py-4">العنوان (عربي)</th>
                                        <th className="px-6 py-4">العنوان (English)</th>
                                        <th className="px-6 py-4">الرابط</th>
                                        <th className="px-6 py-4">الترتيب</th>
                                        <th className="px-6 py-4">الحالة</th>
                                        <th className="px-6 py-4">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-app-card/30 text-sm">
                                    {banners.map((banner) => (
                                        <tr key={banner.id} className="hover:bg-app-bg/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <img
                                                    src={banner.image}
                                                    alt={banner.title_ar}
                                                    className="h-12 w-24 object-cover rounded-lg border border-app-card"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-bold text-app-text">{banner.title_ar}</td>
                                            <td className="px-6 py-4 text-app-textSec">{banner.title_en}</td>
                                            <td className="px-6 py-4">
                                                <a
                                                    href={banner.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                                                >
                                                    <LinkIcon size={12} />
                                                    {banner.url}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-app-bg rounded font-bold">{banner.position}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge isActive={banner.is_active} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(banner)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(banner.id, banner.title_ar)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
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

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-app-card/30">
                            <h3 className="text-xl font-bold text-app-text">
                                {editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-app-textSec hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">
                                    صورة البانر {!editingBanner && <span className="text-red-500">*</span>}
                                </label>
                                {imagePreview && (
                                    <div className="mb-3">
                                        <img src={imagePreview} alt="Preview" className="w-full h-32 rounded-xl border border-app-card object-cover" />
                                    </div>
                                )}
                                <label className="cursor-pointer">
                                    <div className="border-2 border-dashed border-app-card rounded-xl p-4 text-center hover:border-app-gold transition-colors">
                                        <Upload className="mx-auto text-app-textSec mb-2" size={24} />
                                        <p className="text-sm text-app-textSec">انقر لاختيار صورة</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        required={!editingBanner}
                                    />
                                </label>
                            </div>

                            {/* Arabic Title */}
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">
                                    العنوان بالعربية <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title_ar}
                                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                                    className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    placeholder="أدخل عنوان البانر بالعربية"
                                    required
                                />
                            </div>

                            {/* English Title */}
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">
                                    العنوان بالإنجليزية <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title_en}
                                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                                    className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    placeholder="Enter banner title in English"
                                    required
                                    dir="ltr"
                                />
                            </div>

                            {/* URL */}
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">
                                    الرابط <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    placeholder="/products أو /categories/hair-care"
                                    required
                                    dir="ltr"
                                />
                            </div>

                            {/* Position */}
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">
                                    الترتيب <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
                                    className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    min="1"
                                    required
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-3 border border-app-card rounded-xl font-bold text-app-text hover:bg-app-bg transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={createBannerMutation.isPending || updateBannerMutation.isPending}
                                    className="flex-1 px-4 py-3 bg-app-gold text-white rounded-xl font-bold hover:bg-app-goldDark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {(createBannerMutation.isPending || updateBannerMutation.isPending) ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        editingBanner ? 'تحديث' : 'إضافة'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBanners;

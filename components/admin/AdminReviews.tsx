import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Loader2, X, Upload, AlertCircle, Video, Image as ImageIcon } from 'lucide-react';
import { useGetAdminReviews, Review } from '../requests/useGetAdminReviews';
import { useCreateAdminReview, CreateAdminReviewParams } from '../requests/useCreateAdminReview';
import { useUpdateAdminReview, UpdateAdminReviewParams } from '../requests/useUpdateAdminReview';
import { useDeleteAdminReview } from '../requests/useDeleteAdminReview';
import { toast } from 'sonner';

const AdminReviews: React.FC = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    video: null as File | null,
    image: null as File | null,
  });

  // Fetch reviews
  const { data, isLoading, isError, error } = useGetAdminReviews({
    pageSize,
    pageNumber,
  });

  // Mutations
  const createReviewMutation = useCreateAdminReview();
  const updateReviewMutation = useUpdateAdminReview();
  const deleteReviewMutation = useDeleteAdminReview();

  const reviews = data?.items?.products || [];
  const pagination = data?.items?.pagination;

  const resetForm = () => {
    setFormData({
      title_ar: '',
      title_en: '',
      video: null,
      image: null,
    });
    setVideoPreview(null);
    setImagePreview(null);
    setEditingReview(null);
  };

  const handleOpenModal = (review?: Review) => {
    if (review) {
      setEditingReview(review);
      setFormData({
        title_ar: review.title_ar,
        title_en: review.title_en,
        video: null,
        image: null,
      });
      setVideoPreview(review.video);
      setImagePreview(review.image);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, video: file });
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
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
    if (!formData.title_ar || !formData.title_en) {
      toast.error('يرجى ملء العنوان بالعربية والإنجليزية');
      return;
    }

    if (!editingReview && !formData.video) {
      toast.error('يرجى اختيار فيديو للمراجعة');
      return;
    }

    try {
      if (editingReview) {
        // Update review
        const updateData: UpdateAdminReviewParams = {
          id: editingReview.id,
          title_ar: formData.title_ar,
          title_en: formData.title_en,
        };

        if (formData.video) {
          updateData.video = formData.video;
        }

        if (formData.image) {
          updateData.image = formData.image;
        }

        await updateReviewMutation.mutateAsync(updateData);
        toast.success('تم تحديث المراجعة بنجاح');
      } else {
        // Create review
        const createData: CreateAdminReviewParams = {
          title_ar: formData.title_ar,
          title_en: formData.title_en,
        };

        if (formData.video) {
          createData.video = formData.video;
        }

        if (formData.image) {
          createData.image = formData.image;
        }

        await createReviewMutation.mutateAsync(createData);
        toast.success('تم إضافة المراجعة بنجاح');
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleDelete = async (reviewId: number, reviewTitle: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المراجعة "${reviewTitle}"؟`)) {
      try {
        await deleteReviewMutation.mutateAsync(reviewId);
        toast.success('تم حذف المراجعة بنجاح');
      } catch (error) {
        console.error('Error deleting review:', error);
        toast.error('حدث خطأ أثناء حذف المراجعة');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-app-text">المراجعات</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-app-gold text-white px-6 py-3 rounded-xl font-bold hover:bg-app-goldDark flex items-center gap-2"
        >
          <Plus size={20} />
          <span>إضافة مراجعة جديدة</span>
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
              <p className="text-app-text font-bold">حدث خطأ في تحميل المراجعات</p>
              <p className="text-app-textSec text-sm mt-1">{error?.message || 'يرجى المحاولة مرة أخرى'}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && reviews.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="mx-auto text-app-textSec mb-2" size={40} />
              <p className="text-app-text font-bold">لا توجد مراجعات</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && reviews.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">المعاينة</th>
                    <th className="px-6 py-4">العنوان (عربي)</th>
                    <th className="px-6 py-4">العنوان (English)</th>
                    <th className="px-6 py-4">نوع المحتوى</th>
                    <th className="px-6 py-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-card/30 text-sm">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-app-bg/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-app-card bg-white relative group">
                          {review.image ? (
                            <img src={review.image} alt={review.title_ar} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-app-bg">
                              <Video size={24} className="text-app-textSec" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-app-text">{review.title_ar}</td>
                      <td className="px-6 py-4 text-app-textSec">{review.title_en}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {review.video && (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-600 flex items-center gap-1">
                              <Video size={12} />
                              فيديو
                            </span>
                          )}
                          {review.image && (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-600 flex items-center gap-1">
                              <ImageIcon size={12} />
                              صورة
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(review)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(review.id, review.title_ar)}
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
                {editingReview ? 'تعديل المراجعة' : 'إضافة مراجعة جديدة'}
              </h3>
              <button onClick={handleCloseModal} className="text-app-textSec hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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
                  placeholder="أدخل عنوان المراجعة بالعربية"
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
                  placeholder="Enter review title in English"
                  required
                  dir="ltr"
                />
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-bold text-app-text mb-2">
                  فيديو المراجعة {!editingReview && <span className="text-red-500">*</span>}
                </label>
                {videoPreview && (
                  <div className="mb-3">
                    <video src={videoPreview} controls className="w-full max-h-48 rounded-xl border border-app-card" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-app-card rounded-xl p-4 text-center hover:border-app-gold transition-colors">
                    <Upload className="mx-auto text-app-textSec mb-2" size={24} />
                    <p className="text-sm text-app-textSec">انقر لاختيار فيديو</p>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                    required={!editingReview}
                  />
                </label>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-app-text mb-2">صورة مصغرة (اختياري)</label>
                {imagePreview && (
                  <div className="mb-3">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-48 rounded-xl border border-app-card object-cover" />
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
                  />
                </label>
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
                  disabled={createReviewMutation.isPending || updateReviewMutation.isPending}
                  className="flex-1 px-4 py-3 bg-app-gold text-white rounded-xl font-bold hover:bg-app-goldDark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {(createReviewMutation.isPending || updateReviewMutation.isPending) ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      جاري الحفظ...
                    </>
                  ) : (
                    editingReview ? 'تحديث' : 'إضافة'
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

export default AdminReviews;

import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { useGetAdminUsers, AdminUser } from '../requests/useGetAdminUsers';
import { useCreateAdminUser, CreateAdminUserParams } from '../requests/useCreateAdminUser';
import { useUpdateAdminUser, UpdateAdminUserParams } from '../requests/useUpdateAdminUser';
import { useDeleteAdminUser } from '../requests/useDeleteAdminUser';
import { toast } from 'sonner';

const AdminCustomers: React.FC = () => {
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        is_active: 1,
        photo: null as File | null,
    });

    // Fetch users
    const { data, isLoading, isError, error } = useGetAdminUsers({
        pageSize,
        pageNumber,
    });

    // Mutations
    const createUserMutation = useCreateAdminUser();
    const updateUserMutation = useUpdateAdminUser();
    const deleteUserMutation = useDeleteAdminUser();

    const users = data?.items?.data || [];
    const pagination = data?.items?.pagination;

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            is_active: 1,
            photo: null,
        });
        setPhotoPreview(null);
        setEditingUser(null);
    };

    const handleOpenModal = (user?: AdminUser) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: '',
                is_active: user.is_active,
                photo: null,
            });
            setPhotoPreview(user.photo);
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, photo: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (!editingUser && !formData.password) {
            toast.error('كلمة المرور مطلوبة');
            return;
        }

        if (formData.password && formData.password.length < 8) {
            toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }

        try {
            if (editingUser) {
                // Update user
                const updateData: UpdateAdminUserParams = {
                    id: editingUser.id,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    is_active: formData.is_active,
                };

                if (formData.password) {
                    updateData.password = formData.password;
                }

                if (formData.photo) {
                    updateData.photo = formData.photo;
                }

                await updateUserMutation.mutateAsync(updateData);
                toast.success('تم تحديث العميل بنجاح');
            } else {
                // Create user
                const createData: CreateAdminUserParams = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    is_active: formData.is_active,
                };

                if (formData.photo) {
                    createData.photo = formData.photo;
                }

                await createUserMutation.mutateAsync(createData);
                toast.success('تم إضافة العميل بنجاح');
            }

            handleCloseModal();
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const handleDelete = async (userId: number, userName: string) => {
        if (window.confirm(`هل أنت متأكد من حذف العميل "${userName}"؟`)) {
            try {
                await deleteUserMutation.mutateAsync(userId);
                toast.success('تم حذف العميل بنجاح');
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error('حدث خطأ أثناء حذف العميل');
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

    const VerifyBadge = ({ isVerify }: { isVerify: number }) => {
        return isVerify === 1 ? (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-600">
                موثق
            </span>
        ) : (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">
                غير موثق
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-app-text">إدارة العملاء</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-app-gold text-white px-6 py-2 rounded-xl font-bold hover:bg-app-goldDark flex items-center gap-2"
                >
                    <Plus size={18} />
                    إضافة عميل جديد
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
                            <p className="text-app-text font-bold">حدث خطأ في تحميل العملاء</p>
                            <p className="text-app-textSec text-sm mt-1">{error?.message || 'يرجى المحاولة مرة أخرى'}</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !isError && users.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <AlertCircle className="mx-auto text-app-textSec mb-2" size={40} />
                            <p className="text-app-text font-bold">لا توجد عملاء</p>
                        </div>
                    </div>
                )}

                {/* Table */}
                {!isLoading && !isError && users.length > 0 && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                                    <tr>
                                        <th className="px-6 py-4">الصورة</th>
                                        <th className="px-6 py-4">الاسم</th>
                                        <th className="px-6 py-4">البريد الإلكتروني</th>
                                        <th className="px-6 py-4">رقم الهاتف</th>
                                        <th className="px-6 py-4">المحفظة</th>
                                        <th className="px-6 py-4">التوثيق</th>
                                        <th className="px-6 py-4">الحالة</th>
                                        <th className="px-6 py-4">تاريخ التسجيل</th>
                                        <th className="px-6 py-4">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-app-card/30 text-sm">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-app-bg/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <img
                                                    src={user.photo}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-bold text-app-text">{user.name}</td>
                                            <td className="px-6 py-4 text-app-textSec">{user.email || '-'}</td>
                                            <td className="px-6 py-4 text-app-textSec" dir="ltr">{user.phone}</td>
                                            <td className="px-6 py-4 font-bold text-app-gold">{user.wallet} د.ك</td>
                                            <td className="px-6 py-4">
                                                <VerifyBadge isVerify={user.is_verify} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge isActive={user.is_active} />
                                            </td>
                                            <td className="px-6 py-4 text-app-textSec">
                                                {new Date(user.created_at).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(user)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id, user.name)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-app-card/30 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-app-text">
                                {editingUser ? 'تعديل عميل' : 'إضافة عميل جديد'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-app-textSec hover:text-app-gold">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Photo Upload */}
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">صورة العميل</label>
                                <div className="flex items-center gap-4">
                                    {photoPreview && (
                                        <img
                                            src={photoPreview}
                                            alt="Preview"
                                            className="w-20 h-20 rounded-full object-cover"
                                        />
                                    )}
                                    <label className="flex-1 cursor-pointer">
                                        <div className="border-2 border-dashed border-app-card rounded-xl p-4 text-center hover:border-app-gold transition-colors">
                                            <Upload className="mx-auto text-app-textSec mb-2" size={24} />
                                            <p className="text-sm text-app-textSec">انقر لاختيار صورة</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">
                                    الاسم <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    placeholder="أدخل اسم العميل"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">
                                    البريد الإلكتروني <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    placeholder="example@email.com"
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">
                                    رقم الهاتف <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    placeholder="+965xxxxxxxx"
                                    required
                                    dir="ltr"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">
                                    كلمة المرور {!editingUser && <span className="text-red-500">*</span>}
                                    {editingUser && <span className="text-xs text-app-textSec mr-1">(اتركه فارغاً إذا كنت لا تريد التغيير)</span>}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    placeholder="8 أحرف على الأقل"
                                    required={!editingUser}
                                    minLength={8}
                                />
                            </div>

                            {/* Active Status */}
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active === 1}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                                        className="w-5 h-5 text-app-gold rounded focus:ring-app-gold"
                                    />
                                    <span className="text-sm font-bold text-app-text">حساب نشط</span>
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
                                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                                    className="flex-1 px-4 py-3 bg-app-gold text-white rounded-xl font-bold hover:bg-app-goldDark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {(createUserMutation.isPending || updateUserMutation.isPending) ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        editingUser ? 'تحديث' : 'إضافة'
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

export default AdminCustomers;

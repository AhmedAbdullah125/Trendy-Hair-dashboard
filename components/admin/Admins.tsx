import React, { useState, useEffect } from 'react';
import { useGetAdmins } from '../requests/useGetAdmins';
import { useCreateAdmin } from '../requests/useCreateAdmin';
import { useUpdateAdmin } from '../requests/useUpdateAdmin';
import { useDeleteAdmin } from '../requests/useDeleteAdmin';
import { useGetAdminRoles } from '../requests/useGetAdminRoles';
import { useGetAdmin } from '../requests/useGetAdmin';
import { Plus, Edit3, Trash2, X, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Admin {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string;
    photo: string;
    account_type: string;
    status: string;
    created_at: string;
}

const Admins: React.FC = () => {
    const pageSize = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<any | null>(null); // Use any for form data to handle password/role logic easily

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState<number | null>(null);

    const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);

    // Queries
    const { data: adminsData, isLoading: adminsLoading } = useGetAdmins(pageSize, currentPage);
    const { data: rolesData } = useGetAdminRoles(100, 1); // Fetch roles for dropdown
    const { data: singleAdminData, isLoading: singleAdminLoading } = useGetAdmin(selectedAdminId);

    // Mutations
    const createMutation = useCreateAdmin();
    const updateMutation = useUpdateAdmin();
    const deleteMutation = useDeleteAdmin();

    const admins = adminsData?.items?.admins || [];
    const pagination = adminsData?.items?.pagination || {
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        page_size: 10
    };

    const roles = rolesData?.items?.roles || [];

    // Effect to populate form when single admin data is fetched
    useEffect(() => {
        if (singleAdminData?.items?.admins?.[0] && selectedAdminId) {
            const admin = singleAdminData.items.admins[0];
            setEditingAdmin({
                id: admin.id,
                name: admin.name,
                phone: admin.phone,
                email: admin.email,
                role: admin.account_type,
                password: ''
            });
        }
    }, [singleAdminData, selectedAdminId]);

    const handleOpenModal = (admin?: Admin) => {
        if (admin) {
            setSelectedAdminId(admin.id);
            setEditingAdmin({
                id: admin.id,
                name: admin.name,
                phone: admin.phone || '',
                email: admin.email || '',
                role: admin.account_type || '',
                password: ''
            });
        } else {
            setSelectedAdminId(null);
            setEditingAdmin({
                name: '',
                phone: '',
                email: '',
                password: '',
                role: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setAdminToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (adminToDelete) {
            await deleteMutation.mutateAsync(adminToDelete);
            setDeleteConfirmOpen(false);
            setAdminToDelete(null);
        }
    };

    const handleSave = async () => {
        if (!editingAdmin || !editingAdmin.name || !editingAdmin.email || !editingAdmin.role) return;

        // Validation
        if (editingAdmin.phone.length !== 8) {
            alert("رقم الهاتف يجب أن يكون 8 أرقام");
            return;
        }
        if (!editingAdmin.id && (!editingAdmin.password || editingAdmin.password.length < 6)) {
            alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            return;
        }

        if (editingAdmin.id) {
            await updateMutation.mutateAsync({
                id: editingAdmin.id,
                name: editingAdmin.name,
                phone: editingAdmin.phone,
                email: editingAdmin.email,
                password: editingAdmin.password || undefined,
                role: editingAdmin.role
            });
        } else {
            await createMutation.mutateAsync({
                name: editingAdmin.name,
                phone: editingAdmin.phone,
                email: editingAdmin.email,
                password: editingAdmin.password,
                role: editingAdmin.role
            });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-app-text">إدارة المشرفين</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-app-gold text-white px-6 py-3 rounded-xl font-bold hover:bg-app-goldDark flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span>إضافة مشرف جديد</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 overflow-hidden">
                {adminsLoading ? (
                    <div className="py-20 text-center">
                        <div className="w-8 h-8 border-2 border-app-gold/30 border-t-app-gold rounded-full animate-spin mx-auto" />
                        <p className="mt-4 text-app-textSec">جاري تحميل المشرفين...</p>
                    </div>
                ) : (
                    <table className="w-full text-right">
                        <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4">الاسم</th>
                                <th className="px-6 py-4">البريد الإلكتروني</th>
                                <th className="px-6 py-4">الهاتف</th>
                                <th className="px-6 py-4">نوع الحساب</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-card/30 text-sm">
                            {admins.map((admin: Admin) => (
                                <tr key={admin.id} className="hover:bg-app-bg/50 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-app-card">
                                            <img src={admin.photo} alt={admin.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-app-text">{admin.name}</div>
                                            <div className="text-xs text-app-textSec">{admin.username}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-app-textSec">{admin.email}</td>
                                    <td className="px-6 py-4 text-app-textSec">{admin.phone}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs font-bold">
                                            {admin.account_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${admin.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {admin.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(admin)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(admin.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && editingAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-app-card/30">
                            <h3 className="text-xl font-bold text-app-text">
                                {editingAdmin.id ? 'تعديل المشرف' : 'إضافة مشرف جديد'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-app-textSec hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            {singleAdminLoading && selectedAdminId ? (
                                <div className="py-10 text-center">
                                    <div className="w-8 h-8 border-2 border-app-gold/30 border-t-app-gold rounded-full animate-spin mx-auto" />
                                    <p className="mt-4 text-app-textSec">جاري تحميل بيانات المشرف...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-app-text mb-2">الاسم</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                                value={editingAdmin.name}
                                                onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-app-text mb-2">رقم الهاتف (8 أرقام)</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                                value={editingAdmin?.phone}
                                                onChange={(e) => setEditingAdmin({ ...editingAdmin, phone: e.target.value })}
                                                maxLength={8}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-app-text mb-2">البريد الإلكتروني</label>
                                        <input
                                            type="email"
                                            className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                            value={editingAdmin?.email}
                                            onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-app-text mb-2">
                                            كلمة المرور {editingAdmin.id && '(اتركه فارغاً إذا لم ترد التغيير)'}
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                            value={editingAdmin.password}
                                            onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-app-text mb-2">الدور (Role)</label>
                                        <select
                                            className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                            value={editingAdmin.role}
                                            onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value })}
                                        >
                                            <option value="">اختر الدور</option>
                                            {roles.map((role: any) => (
                                                <option key={role.id} value={role.name}>{role.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t border-app-card/30 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 font-bold text-app-textSec hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!editingAdmin.name || !editingAdmin.email || !editingAdmin.role || createMutation.isPending || updateMutation.isPending}
                                className="px-8 py-3 bg-app-gold text-white font-bold rounded-xl hover:bg-app-goldDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {(createMutation.isPending || updateMutation.isPending) && (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                <span>{editingAdmin.id ? 'تحديث' : 'حفظ'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
                        <div className="bg-red-500 p-6 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white">تأكيد الحذف</h3>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-app-text font-bold text-lg mb-2">هل أنت متأكد من حذف هذا المشرف؟</p>
                            <p className="text-app-textSec text-sm">لا يمكن التراجع عن هذا الإجراء</p>
                        </div>
                        <div className="p-6 bg-gray-50 flex gap-3 justify-center">
                            <button
                                onClick={() => {
                                    setDeleteConfirmOpen(false);
                                    setAdminToDelete(null);
                                }}
                                className="px-6 py-3 font-bold text-app-text bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                                className="px-8 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {deleteMutation.isPending && (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                <span>حذف</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admins;

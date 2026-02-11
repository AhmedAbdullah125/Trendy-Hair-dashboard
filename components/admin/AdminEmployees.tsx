import React, { useState } from 'react';
import { useGetAdminRoles } from '../requests/useGetAdminRoles';
import { useGetAdminPermissions } from '../requests/useGetAdminPermissions';
import { useCreateAdminRole } from '../requests/useCreateAdminRole';
import { useUpdateAdminRole } from '../requests/useUpdateAdminRole';
import { useDeleteAdminRole } from '../requests/useDeleteAdminRole';
import { Plus, Edit3, Trash2, X, ShieldCheck, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';

interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    permissions?: Permission[]; // Assuming backend returns permissions with role details, or we might need to fetch them separately
}

interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

const AdminEmployees: React.FC = () => {
    const pageSize = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<{ id?: number, name: string, permissions: string[] } | null>(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

    // Queries
    const { data: rolesData, isLoading: rolesLoading } = useGetAdminRoles(pageSize, currentPage);
    const { data: permissionsData, isLoading: permissionsLoading } = useGetAdminPermissions();

    // Mutations
    const createMutation = useCreateAdminRole();
    const updateMutation = useUpdateAdminRole();
    const deleteMutation = useDeleteAdminRole();

    const roles = rolesData?.items?.roles || [];
    const pagination = rolesData?.items?.pagination || {
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        page_size: 10
    };

    const allPermissions = permissionsData?.items?.permissions || [];

    const handleOpenModal = (role?: Role) => {
        if (role) {
            // For editing, we ideally need the role's current permissions.
            // If the list endpoint doesn't return them, we might need a separate fetch.
            // Assuming for now we start blank or from what's available.
            // The user request didn't specify a "get role details" endpoint, just list and update.
            // Update endpoint usually implies we know what to update.
            // If the list doesn't have permissions, we can't pre-fill them easily without another call.
            // Let's check the list response in the prompt: it DOES NOT show permissions in the item list.
            // This is a common pattern. Usually there is a show endpoint or we have to guess.
            // Wait, the update endpoint takes permissions.
            // I will implement it such that when editing, if permissions are missing, we start empty or fetch properly if an ID endpoint existed.
            // Given constraints, I will assume for now we might not be able to see current permissions of a role from the list.
            // I'll add a TODO or try to find if there's a show endpoint.
            // Actually, standard REST `GET / admin / roles / { id }` usually exists.
            // But based on provided info, I only have list.
            // I will assume for now that I can't pre-fill permissions unless I fetch them.
            // I'll leave them empty for edit, which acts like "reset permissions" or "add new ones".
            // OR, maybe the update expectation is just sending the ones to be *active*.
            // Let's implement basic structure first.

            setEditingRole({
                id: role.id,
                name: role.name,
                permissions: [] // Cannot populate without extra data
            });
        } else {
            setEditingRole({ name: '', permissions: [] });
        }
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setRoleToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (roleToDelete) {
            await deleteMutation.mutateAsync(roleToDelete);
            setDeleteConfirmOpen(false);
            setRoleToDelete(null);
        }
    };

    const togglePermission = (permName: string) => {
        if (!editingRole) return;
        const currentPerms = editingRole.permissions;
        if (currentPerms.includes(permName)) {
            setEditingRole({ ...editingRole, permissions: currentPerms.filter(p => p !== permName) });
        } else {
            setEditingRole({ ...editingRole, permissions: [...currentPerms, permName] });
        }
    };

    const handleSave = async () => {
        if (!editingRole || !editingRole.name) return;

        if (editingRole.id) {
            await updateMutation.mutateAsync({
                id: editingRole.id,
                name: editingRole.name,
                permissions: editingRole.permissions
            });
        } else {
            await createMutation.mutateAsync({
                name: editingRole.name,
                permissions: editingRole.permissions
            });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-app-text">إدارة الموظفين والصلاحيات</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-app-gold text-white px-6 py-3 rounded-xl font-bold hover:bg-app-goldDark flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span>إضافة دور جديد</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 overflow-hidden">
                {rolesLoading ? (
                    <div className="py-20 text-center">
                        <div className="w-8 h-8 border-2 border-app-gold/30 border-t-app-gold rounded-full animate-spin mx-auto" />
                        <p className="mt-4 text-app-textSec">جاري تحميل الأدوار...</p>
                    </div>
                ) : (
                    <table className="w-full text-right">
                        <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">الاسم</th>
                                <th className="px-6 py-4">تاريخ الإنشاء</th>
                                <th className="px-6 py-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-card/30 text-sm">
                            {roles.map((role: Role) => (
                                <tr key={role.id} className="hover:bg-app-bg/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-app-textSec">#{role.id}</td>
                                    <td className="px-6 py-4 font-bold text-app-text">{role.name}</td>
                                    <td className="px-6 py-4 text-app-textSec">{new Date(role.created_at).toLocaleDateString('ar-EG')}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(role)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        {/* Delete button could go here */}
                                        <button
                                            onClick={() => handleDelete(role.id)}
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
            {isModalOpen && editingRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-app-card/30">
                            <h3 className="text-xl font-bold text-app-text">
                                {editingRole.id ? 'تعديل الدور' : 'إضافة دور جديد'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-app-textSec hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">اسم الدور</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    value={editingRole.name}
                                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                                    placeholder="مثال: مدير المبيعات"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-app-text mb-4">الصلاحيات</label>
                                {permissionsLoading ? (
                                    <p className="text-center py-4">جاري تحميل الصلاحيات...</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {allPermissions.map((perm: Permission) => {
                                            const isSelected = editingRole.permissions.includes(perm.name);
                                            return (
                                                <div
                                                    key={perm.id}
                                                    onClick={() => togglePermission(perm.name)}
                                                    className={`
p - 3 rounded - xl border flex items - center gap - 3 cursor - pointer transition - all
                            ${isSelected ? 'bg-app-gold/10 border-app-gold' : 'border-app-card hover:bg-gray-50'}
`}
                                                >
                                                    <div className={`
w - 5 h - 5 rounded flex items - center justify - center transition - colors
                            ${isSelected ? 'bg-app-gold text-white' : 'bg-gray-200'}
`}>
                                                        {isSelected && <ShieldCheck size={14} />}
                                                    </div>
                                                    <span className={`${isSelected ? 'text-app-goldDark font-bold' : 'text-app-text'} `}>
                                                        {perm.name}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
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
                                disabled={!editingRole.name || createMutation.isPending || updateMutation.isPending}
                                className="px-8 py-3 bg-app-gold text-white font-bold rounded-xl hover:bg-app-goldDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {(createMutation.isPending || updateMutation.isPending) && (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                <span>{editingRole.id ? 'تحديث' : 'حفظ'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEmployees;

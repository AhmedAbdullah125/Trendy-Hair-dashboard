import React, { useEffect, useRef, useState } from 'react';
import { useGetAdminRoles } from '../requests/useGetAdminRoles';
import { useGetAdminRolePermissions } from '../requests/useGetAdminRole';
import { shouldSeedPermissions } from '../../lib/rolePermissions';
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

    /**
     * Each listed role's permissions, keyed by role id.
     *
     * The list endpoint does not return them, so they are fetched per role and
     * shared with the edit modal through one cache. Without this the table could
     * only show a name and a date — there was no way to see what any role could
     * actually do, which is half of what was reported.
     */
    const roleIds = roles.map((role: Role) => role.id);
    const { permissionsByRole: editingRolePermissions, isLoading: rolePermissionsLoading } =
        useGetAdminRolePermissions(roleIds);

    /**
     * Role id whose permissions have already been seeded into the open form.
     *
     * Tracked explicitly rather than inferred from the form being empty: an
     * admin clearing every box is a legitimate edit, and an "is it empty?" test
     * would read that as unseeded and put the permissions straight back.
     */
    const seededRoleRef = useRef<number | null>(null);

    // The modal can open before the role's permissions have arrived, so fill
    // them in when they do rather than leaving the boxes blank.
    useEffect(() => {
        const roleId = editingRole?.id;
        const fetched = roleId ? editingRolePermissions[roleId] : undefined;

        if (!shouldSeedPermissions(seededRoleRef.current, roleId, fetched)) return;

        // Both are non-null here — shouldSeedPermissions returns false otherwise.
        seededRoleRef.current = roleId as number;
        setEditingRole((current) =>
            current?.id === roleId ? { ...current, permissions: fetched as string[] } : current
        );
    }, [editingRole?.id, editingRolePermissions]);

    const handleOpenModal = (role?: Role) => {
        // Reopening re-seeds from whatever the cache now holds, so a role edited
        // earlier in the session does not show the previous session's ticks.
        seededRoleRef.current = null;

        if (role) {
            setEditingRole({
                id: role.id,
                name: role.name,
                // Filled in by the effect below once the role's own permissions
                // arrive. This used to be left as `[]` permanently — nothing ever
                // fetched them — so every tick box opened blank and pressing
                // تحديث posted an empty list, stripping the role of everything
                // it had.
                permissions: editingRolePermissions[role.id] ?? [],
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
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <div className="overflow-x-auto">
<table className="w-full text-right">
                        <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">الاسم</th>
                                <th className="px-6 py-4">الصلاحيات</th>
                                <th className="px-6 py-4">تاريخ الإنشاء</th>
                                <th className="px-6 py-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-card/30 text-sm">
                            {roles.map((role: Role) => (
                                <tr key={role.id} className="hover:bg-app-bg/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-app-textSec">#{role.id}</td>
                                    <td className="px-6 py-4 font-bold text-app-text">{role.name}</td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const granted = editingRolePermissions[role.id];

                                            if (!granted) {
                                                return (
                                                    <span className="text-xs text-app-textSec">
                                                        {rolePermissionsLoading ? 'جاري التحميل…' : '—'}
                                                    </span>
                                                );
                                            }

                                            if (granted.length === 0) {
                                                return <span className="text-xs text-app-textSec">لا توجد صلاحيات</span>;
                                            }

                                            // Capped so a role with everything ticked does not push the
                                            // actions column off the row; the full set is in the modal.
                                            const shown = granted.slice(0, 3);
                                            const rest = granted.length - shown.length;

                                            return (
                                                <div className="flex flex-wrap gap-1 max-w-xs" title={granted.join('، ')}>
                                                    {shown.map((name) => (
                                                        <span
                                                            key={name}
                                                            className="bg-app-gold/10 text-app-goldDark px-2 py-0.5 rounded text-[11px] font-bold"
                                                        >
                                                            {name}
                                                        </span>
                                                    ))}
                                                    {rest > 0 && (
                                                        <span className="text-[11px] text-app-textSec font-bold px-1 py-0.5">
                                                            +{rest}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>
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
                                            onClick={() => handleDelete(role.id)} aria-label="حذف"
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
</div>
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
                                                <div key={perm.id}
                                                    onClick={() => togglePermission(perm.name)}
                                                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'bg-app-gold/10 border-app-gold' : 'border-app-card hover:bg-gray-50'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-app-gold text-white' : 'bg-gray-200'}`}>
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

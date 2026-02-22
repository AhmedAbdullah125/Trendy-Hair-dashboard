import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Search, X, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetAdminGovernorates } from '../../requests/useGetAdminGovernorates';
import { useAddAdminGovernorate } from '../../requests/useAddAdminGovernorate';
import { useUpdateAdminGovernorate } from '../../requests/useUpdateAdminGovernorate';
import { useDeleteAdminGovernorate } from '../../requests/useDeleteAdminGovernorate';

interface GovernorateFormData {
    id?: number;
    name: string;
    nameEn?: string;
    isActive: boolean;
}

const GovernoratesTab: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGov, setEditingGov] = useState<Partial<GovernorateFormData> | null>(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [govToDelete, setGovToDelete] = useState<number | null>(null);

    const { data, isLoading, error } = useGetAdminGovernorates(pageSize, currentPage, 'ar');
    const addMutation = useAddAdminGovernorate();
    const updateMutation = useUpdateAdminGovernorate();
    const deleteMutation = useDeleteAdminGovernorate();

    const governorates = data?.items?.data || [];
    const pagination = data?.items?.pagination || {
        current_page: 1, total_pages: 1, total_items: 0, page_size: 10
    };

    const filteredGovs = governorates.filter((g: any) =>
        g.name_ar?.toLowerCase().includes(search.toLowerCase()) ||
        g.name_en?.toLowerCase().includes(search.toLowerCase())
    );

    const openAddModal = () => {
        setEditingGov({ name: '', nameEn: '', isActive: true });
        setIsModalOpen(true);
    };

    const openEditModal = (gov: any) => {
        setEditingGov({
            id: gov.id,
            name: gov.name_ar,
            nameEn: gov.name_en,
            isActive: gov.is_active === 1 || gov.is_active === true
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingGov || !editingGov.name) return;
        if (editingGov.id) {
            await updateMutation.mutateAsync({
                id: editingGov.id,
                name_ar: editingGov.name,
                name_en: editingGov.nameEn,
                is_active: editingGov.isActive ? 1 : 0
            });
        } else {
            await addMutation.mutateAsync({
                name_ar: editingGov.name,
                name_en: editingGov.nameEn,
                is_active: editingGov.isActive ? 1 : 0
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: number) => {
        setGovToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (govToDelete) {
            await deleteMutation.mutateAsync(govToDelete);
            setDeleteConfirmOpen(false);
            setGovToDelete(null);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-app-textSec" size={18} />
                    <input type="text" placeholder="بحث باسم المحافظة..."
                        className="w-full pr-10 pl-4 py-2 border border-app-card rounded-xl outline-none focus:border-app-gold bg-app-bg"
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <button onClick={openAddModal}
                    className="bg-app-gold text-white px-6 py-2 rounded-xl font-bold hover:bg-app-goldDark flex items-center gap-2">
                    <Plus size={20} /><span>إضافة محافظة</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="w-8 h-8 border-2 border-app-gold/30 border-t-app-gold rounded-full animate-spin mx-auto" />
                    </div>
                ) : error ? (
                    <div className="py-10 text-center"><p className="text-red-500 font-bold">حدث خطأ في تحميل المحافظات</p></div>
                ) : (
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4 rounded-tr-xl">المعرف</th>
                                <th className="px-6 py-4">الاسم (عربي)</th>
                                <th className="px-6 py-4">الاسم (إنجليزي)</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4 rounded-tl-xl text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-card/30 text-sm">
                            {filteredGovs.map((gov: any) => (
                                <tr key={gov.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-app-textSec">#{gov.id}</td>
                                    <td className="px-6 py-4 font-bold text-app-text">{gov.name_ar}</td>
                                    <td className="px-6 py-4 text-app-textSec font-medium">{gov.name_en || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${gov.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {gov.is_active ? 'مفعل' : 'غير مفعل'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex gap-2 justify-end">
                                        <button onClick={() => openEditModal(gov)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={18} /></button>
                                        <button onClick={() => handleDelete(gov.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredGovs.length === 0 && (
                                <tr><td colSpan={5} className="py-8 text-center text-app-textSec">لا توجد محافظات</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {!isLoading && !error && pagination.total_pages > 1 && (
                <div className="pt-4 border-t border-app-card/30 flex items-center justify-between">
                    <div className="text-sm text-app-textSec">
                        صفحة {pagination.current_page} من {pagination.total_pages} • الإجمالي: {pagination.total_items}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-app-card hover:bg-app-gold hover:text-white transition-colors disabled:opacity-50"><ChevronRight size={20} /></button>
                        {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => handlePageChange(page)} className={`px-4 py-2 rounded-lg font-bold transition-colors ${currentPage === page ? 'bg-app-gold text-white' : 'border border-app-card hover:bg-gray-50'}`}>{page}</button>
                        ))}
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.total_pages} className="p-2 rounded-lg border border-app-card hover:bg-app-gold hover:text-white transition-colors disabled:opacity-50"><ChevronLeft size={20} /></button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && editingGov && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-app-card/30">
                            <h3 className="text-xl font-bold text-app-text">{editingGov.id ? 'تعديل المحافظة' : 'إضافة محافظة'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-app-textSec hover:text-red-500"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">الاسم (عربي) <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    value={editingGov.name} onChange={(e) => setEditingGov({ ...editingGov, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">الاسم (إنجليزي)</label>
                                <input type="text" className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    value={editingGov.nameEn} onChange={(e) => setEditingGov({ ...editingGov, nameEn: e.target.value })} />
                            </div>
                            <div className="flex items-center pt-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${editingGov.isActive ? 'bg-app-gold border-app-gold' : 'border-app-textSec'}`}>
                                        {editingGov.isActive && <CheckCircle2 size={16} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={!!editingGov.isActive}
                                        onChange={(e) => setEditingGov({ ...editingGov, isActive: e.target.checked })} />
                                    <span className="text-sm font-bold text-app-text">مفعل</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-app-card/30 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-app-textSec hover:bg-gray-200 rounded-xl transition-colors">إلغاء</button>
                            <button onClick={handleSave} disabled={!editingGov.name || addMutation.isPending || updateMutation.isPending}
                                className="px-8 py-3 bg-app-gold text-white font-bold rounded-xl hover:bg-app-goldDark transition-colors disabled:opacity-50 flex items-center gap-2">
                                {(addMutation.isPending || updateMutation.isPending) && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                <span>{editingGov.id ? 'تحديث' : 'حفظ'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
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
                            <p className="text-app-text font-bold text-lg mb-2">هل أنت متأكد من حذف هذه المحافظة؟</p>
                            <p className="text-app-textSec text-sm">لا يمكن التراجع عن هذا الإجراء</p>
                        </div>
                        <div className="p-6 bg-gray-50 flex gap-3 justify-center">
                            <button onClick={() => { setDeleteConfirmOpen(false); setGovToDelete(null); }} className="px-6 py-3 font-bold text-app-text bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-100">إلغاء</button>
                            <button onClick={confirmDelete} disabled={deleteMutation.isPending} className="px-8 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 flex items-center gap-2">
                                {deleteMutation.isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                <span>حذف</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GovernoratesTab;

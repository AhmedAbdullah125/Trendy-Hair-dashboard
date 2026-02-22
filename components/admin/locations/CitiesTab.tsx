import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Search, X, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetAdminCities } from '../../requests/useGetAdminCities';
import { useAddAdminCity } from '../../requests/useAddAdminCity';
import { useUpdateAdminCity } from '../../requests/useUpdateAdminCity';
import { useDeleteAdminCity } from '../../requests/useDeleteAdminCity';
import { useGetAdminGovernorates } from '../../requests/useGetAdminGovernorates';

interface CityFormData {
    id?: number;
    name: string;
    nameEn?: string;
    deliveryCost: string;
    orderLimit: string;
    governorateId: number;
    isActive: boolean;
}

const CitiesTab: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCity, setEditingCity] = useState<Partial<CityFormData> | null>(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [cityToDelete, setCityToDelete] = useState<number | null>(null);

    const { data: citiesData, isLoading: isCitiesLoading, error: citiesError } = useGetAdminCities(pageSize, currentPage, 'ar');
    const { data: govData } = useGetAdminGovernorates(1000, 1, 'ar');

    const addMutation = useAddAdminCity();
    const updateMutation = useUpdateAdminCity();
    const deleteMutation = useDeleteAdminCity();

    const cities = citiesData?.items?.data || [];
    const governorates = govData?.items?.data || [];
    const pagination = citiesData?.items?.pagination || {
        current_page: 1, total_pages: 1, total_items: 0, page_size: 10
    };

    const filteredCities = cities.filter((c: any) =>
        c.name_ar?.toLowerCase().includes(search.toLowerCase()) ||
        c.name_en?.toLowerCase().includes(search.toLowerCase())
    );

    const openAddModal = () => {
        setEditingCity({ name: '', nameEn: '', deliveryCost: '', orderLimit: '', governorateId: governorates[0]?.id || 0, isActive: true });
        setIsModalOpen(true);
    };

    const openEditModal = (city: any) => {
        setEditingCity({
            id: city.id,
            name: city.name_ar,
            nameEn: city.name_en,
            deliveryCost: city.delivery_cost?.toString(),
            orderLimit: city.order_limit?.toString(),
            governorateId: city.governorate?.id || 0,
            isActive: city.is_active === 1 || city.is_active === true
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingCity || !editingCity.name || !editingCity.governorateId) return;
        if (editingCity.id) {
            await updateMutation.mutateAsync({
                id: editingCity.id,
                name_ar: editingCity.name,
                name_en: editingCity.nameEn,
                delivery_cost: parseFloat(editingCity.deliveryCost as string) || 0,
                order_limit: parseFloat(editingCity.orderLimit as string) || 0,
                governorate_id: editingCity.governorateId,
                is_active: editingCity.isActive ? 1 : 0
            });
        } else {
            await addMutation.mutateAsync({
                name_ar: editingCity.name,
                name_en: editingCity.nameEn,
                delivery_cost: parseFloat(editingCity.deliveryCost as string) || 0,
                order_limit: parseFloat(editingCity.orderLimit as string) || 0,
                governorate_id: editingCity.governorateId,
                is_active: editingCity.isActive ? 1 : 0
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: number) => {
        setCityToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (cityToDelete) {
            await deleteMutation.mutateAsync(cityToDelete);
            setDeleteConfirmOpen(false);
            setCityToDelete(null);
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
                    <input type="text" placeholder="بحث باسم المدينة..."
                        className="w-full pr-10 pl-4 py-2 border border-app-card rounded-xl outline-none focus:border-app-gold bg-app-bg"
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <button onClick={openAddModal}
                    className="bg-app-gold text-white px-6 py-2 rounded-xl font-bold hover:bg-app-goldDark flex items-center gap-2">
                    <Plus size={20} /><span>إضافة مدينة</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                {isCitiesLoading ? (
                    <div className="py-20 text-center">
                        <div className="w-8 h-8 border-2 border-app-gold/30 border-t-app-gold rounded-full animate-spin mx-auto" />
                    </div>
                ) : citiesError ? (
                    <div className="py-10 text-center"><p className="text-red-500 font-bold">حدث خطأ في تحميل المدن</p></div>
                ) : (
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4 rounded-tr-xl">المعرف</th>
                                <th className="px-6 py-4">المدينة (عربي)</th>
                                <th className="px-6 py-4">المحافظة</th>
                                <th className="px-6 py-4">تكلفة التوصيل</th>
                                <th className="px-6 py-4">حد الطلب</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4 rounded-tl-xl text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-card/30 text-sm">
                            {filteredCities.map((city: any) => (
                                <tr key={city.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-app-textSec">#{city.id}</td>
                                    <td className="px-6 py-4 font-bold text-app-text">
                                        <div>{city.name_ar}</div>
                                        <div className="text-app-textSec text-xs font-normal">{city.name_en}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-app-textSec">
                                        {city.governorate?.name_ar || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-app-gold font-bold">{city.delivery_cost} د.ك</td>
                                    <td className="px-6 py-4 text-app-gold font-bold">{city.order_limit} د.ك</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${city.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {city.is_active ? 'مفعل' : 'غير مفعل'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex gap-2 justify-end mt-2">
                                        <button onClick={() => openEditModal(city)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={18} /></button>
                                        <button onClick={() => handleDelete(city.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCities.length === 0 && (
                                <tr><td colSpan={7} className="py-8 text-center text-app-textSec">لا توجد مدن</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {!isCitiesLoading && !citiesError && pagination.total_pages > 1 && (
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
            {isModalOpen && editingCity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-app-card/30">
                            <h3 className="text-xl font-bold text-app-text">{editingCity.id ? 'تعديل المدينة' : 'إضافة مدينة'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-app-textSec hover:text-red-500"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">اسم المدينة (عربي) <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    value={editingCity.name} onChange={(e) => setEditingCity({ ...editingCity, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">اسم المدينة (إنجليزي)</label>
                                <input type="text" className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                    value={editingCity.nameEn} onChange={(e) => setEditingCity({ ...editingCity, nameEn: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-app-text mb-2">تكلفة التوصيل <span className="text-red-500">*</span></label>
                                    <input type="number" step="0.01" className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                        value={editingCity.deliveryCost} onChange={(e) => setEditingCity({ ...editingCity, deliveryCost: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-app-text mb-2">حد الطلب <span className="text-red-500">*</span></label>
                                    <input type="number" step="0.01" className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold"
                                        value={editingCity.orderLimit} onChange={(e) => setEditingCity({ ...editingCity, orderLimit: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-app-text mb-2">المحافظة التابعة <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full p-3 border border-app-card rounded-xl outline-none focus:border-app-gold bg-white"
                                    value={editingCity.governorateId}
                                    onChange={(e) => setEditingCity({ ...editingCity, governorateId: Number(e.target.value) })}
                                >
                                    <option value={0} disabled>اختر المحافظة...</option>
                                    {governorates.map((g: any) => (
                                        <option key={g.id} value={g.id}>{g.name_ar}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center pt-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${editingCity.isActive ? 'bg-app-gold border-app-gold' : 'border-app-textSec'}`}>
                                        {editingCity.isActive && <CheckCircle2 size={16} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={!!editingCity.isActive}
                                        onChange={(e) => setEditingCity({ ...editingCity, isActive: e.target.checked })} />
                                    <span className="text-sm font-bold text-app-text">مفعل</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-app-card/30 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-app-textSec hover:bg-gray-200 rounded-xl transition-colors">إلغاء</button>
                            <button onClick={handleSave} disabled={!editingCity.name || !editingCity.governorateId || addMutation.isPending || updateMutation.isPending}
                                className="px-8 py-3 bg-app-gold text-white font-bold rounded-xl hover:bg-app-goldDark transition-colors disabled:opacity-50 flex items-center gap-2">
                                {(addMutation.isPending || updateMutation.isPending) && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                <span>{editingCity.id ? 'تحديث' : 'حفظ'}</span>
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
                            <p className="text-app-text font-bold text-lg mb-2">هل أنت متأكد من حذف هذه المدينة؟</p>
                            <p className="text-app-textSec text-sm">لا يمكن التراجع عن هذا الإجراء</p>
                        </div>
                        <div className="p-6 bg-gray-50 flex gap-3 justify-center">
                            <button onClick={() => { setDeleteConfirmOpen(false); setCityToDelete(null); }} className="px-6 py-3 font-bold text-app-text bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-100">إلغاء</button>
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

export default CitiesTab;

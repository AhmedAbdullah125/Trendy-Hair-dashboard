import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useGetCompetitionStages, CompetitionStage } from '../../requests/useGetCompetitionStages';
import { useCreateCompetitionStage } from '../../requests/useCreateCompetitionStage';
import { useUpdateCompetitionStage } from '../../requests/useUpdateCompetitionStage';
import { useDeleteCompetitionStage } from '../../requests/useDeleteCompetitionStage';
import { StatusBadge } from './StatusBadge';

const formatPrize = (prize: string | number | null | undefined): string => {
    const value = Number(prize);
    if (!Number.isFinite(value)) return '—';

    return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 3 }).format(value)} نقطة`;
};

export function StagesView({ onSelectStage }: { onSelectStage: (stage: CompetitionStage) => void }) {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useGetCompetitionStages({ pageNumber: page, pageSize: 10 });
    const deleteMutation = useDeleteCompetitionStage();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<CompetitionStage | null>(null);

    const stages = data?.items?.data || [];
    // const pagination = data?.items?.pagination;

    const handleDelete = async (id: number) => {
        if (confirm('هل أنت متأكد من حذف هذه المرحلة؟')) {
            try {
                await deleteMutation.mutateAsync(id);
                toast.success('تم حذف المرحلة بنجاح');
            } catch (e) {
                toast.error('حدث خطأ أثناء الحذف');
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-app-text">إدارة المراحل</h3>
                <button 
                    onClick={() => { setEditingStage(null); setIsModalOpen(true); }}
                    className="bg-app-gold text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-app-goldDark"
                >
                    <Plus size={18} /> إضافة مرحلة
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-app-gold" size={32} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4">الاسم</th>
                                <th className="px-6 py-4">الترتيب</th>
                                <th className="px-6 py-4">مدة السؤال (ث)</th>
                                <th className="px-6 py-4">الجائزة</th>
                                <th className="px-6 py-4">عدد الأسئلة المطلوبة</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-card/30 text-sm">
                            {stages.map(stage => (
                                <tr key={stage.id} className="hover:bg-app-bg/50 cursor-pointer" onClick={() => onSelectStage(stage)}>
                                    <td className="px-6 py-4 font-bold">{stage.name}</td>
                                    <td className="px-6 py-4">{stage.sort_by}</td>
                                    <td className="px-6 py-4">{stage.question_time}</td>
                                    <td className="px-6 py-4 font-bold text-app-goldDark whitespace-nowrap">
                                        {formatPrize(stage.prize)}
                                    </td>
                                    <td className="px-6 py-4">{stage.stage_number_of_questions || 0}</td>
                                    <td className="px-6 py-4"><StatusBadge status={stage.status} /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => { setEditingStage(stage); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={18} /></button>
                                            <button onClick={() => handleDelete(stage.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {isModalOpen && (
                <StageModal 
                    stage={editingStage} 
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </div>
    );
}

function StageModal({ stage, onClose }: { stage: CompetitionStage | null, onClose: () => void }) {
    const [formData, setFormData] = useState({
        name: stage?.name || '',
        status: stage?.status || 'active',
        question_time: stage?.question_time || 20,
        // prize is decimal(12,3) server-side and arrives as "10.500";
        // parseInt would silently save it back as 10.
        prize: stage?.prize ? parseFloat(stage.prize) : 10,
        sort_by: stage?.sort_by || 1,
        stage_number_of_questions: stage?.stage_number_of_questions || 5
    });

    const createMutation = useCreateCompetitionStage();
    const updateMutation = useUpdateCompetitionStage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (stage) {
                await updateMutation.mutateAsync({ id: stage.id, ...formData } as any);
                toast.success('تم التحديث بنجاح');
            } else {
                await createMutation.mutateAsync(formData as any);
                toast.success('تمت الإضافة بنجاح');
            }
            onClose();
        } catch (e) {
            toast.error('حدث خطأ أثناء الحفظ');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg">{stage ? 'تعديل مرحلة' : 'إضافة مرحلة'}</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">اسم المرحلة</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-xl" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">الترتيب</label>
                            <input type="number" value={formData.sort_by} onChange={e => setFormData({...formData, sort_by: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">مدة السؤال (ثواني)</label>
                            <input type="number" value={formData.question_time} onChange={e => setFormData({...formData, question_time: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">الجائزة</label>
                            <input type="number" step="0.001" value={formData.prize} onChange={e => setFormData({...formData, prize: parseFloat(e.target.value)})} className="w-full p-2 border rounded-xl" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">الأسئلة المطلوبة للفوز</label>
                            <input type="number" value={formData.stage_number_of_questions} onChange={e => setFormData({...formData, stage_number_of_questions: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">الحالة</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full p-2 border rounded-xl">
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                        </select>
                    </div>
                    <div className="pt-4 flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-xl">إلغاء</button>
                        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 py-2 bg-app-gold text-white rounded-xl">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { CompetitionStage } from '../../requests/useGetCompetitionStages';
import { useGetCompetitionQuestions, CompetitionQuestion } from '../../requests/useGetCompetitionQuestions';
import { useCreateCompetitionQuestion } from '../../requests/useCreateCompetitionQuestion';
import { useUpdateCompetitionQuestion } from '../../requests/useUpdateCompetitionQuestion';
import { useDeleteCompetitionQuestion } from '../../requests/useDeleteCompetitionQuestion';
import { StatusBadge } from './StatusBadge';

export function QuestionsView({ stage, onSelectQuestion }: { stage: CompetitionStage, onSelectQuestion: (q: CompetitionQuestion) => void }) {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useGetCompetitionQuestions({ stageId: stage.id, pageNumber: page, pageSize: 10 });
    const deleteMutation = useDeleteCompetitionQuestion();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<CompetitionQuestion | null>(null);

    const questions = data?.items?.data || [];

    const handleDelete = async (id: number) => {
        if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
            try {
                await deleteMutation.mutateAsync(id);
                toast.success('تم الحذف بنجاح');
            } catch (e) {
                toast.error('حدث خطأ أثناء الحذف');
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-app-card/30 overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-app-text">إدارة الأسئلة</h3>
                <button 
                    onClick={() => { setEditingQuestion(null); setIsModalOpen(true); }}
                    className="bg-app-gold text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-app-goldDark"
                >
                    <Plus size={18} /> إضافة سؤال
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-app-gold" size={32} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4">السؤال</th>
                                <th className="px-6 py-4">الترتيب</th>
                                <th className="px-6 py-4">عدد الإجابات</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-card/30 text-sm">
                            {questions.map(q => (
                                <tr key={q.id} className="hover:bg-app-bg/50 cursor-pointer" onClick={() => onSelectQuestion(q)}>
                                    <td className="px-6 py-4 font-bold">{q.name}</td>
                                    <td className="px-6 py-4">{q.sort_by}</td>
                                    <td className="px-6 py-4">{q.answers_count || 0}</td>
                                    <td className="px-6 py-4"><StatusBadge status={q.status} /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => { setEditingQuestion(q); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={18} /></button>
                                            <button onClick={() => handleDelete(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {questions.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-6 text-app-textSec">لا يوجد أسئلة</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <QuestionModal 
                    stageId={stage.id}
                    question={editingQuestion} 
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </div>
    );
}

function QuestionModal({ stageId, question, onClose }: { stageId: number, question: CompetitionQuestion | null, onClose: () => void }) {
    const [formData, setFormData] = useState({
        competition_stage_id: stageId,
        name: question?.name || '',
        status: question?.status || 'active',
        sort_by: question?.sort_by || 1,
    });

    const createMutation = useCreateCompetitionQuestion();
    const updateMutation = useUpdateCompetitionQuestion();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (question) {
                await updateMutation.mutateAsync({ id: question.id, ...formData });
                toast.success('تم التحديث بنجاح');
            } else {
                await createMutation.mutateAsync(formData);
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
                    <h3 className="font-bold text-lg">{question ? 'تعديل سؤال' : 'إضافة سؤال'}</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">السؤال</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-xl" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">الترتيب</label>
                        <input type="number" value={formData.sort_by} onChange={e => setFormData({...formData, sort_by: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
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

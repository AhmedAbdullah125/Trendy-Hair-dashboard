import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { CompetitionQuestion } from '../../requests/useGetCompetitionQuestions';
import { useGetCompetitionAnswers, CompetitionAnswer } from '../../requests/useGetCompetitionAnswers';
import { useCreateCompetitionAnswer } from '../../requests/useCreateCompetitionAnswer';
import { useUpdateCompetitionAnswer } from '../../requests/useUpdateCompetitionAnswer';
import { useDeleteCompetitionAnswer } from '../../requests/useDeleteCompetitionAnswer';
import { StatusBadge } from './StatusBadge';

export function AnswersView({ question }: { question: CompetitionQuestion }) {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useGetCompetitionAnswers({ questionId: question.id, pageNumber: page, pageSize: 10 });
    const deleteMutation = useDeleteCompetitionAnswer();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnswer, setEditingAnswer] = useState<CompetitionAnswer | null>(null);

    const answers = data?.items?.data || [];

    const handleDelete = async (id: number) => {
        if (confirm('هل أنت متأكد من حذف هذه الإجابة؟')) {
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
                <h3 className="text-lg font-bold text-app-text">إدارة الإجابات</h3>
                <button 
                    onClick={() => { setEditingAnswer(null); setIsModalOpen(true); }}
                    className="bg-app-gold text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-app-goldDark"
                >
                    <Plus size={18} /> إضافة إجابة
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-app-gold" size={32} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-app-bg text-app-textSec text-xs font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4">الإجابة</th>
                                <th className="px-6 py-4">الترتيب</th>
                                <th className="px-6 py-4">إجابة صحيحة؟</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-card/30 text-sm">
                            {answers.map(ans => (
                                <tr key={ans.id} className="hover:bg-app-bg/50">
                                    <td className="px-6 py-4 font-bold">{ans.name}</td>
                                    <td className="px-6 py-4">{ans.sort_by}</td>
                                    <td className="px-6 py-4">
                                        {ans.is_correct ? (
                                            <span className="text-green-600 font-bold">نعم</span>
                                        ) : (
                                            <span className="text-red-500">لا</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge status={ans.status} /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingAnswer(ans); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={18} /></button>
                                            <button onClick={() => handleDelete(ans.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {answers.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-6 text-app-textSec">لا يوجد إجابات</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <AnswerModal 
                    questionId={question.id}
                    answer={editingAnswer} 
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </div>
    );
}

function AnswerModal({ questionId, answer, onClose }: { questionId: number, answer: CompetitionAnswer | null, onClose: () => void }) {
    const [formData, setFormData] = useState({
        competition_question_id: questionId,
        name: answer?.name || '',
        status: answer?.status || 'active',
        sort_by: answer?.sort_by || 1,
        is_correct: answer?.is_correct ? 1 : 0
    });

    const createMutation = useCreateCompetitionAnswer();
    const updateMutation = useUpdateCompetitionAnswer();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (answer) {
                await updateMutation.mutateAsync({ id: answer.id, ...formData } as any);
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
                    <h3 className="font-bold text-lg">{answer ? 'تعديل إجابة' : 'إضافة إجابة'}</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">الإجابة</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-xl" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">الترتيب</label>
                        <input type="number" value={formData.sort_by} onChange={e => setFormData({...formData, sort_by: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.is_correct === 1} onChange={e => setFormData({...formData, is_correct: e.target.checked ? 1 : 0})} className="w-5 h-5" />
                            <span className="font-bold text-sm">هذه هي الإجابة الصحيحة</span>
                        </label>
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

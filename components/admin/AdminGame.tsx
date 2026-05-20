import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, ChevronLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Stage Hooks
import { useGetCompetitionStages, CompetitionStage } from '../requests/useGetCompetitionStages';
import { useCreateCompetitionStage } from '../requests/useCreateCompetitionStage';
import { useUpdateCompetitionStage } from '../requests/useUpdateCompetitionStage';
import { useDeleteCompetitionStage } from '../requests/useDeleteCompetitionStage';

// Question Hooks
import { useGetCompetitionQuestions, CompetitionQuestion } from '../requests/useGetCompetitionQuestions';
import { useCreateCompetitionQuestion } from '../requests/useCreateCompetitionQuestion';
import { useUpdateCompetitionQuestion } from '../requests/useUpdateCompetitionQuestion';
import { useDeleteCompetitionQuestion } from '../requests/useDeleteCompetitionQuestion';

// Answer Hooks
import { useGetCompetitionAnswers, CompetitionAnswer } from '../requests/useGetCompetitionAnswers';
import { useCreateCompetitionAnswer } from '../requests/useCreateCompetitionAnswer';
import { useUpdateCompetitionAnswer } from '../requests/useUpdateCompetitionAnswer';
import { useDeleteCompetitionAnswer } from '../requests/useDeleteCompetitionAnswer';

const StatusBadge = ({ status }: { status: 'active' | 'inactive' }) => {
    return status === 'active' ? (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 flex items-center gap-1 w-fit">
            <CheckCircle2 size={14} /> نشط
        </span>
    ) : (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 flex items-center gap-1 w-fit">
            <AlertCircle size={14} /> غير نشط
        </span>
    );
};

export default function AdminGame() {
    // Navigation State
    const [selectedStage, setSelectedStage] = useState<CompetitionStage | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<CompetitionQuestion | null>(null);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => { setSelectedStage(null); setSelectedQuestion(null); }}
                    className={`text-xl font-bold ${!selectedStage ? 'text-app-text' : 'text-app-textSec hover:text-app-gold'}`}
                >
                    المراحل
                </button>
                
                {selectedStage && (
                    <>
                        <ChevronLeft className="text-app-textSec" size={20} />
                        <button 
                            onClick={() => setSelectedQuestion(null)}
                            className={`text-xl font-bold ${!selectedQuestion ? 'text-app-text' : 'text-app-textSec hover:text-app-gold'}`}
                        >
                            أسئلة: {selectedStage.name}
                        </button>
                    </>
                )}

                {selectedQuestion && (
                    <>
                        <ChevronLeft className="text-app-textSec" size={20} />
                        <span className="text-xl font-bold text-app-text">
                            إجابات: {selectedQuestion.name}
                        </span>
                    </>
                )}
            </div>

            {/* Views */}
            {!selectedStage && (
                <StagesView onSelectStage={setSelectedStage} />
            )}
            
            {selectedStage && !selectedQuestion && (
                <QuestionsView stage={selectedStage} onSelectQuestion={setSelectedQuestion} />
            )}

            {selectedStage && selectedQuestion && (
                <AnswersView question={selectedQuestion} />
            )}
        </div>
    );
}

// ----------------------------------------------------------------------
// 1. STAGES VIEW
// ----------------------------------------------------------------------
function StagesView({ onSelectStage }: { onSelectStage: (stage: CompetitionStage) => void }) {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useGetCompetitionStages({ pageNumber: page, pageSize: 10 });
    const deleteMutation = useDeleteCompetitionStage();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<CompetitionStage | null>(null);

    const stages = data?.items?.data || [];
    const pagination = data?.items?.pagination;

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
                                    <td className="px-6 py-4">{stage.prize}</td>
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

            {/* Pagination... (simplified for brevity, can implement fully as needed) */}
            
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
        prize: stage?.prize ? parseInt(stage.prize) : 10,
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
                            <input type="number" value={formData.prize} onChange={e => setFormData({...formData, prize: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
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

// ----------------------------------------------------------------------
// 2. QUESTIONS VIEW
// ----------------------------------------------------------------------
function QuestionsView({ stage, onSelectQuestion }: { stage: CompetitionStage, onSelectQuestion: (q: CompetitionQuestion) => void }) {
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

// ----------------------------------------------------------------------
// 3. ANSWERS VIEW
// ----------------------------------------------------------------------
function AnswersView({ question }: { question: CompetitionQuestion }) {
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
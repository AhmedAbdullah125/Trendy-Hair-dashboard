import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

// Types
import { CompetitionStage } from '../requests/useGetCompetitionStages';
import { CompetitionQuestion } from '../requests/useGetCompetitionQuestions';

// Subcomponents
import { StagesView } from './game/StagesView';
import { QuestionsView } from './game/QuestionsView';
import { AnswersView } from './game/AnswersView';

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
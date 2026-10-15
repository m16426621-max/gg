import React, { useState } from 'react';
import { ExamResult, Question } from '../types/exam';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Clock,
  ArrowRight,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  Flag,
  Share2,
} from 'lucide-react';
import { explainQuestionWithAi, getAiWeaknessCoaching } from '../services/aiService';

interface ExamResultViewProps {
  result: ExamResult;
  questions: Question[];
  userAnswers: Record<string, number>;
  onRetakeExam: () => void;
  onGoToLeaderboard: () => void;
  onSaveToLeaderboard: (candidateName: string) => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  result,
  questions,
  userAnswers,
  onRetakeExam,
  onGoToLeaderboard,
  onSaveToLeaderboard,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'incorrect' | 'correct' | 'flagged'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiAnalysisMap, setAiAnalysisMap] = useState<Record<string, string>>({});
  const [loadingAiId, setLoadingAiId] = useState<string | null>(null);

  // AI Coaching Plan State
  const [isCoachingLoading, setIsCoachingLoading] = useState(false);
  const [coachingPlan, setCoachingPlan] = useState<string | null>(result.aiCoaching || null);
  const [savedToBoard, setSavedToBoard] = useState(false);
  const [candidateNameInput, setCandidateNameInput] = useState(result.candidateName || 'ผู้สอบ สตช.');

  // Choice letters
  const choiceLetters = ['ก', 'ข', 'ค', 'ง'];

  // Handle single question deep AI explanation
  const handleExplainWithAi = async (q: Question) => {
    if (aiAnalysisMap[q.id]) {
      setExpandedId(q.id);
      return;
    }

    setLoadingAiId(q.id);
    try {
      const selectedIndex = userAnswers[q.id];
      const analysis = await explainQuestionWithAi(q, selectedIndex);
      setAiAnalysisMap((prev) => ({ ...prev, [q.id]: analysis }));
      setExpandedId(q.id);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการวิเคราะห์ AI: ' + err.message);
    } finally {
      setLoadingAiId(null);
    }
  };

  // Handle AI Weakness Coaching Roadmap
  const handleGenerateCoaching = async () => {
    setIsCoachingLoading(true);
    try {
      const plan = await getAiWeaknessCoaching(result);
      setCoachingPlan(plan);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการสร้างแผนติว AI: ' + err.message);
    } finally {
      setIsCoachingLoading(false);
    }
  };

  // Filtered review questions
  const filteredQuestions = questions.filter((q) => {
    const userAnswer = userAnswers[q.id];
    const isCorrect = userAnswer === q.correctAnswerIndex;
    if (filterMode === 'incorrect') return !isCorrect;
    if (filterMode === 'correct') return isCorrect;
    return true;
  });

  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} นาที ${secs} วินาที`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Score Summary Hero */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold">
              <span className="text-amber-600 font-mono-numbers">OFFICIAL POLICE ASSESSMENT</span>
              <span>·</span>
              <span className="text-slate-500">{result.modeTitle}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              ผลการทดสอบ: {result.candidateName}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              {result.passed
                ? 'ยินดีด้วย! คุณผ่านเกณฑ์มาตรฐานการคัดเลือกข้าราชการตำรวจ (คะแนนรวม >= 60% และผ่านเกณฑ์กลุ่มวิชา)'
                : 'คะแนนยังไม่ผ่านเกณฑ์มาตรฐาน สตช. (ต้องได้ 60% ขึ้นไป) แนะนำให้อ่านวิเคราะห์จุดอ่อนด้านล่างเพื่อพัฒนาเร่งด่วน'}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 pt-1 font-mono-numbers">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>ใช้เวลา: {formatMinutes(result.timeSpentSeconds)}</span>
              </div>
              <span>·</span>
              <span>วันที่สอบ: {result.completedAt}</span>
            </div>
          </div>

          {/* Big Score Stamp */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 min-w-[220px]">
            <div
              className={`text-5xl font-extrabold font-mono-numbers tracking-tight ${
                result.passed ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {result.totalScore}
              <span className="text-xl font-normal text-slate-400">/{result.totalQuestions}</span>
            </div>

            <div className="text-sm font-semibold font-mono-numbers text-slate-700 mt-1">
              คิดเป็น {result.percentage}%
            </div>

            <div
              className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                result.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {result.passed ? '✓ ผ่านเกณฑ์มาตรฐาน สตช.' : '✗ ยังไม่ผ่านเกณฑ์ 60%'}
            </div>
          </div>
        </div>

        {/* Action strip */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {!savedToBoard ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={candidateNameInput}
                  onChange={(e) => setCandidateNameInput(e.target.value)}
                  placeholder="ชื่อผู้สอบสำหรับบันทึก"
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
                <button
                  onClick={() => {
                    onSaveToLeaderboard(candidateNameInput);
                    setSavedToBoard(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  บันทึกอันดับคะแนน
                </button>
              </div>
            ) : (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                บันทึกลงตารางอันดับเรียลไทม์แล้ว
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGoToLeaderboard}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ดูตารางอันดับทั้งหมด
            </button>
            <button
              onClick={onRetakeExam}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ทำข้อสอบชุดใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Individual Weakness Diagnosis by Subject & Topic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Subject-by-Subject Score Breakdown (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">
                สรุปผลคะแนนแยกตามรายวิชา (เกณฑ์ผ่าน 60%)
              </h2>
            </div>
            <span className="text-xs text-slate-400">เกณฑ์ สตช.</span>
          </div>

          <div className="space-y-4">
            {Object.values(result.subjectScores).map((sub) => {
              const isPassed = sub.percentage >= 60;
              return (
                <div key={sub.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{sub.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-numbers font-medium text-slate-600">
                        {sub.correct} / {sub.total} ข้อ ({sub.percentage}%)
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isPassed ? 'ผ่าน' : 'ไม่ผ่าน'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isPassed ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Critical Weakness & Strengths Card (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              วิเคราะห์จุดอ่อนรายบุคคล (Topic Diagnostic)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เจาะลึกหัวข้อย่อยที่ต้องเร่งพัฒนา
            </p>
          </div>

          {/* Weak Topics */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>จุดวิกฤตที่ต้องเร่งแก้ไข (ผิดบ่อย):</span>
            </div>

            {result.weakTopics.length > 0 ? (
              <div className="space-y-2">
                {result.weakTopics.slice(0, 3).map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-rose-900 block">{w.topic}</span>
                      <span className="text-[11px] text-slate-500">{w.subject}</span>
                    </div>
                    <span className="text-rose-700 font-bold font-mono-numbers">
                      ตอบผิด {w.incorrectCount}/{w.totalCount} ข้อ
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-lg text-xs text-emerald-800">
                ยอดเยี่ยม! คุณไม่พบจุดอ่อนรุนแรงในการสอบครั้งนี้
              </div>
            )}
          </div>

          {/* AI Study Coaching Trigger */}
          <div className="pt-2">
            <button
              onClick={handleGenerateCoaching}
              disabled={isCoachingLoading}
              className="w-full py-2.5 px-3 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isCoachingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI กำลังจัดแผนติวเร่งด่วนเฉพาะคุณ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>ขอแผนติวเร่งรัดและคำแนะนำจาก AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. AI Study Coaching Roadmap Result */}
      {coachingPlan && (
        <div className="bg-amber-500/5 rounded-2xl border border-amber-300 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950">
                แผนติวเร่งด่วนรายบุคคลจาก AI (Personalized Action Plan)
              </h3>
              <p className="text-xs text-amber-800/80">
                คำแนะนำทางยุทธวิธีเพื่ออุดจุดบอดก่อนลงสนามสอบนายสิบตำรวจจริง
              </p>
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-amber-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed space-y-3 font-normal">
            {coachingPlan}
          </div>
        </div>
      )}

      {/* 4. Detailed Answer Review & AI Explanation Mode */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-700" />
              <span>เฉลยข้อสอบและวิเคราะห์แนวทางคำตอบอย่างละเอียด</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ตรวจสอบคำตอบที่ถูก พร้อมคำอธิบายกฎหมาย สูตรคิดลัด และกด "AI เจาะลึก" เพื่อดูเหตุผลรายข้อ
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              ทั้งหมด ({questions.length})
            </button>
            <button
              onClick={() => setFilterMode('incorrect')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'incorrect' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              เฉพาะข้อที่ผิด
            </button>
            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'correct' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              เฉพาะข้อที่ถูก
            </button>
          </div>
        </div>

        {/* Questions Review List */}
        <div className="space-y-6">
          {filteredQuestions.map((q, idx) => {
            const userAnswer = userAnswers[q.id];
            const isCorrect = userAnswer === q.correctAnswerIndex;
            const isExpanded = expandedId === q.id;
            const aiAnalysis = aiAnalysisMap[q.id];
            const isAiLoading = loadingAiId === q.id;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  isCorrect
                    ? 'bg-slate-50/60 border-slate-200'
                    : 'bg-rose-50/20 border-rose-200'
                }`}
              >
                {/* Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="font-semibold text-slate-800">
                      ข้อที่ {questions.findIndex((item) => item.id === q.id) + 1}
                    </span>
                    <span>·</span>
                    <span className="font-medium text-slate-700">{q.subject}</span>
                    <span>·</span>
                    <span>{q.topic}</span>
                  </div>

                  {/* AI Button */}
                  <button
                    onClick={() => handleExplainWithAi(q)}
                    disabled={isAiLoading}
                    className="px-3 py-1 text-xs font-semibold text-amber-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>AI เจาะลึก & ชี้จุดลวง</span>
                  </button>
                </div>

                {/* Question */}
                <p className="text-base font-medium text-slate-900 whitespace-pre-line leading-relaxed">
                  {q.question}
                </p>

                {/* Question Image (if attached) */}
                {q.imageUrl && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-h-64 flex items-center justify-center p-2">
                    <img
                      src={q.imageUrl}
                      alt="รูปภาพประกอบข้อสอบ"
                      className="max-h-60 w-auto object-contain rounded-lg shadow-2xs"
                    />
                  </div>
                )}

                {/* 4 Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isUserChoice = userAnswer === optIdx;
                    const isRightAnswer = q.correctAnswerIndex === optIdx;

                    let choiceStyle = 'bg-white border-slate-200 text-slate-700';
                    if (isRightAnswer) {
                      choiceStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold';
                    } else if (isUserChoice && !isRightAnswer) {
                      choiceStyle = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${choiceStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                            isRightAnswer
                              ? 'bg-emerald-600 text-white'
                              : isUserChoice
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {choiceLetters[optIdx]}
                        </span>
                        <div className="flex-1 leading-snug">
                          {opt}
                          {isRightAnswer && (
                            <span className="block text-[11px] font-bold text-emerald-700 mt-0.5">
                              ✓ คำตอบที่ถูกต้อง
                            </span>
                          )}
                          {isUserChoice && !isRightAnswer && (
                            <span className="block text-[11px] font-bold text-rose-600 mt-0.5">
                              ✗ คุณเลือกข้อนี้
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Standard Explanation */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="font-semibold text-slate-800">เฉลยและเหตุผลประกอบ:</div>
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed">{q.explanation}</p>
                  {q.tips && (
                    <div className="flex items-start gap-1.5 text-amber-900 bg-amber-50/70 p-2 rounded-lg border border-amber-200/50">
                      <Lightbulb className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-bold">เทคนิคคิดลัด: </span>
                        <span>{q.tips}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Deep Analysis Pop-in */}
                {aiAnalysis && (
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-300 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>บทวิเคราะห์แนวทางคำตอบและเฉลยละเอียดโดย AI:</span>
                    </div>
                    <div className="text-slate-800 whitespace-pre-line leading-relaxed space-y-2">
                      {aiAnalysis}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

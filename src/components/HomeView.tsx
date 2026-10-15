import React, { useState } from 'react';
import { Subject, ALL_SUBJECTS, ExamMode, Question } from '../types/exam';
import {
  Shield,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Zap,
  Target,
  PlusCircle,
  Camera,
} from 'lucide-react';

interface HomeViewProps {
  questions: Question[];
  candidateName: string;
  onUpdateCandidateName: (name: string) => void;
  onStartExam: (config: {
    mode: ExamMode;
    targetSubject?: Subject;
    totalQuestions: number;
    durationMinutes: number;
  }) => void;
  onOpenQuestionManager: () => void;
  onOpenAiGenerator: () => void;
  onOpenScanModal: () => void;
  onViewLeaderboard: () => void;
  isAdmin: boolean;
  currentUser: any;
}

export const HomeView: React.FC<HomeViewProps> = ({
  questions,
  candidateName,
  onUpdateCandidateName,
  onStartExam,
  onOpenQuestionManager,
  onOpenAiGenerator,
  onOpenScanModal,
  onViewLeaderboard,
  isAdmin,
  currentUser,
}) => {
  const [selectedMode, setSelectedMode] = useState<ExamMode>('sprint_15');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(
    'กฎหมายที่ประชาชนควรรู้และระเบียบ ตร.'
  );

  const handleLaunch = () => {
    if (!candidateName.trim()) {
      alert('กรุณากรอกชื่อผู้เข้าสอบ');
      return;
    }

    if (questions.length === 0) {
      alert('ยังไม่มีข้อสอบในคลัง กรุณาเพิ่มข้อสอบหรือสร้างด้วย AI ก่อน');
      return;
    }

    if (selectedMode === 'full_mock') {
      const qCount = Math.min(questions.length, 150);
      onStartExam({
        mode: 'full_mock',
        totalQuestions: qCount,
        durationMinutes: 150,
      });
    } else if (selectedMode === 'sprint_15') {
      const qCount = Math.min(questions.length, 15);
      onStartExam({
        mode: 'sprint_15',
        totalQuestions: qCount,
        durationMinutes: 15,
      });
    } else if (selectedMode === 'sprint_30') {
      const qCount = Math.min(questions.length, 30);
      onStartExam({
        mode: 'sprint_30',
        totalQuestions: qCount,
        durationMinutes: 30,
      });
    } else if (selectedMode === 'subject_drill') {
      const subjectQuestions = questions.filter((q) => q.subject === selectedSubject);
      if (subjectQuestions.length === 0) {
        alert(`ยังไม่มีข้อสอบในวิชา "${selectedSubject}" กรุณาใช้ AI สร้างข้อสอบในวิชานี้ก่อน`);
        return;
      }
      onStartExam({
        mode: 'subject_drill',
        targetSubject: selectedSubject,
        totalQuestions: Math.min(subjectQuestions.length, 25),
        durationMinutes: 25,
      });
    } else {
      onStartExam({
        mode: 'weakness_retest',
        totalQuestions: Math.min(questions.length, 20),
        durationMinutes: 20,
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Visual Card with Generated Image */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white shadow-xl border border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[380px]">
          {/* Left Text Zone */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between z-10 space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                ระบบจำลองสอบนายสิบตำรวจออนไลน์
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                ฝึกทำข้อสอบเสมือนจริงพร้อมจับเวลาถอยหลัง สรุปคะแนนอัตโนมัติ วิเคราะห์จุดอ่อนรายบุคคล
                และมี AI ช่วยคิดข้อสอบและวิเคราะห์แนวทางคำตอบพร้อมอธิบายเหตุผลประกอบคำตอบอย่างละเอียดทุกข้อ
              </p>
            </div>

            {/* Quick Candidate Badge Form */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                ชื่อผู้เข้าสอบ / รหัสประจำตัวสอบ
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => onUpdateCandidateName(e.target.value)}
                    placeholder="กรอกชื่อ-นามสกุล เช่น นายสมศักดิ์ รักชาติ"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <button
                  onClick={handleLaunch}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md whitespace-nowrap"
                >
                  <span>เริ่มทำข้อสอบ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Image Visual Zone */}
          <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full">
            <img
              src="/src/assets/images/police_exam_banner_1792041477464.jpg"
              alt="ตราสัญลักษณ์สถาบันเตรียมสอบนายสิบตำรวจ สตช."
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
          </div>
        </div>
      </div>

      {/* Official Thai Police Exam Rules Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              เกณฑ์การตัดสินการสอบผ่านตามประกาศ สตช. (สายปราบปราม & สายอำนวยการ)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ต้องทำคะแนนรวมไม่น้อยกว่า 60% และต้องผ่านเกณฑ์ 60% ในแต่ละกลุ่มวิชาหลักจึงจะได้รับการบรรจุ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-numbers text-slate-600 shrink-0">
          <span className="px-2.5 py-1 bg-slate-100 rounded-md">ข้อสอบในคลัง: {questions.length} ข้อ</span>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md">เกณฑ์ผ่าน: 60%</span>
        </div>
      </div>

      {/* Exam Mode Selector Deck */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">เลือกรูปแบบการทำข้อสอบ</h2>
            <p className="text-xs text-slate-500">
              เลือกตามเวลาที่มี หรือเลือกเจาะจงวิชาที่ต้องการฝึกฝน
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={onOpenScanModal}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-700" />
                  <span>สแกนข้อสอบจากรูป</span>
                </button>
                <button
                  onClick={onOpenAiGenerator}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>AI คิดข้อสอบ</span>
                </button>
                <button
                  onClick={onOpenQuestionManager}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>คลังข้อสอบ</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenQuestionManager}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="ดูข้อสอบทั้งหมดในคลัง (โหมดอ่านอย่างเดียว)"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>ดูคลังข้อสอบ ({questions.length} ข้อ)</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mode 1: Full Mock */}
          <button
            onClick={() => setSelectedMode('full_mock')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative ${
              selectedMode === 'full_mock'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-400'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                selectedMode === 'full_mock' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                สมจริงที่สุด
              </span>
              <Clock className="w-4 h-4 opacity-70" />
            </div>
            <h3 className="text-base font-bold">ชุดจำลองข้อสอบจริง (Full Mock)</h3>
            <p className={`text-xs mt-1 leading-relaxed ${
              selectedMode === 'full_mock' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              คัดเลือกข้อสอบครบทุก 6 วิชาตามอัตราส่วนจริง จับเวลา 150 นาที (2 ชม. 30 นาที)
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200/20 text-xs font-mono-numbers">
              เวลา: 150 นาที · สูงสุด {Math.min(questions.length, 150)} ข้อ
            </div>
          </button>

          {/* Mode 2: Sprint 15 */}
          <button
            onClick={() => setSelectedMode('sprint_15')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative ${
              selectedMode === 'sprint_15'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-400'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                selectedMode === 'sprint_15' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                ยอดนิยม (ซ้อมไว)
              </span>
              <Zap className="w-4 h-4 opacity-70 text-amber-400" />
            </div>
            <h3 className="text-base font-bold">โหมดซ้อมด่วน 15 ข้อ (Sprint)</h3>
            <p className={`text-xs mt-1 leading-relaxed ${
              selectedMode === 'sprint_15' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              สุ่มข้อสอบ 15 ข้อ เหมาะสำหรับฝึกฝนความเร็วในเวลาว่าง 15 นาที
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200/20 text-xs font-mono-numbers">
              เวลา: 15 นาที · 15 ข้อ (1 นาที/ข้อ)
            </div>
          </button>

          {/* Mode 3: Subject Drill */}
          <button
            onClick={() => setSelectedMode('subject_drill')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative ${
              selectedMode === 'subject_drill'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-400'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                selectedMode === 'subject_drill' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                เจาะจุดอ่อน
              </span>
              <Target className="w-4 h-4 opacity-70 text-sky-400" />
            </div>
            <h3 className="text-base font-bold">โหมดเจาะเฉพาะวิชา (Subject Drill)</h3>
            <p className={`text-xs mt-1 leading-relaxed ${
              selectedMode === 'subject_drill' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              เน้นฝึกฝนวิชาเดียวเพื่อแก้ไขจุดบกพร่อง เช่น กฎหมายตำรวจ หรือคณิตศาสตร์
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200/20 text-xs font-mono-numbers">
              เวลา: 25 นาที · สูงสุด 25 ข้อ
            </div>
          </button>
        </div>

        {/* If Subject Drill selected, show subject picker */}
        {selectedMode === 'subject_drill' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              เลือกวิชาที่ต้องการฝึกฝนแบบเจาะลึก:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ALL_SUBJECTS.map((s) => {
                const count = questions.filter((q) => q.subject === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedSubject(s)}
                    className={`p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      selectedSubject === s
                        ? 'bg-amber-500/10 border-amber-500 text-slate-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="line-clamp-1">{s}</span>
                    <span className="font-mono-numbers text-slate-400 shrink-0 ml-2">
                      ({count} ข้อ)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleLaunch}
            className="px-6 py-3 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>เริ่มทำแบบทดสอบตอนนี้</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Subjects Overview Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            โครงสร้างหลักสูตรและสัดส่วนคะแนนสอบนายสิบตำรวจ
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ครอบคลุมทั้งสายปราบปราม (นสต.) และสายอำนวยการ (อก.) ตามเกณฑ์ของสำนักงานตำรวจแห่งชาติ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_SUBJECTS.map((subj, idx) => {
            const count = questions.filter((q) => q.subject === subj).length;
            return (
              <div
                key={subj}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2 hover:bg-white hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono-numbers font-semibold">วิชาที่ 0{idx + 1}</span>
                  <span className="font-mono-numbers text-amber-700 font-semibold">{count} ข้อในระบบ</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{subj}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {subj.includes('กฎหมาย')
                    ? 'ป.วิ.อาญา (จับ/ค้น/ควบคุม), กฎหมายอาญา, พ.ร.บ.ตำรวจ 2565'
                    : subj.includes('คณิตศาสตร์')
                    ? 'อนุกรม, ร้อยละ, อัตราส่วน, เงื่อนไขสัญลักษณ์, ตรรกศาสตร์'
                    : subj.includes('ภาษาไทย')
                    ? 'การสะกดคำ, คำราชาศัพท์, สำนวน, จับใจความบทความราชการ'
                    : subj.includes('อังกฤษ')
                    ? 'คำศัพท์ตำรวจ, ไวยากรณ์, Conditionals, บทสนทนาบริการ'
                    : subj.includes('สังคม')
                    ? 'อุดมคติตำรวจ 9 ประการ, กฎบัตรอาเซียน, จริยธรรม สตช.'
                    : 'พ.ร.บ.คอมพิวเตอร์ 2560, PDPA, Excel, ความปลอดภัยไซเบอร์'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

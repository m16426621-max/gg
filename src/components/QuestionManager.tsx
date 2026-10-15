import React, { useState, useMemo } from 'react';
import {
  Question,
  Subject,
  ALL_SUBJECTS,
  Difficulty,
} from '../types/exam';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  FileText,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Camera,
  Image as ImageIcon,
  ImagePlus,
  Lock,
  Crown,
} from 'lucide-react';
import { generateAiQuestions, explainQuestionWithAi } from '../services/aiService';

interface QuestionManagerProps {
  questions: Question[];
  isAdmin: boolean;
  onAddQuestion: (q: Omit<Question, 'id' | 'createdAt'>) => void;
  onUpdateQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onImportQuestions: (imported: Question[]) => void;
  onExportQuestions: () => void;
  onResetQuestions: () => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;
  onOpenScanModal: () => void;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  questions,
  isAdmin,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onImportQuestions,
  onExportQuestions,
  onResetQuestions,
  isAiModalOpen,
  setIsAiModalOpen,
  onOpenScanModal,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null);

  // Edit / Add modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form state
  const [formSubject, setFormSubject] = useState<Subject>('ความสามารถทั่วไป (คณิตศาสตร์และตรรกศาสตร์)');
  const [formTopic, setFormTopic] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formOptions, setFormOptions] = useState<[string, string, string, string]>(['', '', '', '']);
  const [formCorrectIndex, setFormCorrectIndex] = useState<number>(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formTips, setFormTips] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<Difficulty>('medium');
  const [formImageUrl, setFormImageUrl] = useState<string>('');

  // AI Generator modal state
  const [aiSubject, setAiSubject] = useState<Subject>('กฎหมายที่ประชาชนควรรู้และระเบียบ ตร.');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState<number>(3);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreviewQuestions, setGeneratedPreviewQuestions] = useState<Question[]>([]);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [aiImageMimeType, setAiImageMimeType] = useState<string>('image/jpeg');
  const [aiImageFileName, setAiImageFileName] = useState<string>('');
  const [aiAttachImageToQuestions, setAiAttachImageToQuestions] = useState<boolean>(true);
  const aiFileInputRef = React.useRef<HTMLInputElement>(null);
  const aiCameraInputRef = React.useRef<HTMLInputElement>(null);

  // AI Single Question explanation modal
  const [explainingQuestionId, setExplainingQuestionId] = useState<string | null>(null);
  const [aiExplainingResult, setAiExplainingResult] = useState<{ questionId: string; analysis: string } | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // File import ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Subject counts
  const subjectStats = useMemo(() => {
    const stats: Record<string, number> = {};
    ALL_SUBJECTS.forEach((s) => (stats[s] = 0));
    questions.forEach((q) => {
      stats[q.subject] = (stats[q.subject] || 0) + 1;
    });
    return stats;
  }, [questions]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSubject = selectedSubject === 'all' || q.subject === selectedSubject;
      const matchDiff = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const qLower = searchQuery.toLowerCase();
      const matchQuery =
        !searchQuery ||
        q.question.toLowerCase().includes(qLower) ||
        q.topic.toLowerCase().includes(qLower) ||
        q.options.some((opt) => opt.toLowerCase().includes(qLower)) ||
        q.explanation.toLowerCase().includes(qLower);

      return matchSubject && matchDiff && matchQuery;
    });
  }, [questions, selectedSubject, selectedDifficulty, searchQuery]);

  // Open Add modal
  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setFormSubject('กฎหมายที่ประชาชนควรรู้และระเบียบ ตร.');
    setFormTopic('');
    setFormQuestion('');
    setFormOptions(['', '', '', '']);
    setFormCorrectIndex(0);
    setFormExplanation('');
    setFormTips('');
    setFormDifficulty('medium');
    setFormImageUrl('');
    setIsEditModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormSubject(q.subject);
    setFormTopic(q.topic);
    setFormQuestion(q.question);
    setFormOptions([...q.options] as [string, string, string, string]);
    setFormCorrectIndex(q.correctAnswerIndex);
    setFormExplanation(q.explanation);
    setFormTips(q.tips || '');
    setFormDifficulty(q.difficulty);
    setFormImageUrl(q.imageUrl || '');
    setIsEditModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim()) {
      alert('กรุณากรอกข้อความคำถาม');
      return;
    }
    if (formOptions.some((opt) => !opt.trim())) {
      alert('กรุณากรอกตัวเลือกให้ครบทั้ง 4 ข้อ (ก, ข, ค, ง)');
      return;
    }

    if (editingQuestion) {
      onUpdateQuestion({
        ...editingQuestion,
        subject: formSubject,
        topic: formTopic.trim() || 'ทั่วไป',
        question: formQuestion.trim(),
        options: [formOptions[0].trim(), formOptions[1].trim(), formOptions[2].trim(), formOptions[3].trim()],
        correctAnswerIndex: formCorrectIndex,
        explanation: formExplanation.trim() || 'ไม่มีคำอธิบายเพิ่มเติม',
        tips: formTips.trim(),
        difficulty: formDifficulty,
        imageUrl: formImageUrl.trim() || undefined,
      });
    } else {
      onAddQuestion({
        subject: formSubject,
        topic: formTopic.trim() || 'ทั่วไป',
        question: formQuestion.trim(),
        options: [formOptions[0].trim(), formOptions[1].trim(), formOptions[2].trim(), formOptions[3].trim()],
        correctAnswerIndex: formCorrectIndex,
        explanation: formExplanation.trim() || 'ไม่มีคำอธิบายเพิ่มเติม',
        tips: formTips.trim(),
        difficulty: formDifficulty,
        imageUrl: formImageUrl.trim() || undefined,
        source: 'สร้างโดยผู้ดูแลระบบ',
      });
    }

    setIsEditModalOpen(false);
  };

  const handleAiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAiErrorMessage('กรุณาเลือกไฟล์รูปภาพ เช่น JPG, PNG, WEBP');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setAiErrorMessage('ขนาดไฟล์รูปภาพใหญ่เกิน 20MB');
      return;
    }

    setAiImageMimeType(file.type);
    setAiImageFileName(file.name);
    setAiErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setAiImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAiRemoveImage = () => {
    setAiImagePreview(null);
    setAiImageFileName('');
    if (aiFileInputRef.current) aiFileInputRef.current.value = '';
    if (aiCameraInputRef.current) aiCameraInputRef.current.value = '';
  };

  const handleAiPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setAiImageMimeType(file.type);
          setAiImageFileName(`ภาพคัดลอก_${new Date().toLocaleTimeString('th-TH')}.png`);
          const reader = new FileReader();
          reader.onload = (ev) => {
            setAiImagePreview(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
          setAiErrorMessage(null);
          break;
        }
      }
    }
  };

  // Handle AI generation
  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    setAiErrorMessage(null);
    setGeneratedPreviewQuestions([]);

    try {
      const generated = await generateAiQuestions({
        subject: aiSubject,
        topic: aiTopic.trim(),
        count: aiCount,
        difficulty: aiDifficulty,
        imageBase64: aiImagePreview || undefined,
        mimeType: aiImagePreview ? aiImageMimeType : undefined,
        attachImageToQuestion: aiAttachImageToQuestions,
      });

      if (!generated || generated.length === 0) {
        throw new Error('ไม่ได้รับข้อมูลข้อสอบจาก AI กรุณาลองใหม่อีกครั้ง');
      }

      setGeneratedPreviewQuestions(generated);
    } catch (err: any) {
      setAiErrorMessage(err.message || 'เกิดข้อผิดพลาดในการสร้างข้อสอบ');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add all generated questions to bank
  const handleCommitGeneratedQuestions = () => {
    if (generatedPreviewQuestions.length === 0) return;
    generatedPreviewQuestions.forEach((q) => {
      onAddQuestion({
        subject: q.subject,
        topic: q.topic,
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
        tips: q.tips,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
        source: q.source || 'สร้างโดยระบบ AI สตช.',
      });
    });
    setGeneratedPreviewQuestions([]);
    setAiImagePreview(null);
    setAiImageFileName('');
    setIsAiModalOpen(false);
  };

  // Test AI explanation on a specific question
  const handleTestAiExplanation = async (q: Question) => {
    setExplainingQuestionId(q.id);
    setIsLoadingAnalysis(true);
    setAiExplainingResult(null);

    try {
      const analysis = await explainQuestionWithAi(q);
      setAiExplainingResult({ questionId: q.id, analysis });
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการขอคำอธิบายจาก AI: ' + err.message);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Import JSON handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          onImportQuestions(parsed);
          alert(`นำเข้าข้อสอบสำเร็จจำนวน ${parsed.length} ข้อ`);
        } else {
          alert('ไฟล์ต้องมีโครงสร้างเป็น JSON Array ของข้อสอบ');
        }
      } catch (err: any) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Deck */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
            <span>ADMIN QUESTION REPOSITORY</span>
            <span>·</span>
            <span>คลังข้อสอบ สตช.</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ระบบจัดการคลังข้อสอบนายสิบตำรวจ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เพิ่ม แก้ไข ลบ และจัดหมวดหมู่ข้อสอบตามวิชา หรือใช้ AI ช่วยออกข้อสอบพร้อมเฉลยละเอียด
          </p>
        </div>

        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenScanModal}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Camera className="w-4 h-4 text-amber-700" />
              <span>สแกนข้อสอบจากรูป</span>
            </button>

            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI ช่วยออกข้อสอบ</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มข้อสอบใหม่</span>
            </button>

            <button
              onClick={onExportQuestions}
              title="ดาวน์โหลดคลังข้อสอบเป็นไฟล์ JSON"
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="นำเข้าไฟล์ข้อสอบ JSON"
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => {
                if (window.confirm('คุณต้องการรีเซ็ตคลังข้อสอบกลับเป็นชุดเริ่มต้นของ สตช. ใช่หรือไม่?')) {
                  onResetQuestions();
                }
              }}
              title="คืนค่าข้อสอบมาตรฐาน สตช."
              className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200/80 text-amber-950 px-4 py-2.5 rounded-xl text-xs font-medium">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">โหมดอ่านสำหรับผู้เข้าสอบ:</span> คุณสามารถอ่านทบทวนข้อสอบและดูเฉลยได้ทุกข้อ (เฉพาะเจ้าของเว็บไซต์ m16426621@gmail.com เท่านั้นที่สามารถเพิ่ม แก้ไข หรือลบข้อสอบได้)
            </div>
          </div>
        )}
      </div>

      {/* Subject Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ALL_SUBJECTS.map((subj) => {
          const count = subjectStats[subj] || 0;
          const isSelected = selectedSubject === subj;
          return (
            <button
              key={subj}
              onClick={() => setSelectedSubject(isSelected ? 'all' : subj)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 text-slate-900 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="text-[11px] text-slate-500 line-clamp-1">{subj.split(' ')[0]}</div>
              <div className="text-lg font-bold font-mono-numbers text-slate-900 mt-0.5">{count} ข้อ</div>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาข้อสอบด้วยคีย์เวิร์ด, หัวข้อกฎหมาย, คำตอบ หรือสูตร..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="all">ทุกกลุ่มวิชา ({questions.length})</option>
            {ALL_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s} ({subjectStats[s] || 0})
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="all">ทุกระดับความยาก</option>
            <option value="easy">ง่าย (Easy)</option>
            <option value="medium">ปานกลาง (Medium)</option>
            <option value="hard">ยาก/ประยุกต์ (Hard)</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            แสดงข้อสอบ <strong>{filteredQuestions.length}</strong> จากทั้งหมด {questions.length} ข้อ
          </span>
          {selectedSubject !== 'all' && (
            <button
              onClick={() => setSelectedSubject('all')}
              className="text-amber-600 hover:underline cursor-pointer"
            >
              ล้างตัวกรองวิชา
            </button>
          )}
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">ไม่พบข้อสอบที่ตรงกับเงื่อนไขการค้นหา</p>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "AI ช่วยออกข้อสอบ" เพื่อสร้างข้อสอบใหม่</p>
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            const isExpanded = expandedExplanationId === q.id;
            const choiceLetters = ['ก', 'ข', 'ค', 'ง'];

            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors space-y-4"
              >
                {/* Meta Row: Clean unboxed metadata with separators */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-numbers font-semibold text-slate-900">ข้อที่ {index + 1}</span>
                    <span>·</span>
                    <span className="font-medium text-slate-700">{q.subject}</span>
                    <span>·</span>
                    <span className="text-slate-600">{q.topic}</span>
                    <span>·</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        q.difficulty === 'hard'
                          ? 'text-rose-600'
                          : q.difficulty === 'medium'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {q.difficulty === 'hard' ? 'ระดับ: ยาก' : q.difficulty === 'medium' ? 'ระดับ: ปานกลาง' : 'ระดับ: พื้นฐาน'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTestAiExplanation(q)}
                      disabled={isLoadingAnalysis && explainingQuestionId === q.id}
                      className="px-2.5 py-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                      title="ให้ AI ช่วยวิเคราะห์เฉลยและชี้จุดลวง"
                    >
                      {isLoadingAnalysis && explainingQuestionId === q.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>AI เจาะลึก</span>
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(q)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="แก้ไขข้อสอบ"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('คุณแน่ใจว่าต้องการลบข้อสอบข้อนี้ออกจากคลัง?')) {
                              onDeleteQuestion(q.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="ลบข้อสอบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-base font-medium text-slate-900 leading-relaxed whitespace-pre-line">
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

                {/* Choices Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.correctAnswerIndex;
                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-lg border text-sm flex items-start gap-2.5 ${
                          isCorrect
                            ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {choiceLetters[optIdx]}
                        </span>
                        <div className="flex-1">
                          <span className="leading-snug">{opt}</span>
                          {isCorrect && (
                            <span className="block text-[11px] font-medium text-emerald-700 mt-0.5">
                              ✓ คำตอบที่ถูกต้อง
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Toggle */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setExpandedExplanationId(isExpanded ? null : q.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <span>เฉลยและเหตุผลประกอบ</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">คำอธิบายเฉลย:</span>
                        <p className="text-slate-600 mt-1 whitespace-pre-line leading-relaxed">{q.explanation}</p>
                      </div>

                      {q.tips && (
                        <div className="flex items-start gap-1.5 text-amber-800 bg-amber-50 p-2.5 rounded-md border border-amber-200/60">
                          <Lightbulb className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                          <div>
                            <span className="font-semibold">เทคนิคจำลัด / จุดสังเกต:</span>
                            <p className="mt-0.5 leading-relaxed">{q.tips}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Explanation Pop-in */}
                  {aiExplainingResult && aiExplainingResult.questionId === q.id && (
                    <div className="mt-3 p-4 bg-amber-500/5 rounded-lg border border-amber-300 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>AI วิเคราะห์ข้อสอบและชี้ทางลัด</span>
                        </div>
                        <button
                          onClick={() => setAiExplainingResult(null)}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ปิด
                        </button>
                      </div>
                      <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                        {aiExplainingResult.analysis}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Question Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingQuestion ? 'แก้ไขข้อสอบ' : 'เพิ่มข้อสอบใหม่เข้าคลัง'}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">กลุ่มวิชา *</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value as Subject)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {ALL_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หัวข้อย่อย / มาตรากฎหมาย *
                  </label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="เช่น ป.วิ.อาญา มาตรา 78, อนุกรม, Passive Voice"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">คำถามข้อสอบ *</label>
                <textarea
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="พิมพ์ข้อความคำถาม หรือสถานการณ์ตัวอย่างข้อสอบ..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  required
                />
              </div>

              {/* 4 Choices */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  ตัวเลือก 4 ช้อยส์ (คลิกปุ่มวิทยุหน้าข้อเพื่อเลือกคำตอบที่ถูกต้อง) *
                </label>
                {(['ก', 'ข', 'ค', 'ง'] as const).map((label, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="correctChoice"
                        checked={formCorrectIndex === idx}
                        onChange={() => setFormCorrectIndex(idx)}
                        className="text-amber-500 focus:ring-amber-400"
                      />
                      <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                        {label}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formOptions[idx]}
                      onChange={(e) => {
                        const next = [...formOptions] as [string, string, string, string];
                        next[idx] = e.target.value;
                        setFormOptions(next);
                      }}
                      placeholder={`ข้อความตัวเลือก ${label}`}
                      className={`flex-1 px-3 py-2 text-xs rounded-lg border ${
                        formCorrectIndex === idx
                          ? 'bg-emerald-50/50 border-emerald-400 font-medium'
                          : 'bg-slate-50 border-slate-200'
                      } focus:outline-none focus:ring-2 focus:ring-amber-500/30`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำอธิบายเฉลยและเหตุผลประกอบอย่างละเอียด *
                </label>
                <textarea
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="อธิบายหลักการทางกฎหมาย สูตรคำนวณ หรือเหตุผลว่าทำไมข้อนี้ถึงถูก และช้อยส์อื่นผิดอย่างไร..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เทคนิคจำลัด / สูตรย่อ (Tips)
                  </label>
                  <input
                    type="text"
                    value={formTips}
                    onChange={(e) => setFormTips(e.target.value)}
                    placeholder="เช่น หลักจำ ม.78 'ซึ่งหน้า-พบอาวุธ-เร่งด่วน'"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ระดับความยาก</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as Difficulty)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="easy">ง่าย (Easy)</option>
                    <option value="medium">ปานกลาง (Medium)</option>
                    <option value="hard">ยาก/ประยุกต์ (Hard)</option>
                  </select>
                </div>
              </div>

              {/* Optional Question Image */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  รูปภาพประกอบโจทย์ข้อสอบ (ไม่บังคับ - เช่น ตาราง, แผนผัง, หรือภาพถ่ายข้อสอบ)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setFormImageUrl(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                  />
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                    >
                      ลบรูปภาพ
                    </button>
                  )}
                </div>

                {formImageUrl && (
                  <div className="mt-2 rounded-lg border border-slate-200 p-2 bg-slate-50 inline-block">
                    <img
                      src={formImageUrl}
                      alt="รูปภาพตัวอย่าง"
                      className="max-h-32 w-auto object-contain rounded"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  บันทึกข้อสอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Question Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">AI ช่วยคิดข้อสอบนายสิบตำรวจ</h2>
                  <p className="text-xs text-slate-500">
                    ขับเคลื่อนด้วย Gemini ออกข้อสอบตามหลักสูตร สตช. พร้อม 4 ช้อยส์และเฉลยละเอียด
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4" onPaste={handleAiPaste}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เลือกวิชาที่ต้องการออกข้อสอบ *</label>
                  <select
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value as Subject)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {ALL_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ระบุหัวข้อเฉพาะ (Topic) หรือมาตรากฎหมาย {aiImagePreview ? '(ไม่บังคับเมื่อมีรูปภาพ)' : ''}
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder={
                      aiImagePreview
                        ? 'AI จะอ่านสาระสำคัญจากรูปภาพให้อัตโนมัติ (หรือระบุหัวข้อเน้นเพิ่มเติม)'
                        : 'เช่น การค้นตัวบุคคล, อัตราส่วนและร้อยละ, คำราชาศัพท์, พ.ร.บ.คอมพิวเตอร์ 2560'
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Image with Text / Document Section */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <ImagePlus className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        ใส่รูปภาพที่มีข้อความหรือเนื้อหา (เอกสาร, กฎหมาย, ชีทสรุป, โจทย์)
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        AI จะอ่านข้อความในรูปภาพและนำสาระสำคัญมาออกแบบข้อสอบตามหลักสูตร สตช.
                      </span>
                    </div>
                  </div>

                  {aiImagePreview && (
                    <button
                      type="button"
                      onClick={handleAiRemoveImage}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบรูปภาพ</span>
                    </button>
                  )}
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={aiFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAiFileChange}
                  className="hidden"
                />
                <input
                  ref={aiCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleAiFileChange}
                  className="hidden"
                />

                {!aiImagePreview ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        setAiImageMimeType(file.type);
                        setAiImageFileName(file.name);
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setAiImagePreview(ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                        setAiErrorMessage(null);
                      }
                    }}
                    className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-white rounded-xl p-4 text-center transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
                    onClick={() => aiFileInputRef.current?.click()}
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากรูปมาวางที่นี่
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        รองรับ JPG, PNG, WEBP (สูงสุด 20MB) · หรือกด <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600">Ctrl+V</kbd> เพื่อวางรูป
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => aiFileInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>เลือกไฟล์ภาพ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => aiCameraInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>ถ่ายภาพด้วยกล้อง</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        <img
                          src={aiImagePreview}
                          alt="รูปภาพประกอบ"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-semibold w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>ตรวจพบรูปภาพพร้อมอ่านข้อความ</span>
                        </div>
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {aiImageFileName || 'รูปภาพประกอบข้อสอบ'}
                        </p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Gemini AI จะอ่านข้อความ กฎหมาย หรือโจทย์ในภาพนี้เพื่อนำมาออกแบบข้อสอบตามหลักสูตร
                        </p>
                      </div>
                    </div>

                    {/* Toggle attach image to final question */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={aiAttachImageToQuestions}
                          onChange={(e) => setAiAttachImageToQuestions(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                        />
                        <span>แนบรูปภาพนี้เข้าไปในข้อสอบด้วย (ให้ผู้สอบมองเห็นรูปประกอบขณะทำข้อสอบ)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวนข้อที่ต้องการสร้าง</label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value={1}>1 ข้อ (ทดลอง)</option>
                    <option value={3}>3 ข้อ (แนะนำ)</option>
                    <option value={5}>5 ข้อ</option>
                    <option value={10}>10 ข้อ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ระดับความยาก</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as Difficulty)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="easy">ง่าย (ความจำ/ความรู้เบื้องต้น)</option>
                    <option value="medium">ปานกลาง (ข้อสอบมาตรฐาน สตช.)</option>
                    <option value="hard">ยาก (โจทย์ประยุกต์ / หลอกลวง)</option>
                  </select>
                </div>
              </div>

              {aiErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{aiErrorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI กำลังร่างข้อสอบตามเกณฑ์ สตช...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>สร้างข้อสอบด้วย AI ทันที</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preview Generated Questions */}
              {generatedPreviewQuestions.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100 max-h-[360px] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      ตรวจสอบข้อสอบที่ AI สร้างขึ้น ({generatedPreviewQuestions.length} ข้อ)
                    </span>
                    <button
                      onClick={handleCommitGeneratedQuestions}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>บันทึกทั้งหมดเข้าคลังข้อสอบ</span>
                    </button>
                  </div>

                  {generatedPreviewQuestions.map((gq, gIdx) => (
                    <div key={gIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-slate-800">ข้อที่ {gIdx + 1}: {gq.topic}</span>
                        <span className="text-amber-700">คำตอบที่ถูก: ({['ก', 'ข', 'ค', 'ง'][gq.correctAnswerIndex]})</span>
                      </div>
                      <p className="font-medium text-slate-900">{gq.question}</p>
                      {gq.imageUrl && (
                        <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-100 max-h-36 flex items-center justify-center p-1.5">
                          <img
                            src={gq.imageUrl}
                            alt="ภาพประกอบข้อสอบ"
                            className="max-h-32 w-auto object-contain rounded"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-1 text-slate-600">
                        {gq.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-1.5 rounded ${oIdx === gq.correctAnswerIndex ? 'bg-emerald-100/70 text-emerald-900 font-medium' : ''}`}
                          >
                            {['ก', 'ข', 'ค', 'ง'][oIdx]}. {opt}
                          </div>
                        ))}
                      </div>
                      <p className="text-slate-500 italic mt-1">เฉลย: {gq.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

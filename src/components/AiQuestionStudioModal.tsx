import React, { useState, useRef } from 'react';
import { Subject, ALL_SUBJECTS, Difficulty, Question } from '../types/exam';
import { generateAiQuestions, explainQuestionWithAi } from '../services/aiService';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  HelpCircle,
  Lightbulb,
  FileCheck,
  Copy,
  Plus,
  Image as ImageIcon,
  Upload,
  Camera,
  Trash2,
  ImagePlus,
} from 'lucide-react';

interface AiQuestionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGeneratedQuestions: (questions: Question[]) => void;
  existingQuestions: Question[];
}

export const AiQuestionStudioModal: React.FC<AiQuestionStudioModalProps> = ({
  isOpen,
  onClose,
  onAddGeneratedQuestions,
  existingQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'analyze'>('generate');

  // Generate Tab State
  const [subject, setSubject] = useState<Subject>('กฎหมายที่ประชาชนควรรู้และระเบียบ ตร.');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedList, setGeneratedList] = useState<Question[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Image with Text / Document state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [attachImageToQuestions, setAttachImageToQuestions] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Analyze Tab State
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    existingQuestions[0]?.id || ''
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setGenerateError('กรุณาเลือกไฟล์รูปภาพ เช่น JPG, PNG, WEBP');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setGenerateError('ขนาดไฟล์รูปภาพใหญ่เกิน 20MB');
      return;
    }

    setImageMimeType(file.type);
    setImageFileName(file.name);
    setGenerateError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setImageMimeType(file.type);
          setImageFileName(`ภาพคัดลอก_${new Date().toLocaleTimeString('th-TH')}.png`);
          const reader = new FileReader();
          reader.onload = (ev) => {
            setImagePreview(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
          setGenerateError(null);
          break;
        }
      }
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setSuccessMessage(null);

    try {
      const result = await generateAiQuestions({
        subject,
        topic: topic.trim(),
        count,
        difficulty,
        imageBase64: imagePreview || undefined,
        mimeType: imagePreview ? imageMimeType : undefined,
        attachImageToQuestion: attachImageToQuestions,
      });

      if (!result || result.length === 0) {
        throw new Error('ไม่ได้รับข้อมูลข้อสอบจากระบบ AI');
      }

      setGeneratedList(result);
      setSuccessMessage(
        imagePreview
          ? `AI อ่านข้อความในรูปภาพและสร้างข้อสอบสำเร็จ ${result.length} ข้อตามหลักสูตร สตช.`
          : `สร้างข้อสอบสำเร็จ ${result.length} ข้อตามหลักสูตร สตช.`
      );
    } catch (err: any) {
      setGenerateError(err.message || 'เกิดข้อผิดพลาดในการสร้างข้อสอบ');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToBank = () => {
    if (generatedList.length === 0) return;
    onAddGeneratedQuestions(generatedList);
    setGeneratedList([]);
    onClose();
  };

  const handleAnalyzeSelected = async () => {
    const q = existingQuestions.find((item) => item.id === selectedQuestionId);
    if (!q) return;

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAnalysisResult(null);

    try {
      const res = await explainQuestionWithAi(q);
      setAnalysisResult(res);
    } catch (err: any) {
      setAnalyzeError(err.message || 'เกิดข้อผิดพลาดในการวิเคราะห์ข้อสอบ');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedQuestionObj = existingQuestions.find((item) => item.id === selectedQuestionId);

  // Quick preset topic suggestions based on official Thai police exam syllabus
  const presetTopics: Record<Subject, string[]> = {
    'กฎหมายที่ประชาชนควรรู้และระเบียบ ตร.': [
      'ป.วิ.อาญา การจับและควบคุมตัวบุคคล ม.78, 87',
      'ป.วิ.อาญา การตรวจค้นในที่รโหฐาน ม.92',
      'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. 2565 (การร้องเรียน ก.ร.ตร. & วินัย)',
      'กฎหมายอาญา การป้องกันโดยชอบด้วยกฎหมาย ม.68',
      'กฎหมายจราจรทางบก การตรวจวัดแอลกอฮอล์',
    ],
    'ความสามารถทั่วไป (คณิตศาสตร์และตรรกศาสตร์)': [
      'ลำดับและอนุกรมหลายมิติ',
      'ร้อยละ กำไร-ขาดทุน และราคาป้าย',
      'โจทย์ขาและหัวสัตว์ / ระยะทางความเร็ว',
      'การสรุปเหตุผลเชิงตรรกศาสตร์ (ตรรกวิทยา)',
      'การตีความตารางและข้อมูลสถิติ สตช.',
    ],
    'ภาษาไทย': [
      'คำที่มักเขียนผิดตามพจนานุกรมฉบับราชบัณฑิตฯ',
      'คำราชาศัพท์และการใช้คำ "ทรง"',
      'การอ่านจับใจความและสรุปความบทความราชการ',
      'ระดับภาษาและความถูกต้องของประโยค',
      'สำนวน สุภาษิต คำพังเพยเชิงเปรียบเทียบ',
    ],
    'ภาษาอังกฤษ': [
      'Police & Law Enforcement Vocabulary',
      'Conditionals (If-clause Type 1, 2, 3)',
      'Passive Voice in Official Incident Reports',
      'Public Service Dialogues & Asking Directions',
      'Reading Comprehension (Crime Notices)',
    ],
    'สังคม วัฒนธรรม จริยธรรม และอาเซียน': [
      'อุดมคติตำรวจ 9 ประการและจริยธรรมข้าราชการตำรวจ',
      'ประชาคมอาเซียน (เสาหลัก & กฎบัตรอาเซียน)',
      'ประวัติศาสตร์และหน้าที่พลเมืองไทย',
      'หลักธรรมาภิบาลและความโปร่งใสในภาครัฐ',
    ],
    'เทคโนโลยีสารสนเทศเพื่อการปฏิบัติงาน': [
      'พ.ร.บ.คอมพิวเตอร์ พ.ศ. 2560 (มาตรา 11, 14, 16)',
      'พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
      'Microsoft Excel สูตรนับและคำนวณ (COUNT, VLOOKUP)',
      'ความปลอดภัยทางไซเบอร์และ Phishing Scams',
    ],
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                AI Police Exam Studio & Deep Analyzer
              </h2>
              <p className="text-xs text-slate-500">
                สร้างข้อสอบตามหัวข้อที่ต้องการ และวิเคราะห์แนวทางคำตอบพร้อมเหตุผลประกอบอย่างละเอียด
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Tab Controls (Segmented Tabs) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>สร้างข้อสอบใหม่ตามหัวข้อที่ต้องการ</span>
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'analyze'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-500" />
            <span>วิเคราะห์แนวทางคำตอบ & เฉลยละเอียดรายข้อ</span>
          </button>
        </div>

        {/* Tab 1: Generate Questions */}
        {activeTab === 'generate' && (
          <div className="space-y-4" onPaste={handlePaste}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. เลือกกลุ่มวิชา สตช. *
                </label>
                <select
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value as Subject);
                    setTopic('');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 font-medium"
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
                  2. ระบุหัวข้อที่ต้องการออกข้อสอบ {imagePreview ? '(ไม่บังคับเมื่อมีรูปภาพ)' : '*'}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={
                    imagePreview
                      ? 'AI จะอ่านสาระสำคัญจากรูปภาพให้อัตโนมัติ (หรือระบุหัวข้อเน้นเพิ่มเติม)'
                      : 'เช่น ป.วิ.อาญา การค้นตัวบุคคล, อัตราส่วนและร้อยละ, Conditionals...'
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800"
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

                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบรูปภาพ</span>
                  </button>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {!imagePreview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      setImageMimeType(file.type);
                      setImageFileName(file.name);
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setImagePreview(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                      setGenerateError(null);
                    }
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-white rounded-xl p-4 text-center transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากรูปมาวางที่นี่
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      รองรับ JPG, PNG, WEBP (สูงสุด 20MB) · หรือกด <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600">Ctrl+V</kbd> เพื่อวางรูปจากคลิปบอร์ด
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>เลือกไฟล์ภาพ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
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
                    <div className="w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={imagePreview}
                        alt="รูปภาพประกอบ"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-[11px] font-semibold w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>ตรวจพบรูปภาพพร้อมอ่านข้อความ</span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {imageFileName || 'รูปภาพประกอบข้อสอบ'}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        เมื่อกดสร้างข้อสอบ Gemini AI จะอ่านข้อความ เนื้อหากฎหมาย หรือโจทย์ในรูปภาพนี้เพื่อนำมาออกแบบข้อสอบพร้อมเฉลยละเอียด
                      </p>
                    </div>
                  </div>

                  {/* Toggle attach image to final question */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={attachImageToQuestions}
                        onChange={(e) => setAttachImageToQuestions(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                      />
                      <span>แนบรูปภาพนี้เข้าไปในข้อสอบด้วย (ให้ผู้สอบมองเห็นรูปประกอบขณะทำข้อสอบ)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Presets for the chosen subject */}
            {!imagePreview && (
              <div>
                <span className="block text-[11px] font-medium text-slate-500 mb-1.5">
                  หัวข้อยอดนิยมในแนวข้อสอบ สตช. (คลิกเพื่อเลือกทันที):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presetTopics[subject]?.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTopic(p)}
                      className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 rounded-md transition-colors cursor-pointer text-left"
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนข้อสอบที่ต้องการ
                </label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value={1}>1 ข้อ</option>
                  <option value={3}>3 ข้อ (แนะนำ)</option>
                  <option value={5}>5 ข้อ</option>
                  <option value={10}>10 ข้อ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ระดับความยาก
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="easy">พื้นฐาน (เน้นความจำและความรู้ทั่วไป)</option>
                  <option value="medium">มาตรฐาน สตช. (ระดับข้อสอบแข่งขันจริง)</option>
                  <option value="hard">ประยุกต์ / หลอกลวง (ระดับคัดหัวกะทิ)</option>
                </select>
              </div>
            </div>

            {generateError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{generateError}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                AI จะสร้างโจทย์ ตัวเลือก 4 ช้อยส์ ดัชนีคำตอบที่ถูก และคำอธิบายกฎหมายอย่างละเอียด
              </span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI กำลังเขียนข้อสอบ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>สร้างข้อสอบด้วย AI ทันที</span>
                  </>
                )}
              </button>
            </div>

            {/* Preview of Generated Questions */}
            {generatedList.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 max-h-[300px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    รายการข้อสอบที่ AI สร้างขึ้น ({generatedList.length} ข้อ)
                  </span>
                  <button
                    onClick={handleSaveToBank}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>บันทึกทั้งหมดเข้าสู่คลังข้อสอบ</span>
                  </button>
                </div>

                {generatedList.map((q, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-800">
                        ข้อที่ {idx + 1}: {q.topic}
                      </span>
                      <span className="text-emerald-700 font-semibold">
                        เฉลย: ข้อ ({['ก', 'ข', 'ค', 'ง'][q.correctAnswerIndex]})
                      </span>
                    </div>
                    <p className="font-medium text-slate-900 whitespace-pre-line">{q.question}</p>
                    {q.imageUrl && (
                      <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-100 max-h-36 flex items-center justify-center p-1.5">
                        <img
                          src={q.imageUrl}
                          alt="ภาพประกอบข้อสอบ"
                          className="max-h-32 w-auto object-contain rounded"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1 text-slate-700">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-1.5 rounded ${
                            optIdx === q.correctAnswerIndex
                              ? 'bg-emerald-100 text-emerald-950 font-medium'
                              : 'bg-white'
                          }`}
                        >
                          {['ก', 'ข', 'ค', 'ง'][optIdx]}. {opt}
                        </div>
                      ))}
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-100 text-slate-600 text-[11px] leading-relaxed">
                      <strong>เหตุผลประกอบ:</strong> {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Deep Analyze existing question */}
        {activeTab === 'analyze' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลือกข้อสอบจากคลังที่ต้องการให้ AI วิเคราะห์เจาะลึก
              </label>
              <select
                value={selectedQuestionId}
                onChange={(e) => {
                  setSelectedQuestionId(e.target.value);
                  setAnalysisResult(null);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 text-slate-800"
              >
                {existingQuestions.map((q, idx) => (
                  <option key={q.id} value={q.id}>
                    #{idx + 1} [{q.subject.split(' ')[0]}] {q.topic} - {q.question.slice(0, 60)}...
                  </option>
                ))}
              </select>
            </div>

            {selectedQuestionObj && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="font-semibold text-slate-800">{selectedQuestionObj.subject}</span>
                  <span>·</span>
                  <span>{selectedQuestionObj.topic}</span>
                </div>
                <p className="font-medium text-slate-900 leading-relaxed">
                  {selectedQuestionObj.question}
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {selectedQuestionObj.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-xs ${
                        idx === selectedQuestionObj.correctAnswerIndex
                          ? 'bg-emerald-100/70 text-emerald-950 font-semibold'
                          : 'bg-white text-slate-700'
                      }`}
                    >
                      {['ก', 'ข', 'ค', 'ง'][idx]}. {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analyzeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{analyzeError}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAnalyzeSelected}
                disabled={isAnalyzing || !selectedQuestionObj}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI กำลังวิเคราะห์แนวทางคำตอบ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>วิเคราะห์แนวทางคำตอบ & เหตุผลอย่างละเอียด</span>
                  </>
                )}
              </button>
            </div>

            {/* Analysis Result Box */}
            {analysisResult && (
              <div className="p-4 bg-sky-500/5 rounded-xl border border-sky-300 text-xs space-y-3 max-h-[350px] overflow-y-auto">
                <div className="flex items-center gap-2 font-bold text-sky-900 text-sm">
                  <Lightbulb className="w-4 h-4 text-sky-600" />
                  <span>ผลการวิเคราะห์แนวทางคำตอบและคำอธิบายเชิงลึกจาก AI</span>
                </div>
                <div className="text-slate-800 whitespace-pre-line leading-relaxed space-y-2">
                  {analysisResult}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

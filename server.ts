import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: !!ai,
    timestamp: new Date().toISOString(),
  });
});

// AI Question Generator Endpoint
app.post('/api/ai/generate-questions', async (req, res) => {
  try {
    const {
      subject,
      topic,
      count = 3,
      difficulty = 'medium',
      imageBase64,
      mimeType = 'image/jpeg',
      attachImageToQuestion = false,
    } = req.body;

    if (!subject) {
      return res.status(400).json({ error: 'กรุณาระบุวิชาที่ต้องการสร้างข้อสอบ' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'ระบบ AI ไม่พร้อมใช้งานชั่วคราวเนื่องจากขาด GEMINI_API_KEY กรุณาลองใหม่อีกครั้ง',
      });
    }

    const questionCount = Math.min(Math.max(Number(count) || 3, 1), 10);

    const systemInstruction = `คุณคือผู้เชี่ยวชาญการออกข้อสอบคัดเลือกข้าราชการตำรวจชั้นประทวน (นายสิบตำรวจ: สายปราบปราม นสต. และสายอำนวยการ อก.) ของสำนักงานตำรวจแห่งชาติ (สตช.)
จงออกข้อสอบมาตรฐานระดับข้อสอบแข่งขันจริงตามหลักสูตร สตช. ล่าสุด
กฎสำคัญ:
1. หากมีรูปภาพแนบมาด้วย จงอ่านข้อความ เอกสารทางกฎหมาย มาตรา กฎระเบียบ สาระสำคัญ โจทย์ หรือตาราง/แผนภาพในรูปภาพอย่างละเอียดรอบคอบ แล้วนำเนื้อหาในภาพมาออกแบบเป็นข้อสอบอย่างแม่นยำ
2. แต่ละข้อต้องมี 4 ตัวเลือก (ก, ข, ค, ง) ที่สมจริงและมีตัวลวงที่ท้าทาย
3. ระบุ correctAnswerIndex เป็นตัวเลข 0, 1, 2, หรือ 3 ที่ตรงกับตัวเลือกที่ถูกต้อง
4. คำอธิบายเฉลย (explanation) ต้องละเอียด ชัดเจน อ้างอิงตัวบทกฎหมาย มาตรา สูตรคณิตศาสตร์ หรือหลักภาษาอย่างถูกต้อง
5. ให้คำแนะนำ/เทคนิคจำลัด (tips) สั้นๆ กระชับ สำหรับผู้เตรียมสอบ
6. ภาษาไทยถูกต้องตามระเบียบราชการ`;

    const promptText = imageBase64
      ? `คุณได้รับรูปภาพที่มีข้อความหรือเนื้อหาประกอบ (เช่น ภาพถ่ายเอกสารราชการ ข้อความกฎหมาย คำสั่ง ตร. ชีทสรุปเนื้อหา โจทย์ข้อสอบ ตารางสถิติ หรือแผนผัง)
กรุณาอ่านและวิเคราะห์ข้อความ/เนื้อหาสาระสำคัญทั้งหมดที่ปรากฏในรูปภาพนี้อย่างละเอียด
จากนั้นนำสาระสำคัญ กฎหมาย มาตรา ข้อเท็จจริง หรือหลักการในรูปภาพนี้มา "สร้างเป็นข้อสอบนายสิบตำรวจ" ในวิชา: "${subject}"
${topic ? `หัวข้อเจาะจงเพิ่มเติม: "${topic}"` : 'หัวข้อ: ให้ AI สรุปหัวข้อย่อย (topic) จากเนื้อหาในรูปภาพ'}
ระดับความยาก: ${difficulty}
จำนวนข้อที่ต้องการ: ${questionCount} ข้อ

รูปแบบคำตอบต้องเป็น JSON Array ตาม schema ที่กำหนด`
      : `กรุณาสร้างข้อสอบนายสิบตำรวจ วิชา: "${subject}"
${topic ? `หัวข้อเฉพาะเจาะจง: "${topic}"` : ''}
ระดับความยาก: ${difficulty}
จำนวน: ${questionCount} ข้อ

รูปแบบคำตอบต้องเป็น JSON Array ตาม schema ที่กำหนด`;

    let contentsPayload: any;

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      };
      const textPart = {
        text: promptText,
      };
      contentsPayload = { parts: [imagePart, textPart] };
    } else {
      contentsPayload = promptText;
    }

    let response: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contentsPayload,
          config: {
            systemInstruction,
            temperature: 0.6,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: {
                    type: Type.STRING,
                    description: 'คำถามข้อสอบชัดเจน มีบริบทข้อเท็จจริงหรือโจทย์',
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'ตัวเลือก 4 ตัวเลือกเรียงตามลำดับ ก, ข, ค, ง',
                  },
                  correctAnswerIndex: {
                    type: Type.INTEGER,
                    description: 'ดัชนีของตัวเลือกที่ถูกต้อง (0, 1, 2, หรือ 3)',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'คำอธิบายเฉลยอย่างละเอียด อ้างอิงกฎหมาย มาตรา หรือวิธีคิดอย่างครบถ้วน',
                  },
                  topic: {
                    type: Type.STRING,
                    description: 'หัวข้อย่อยของข้อสอบ เช่น พ.ร.บ.ตำรวจแห่งชาติ 2565, การสะกดคำ, อนุกรม',
                  },
                  tips: {
                    type: Type.STRING,
                    description: 'สูตรลัดหรือเทคนิคการจำข้อสอบข้อนี้',
                  },
                  difficulty: {
                    type: Type.STRING,
                    description: 'easy, medium, หรือ hard',
                  },
                },
                required: ['question', 'options', 'correctAnswerIndex', 'explanation', 'topic'],
              },
            },
          },
        });
        break;
      } catch (err: any) {
        const isTransient =
          err?.status === 503 ||
          err?.message?.includes('high demand') ||
          err?.message?.includes('UNAVAILABLE') ||
          err?.status === 429;
        if (attempt < 2 && isTransient) {
          await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }

    const text = response?.text || '[]';
    const questions = JSON.parse(text);

    const shouldAttachImage = Boolean(attachImageToQuestion && imageBase64);

    return res.json({
      success: true,
      questions: questions.map((q: any, idx: number) => ({
        id: `ai_${Date.now()}_${idx}`,
        subject,
        topic: q.topic || topic || subject,
        question: q.question,
        options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : q.options,
        correctAnswerIndex: Number(q.correctAnswerIndex) >= 0 && Number(q.correctAnswerIndex) <= 3 ? Number(q.correctAnswerIndex) : 0,
        explanation: q.explanation || 'ไม่มีคำอธิบายเพิ่มเติม',
        tips: q.tips || '',
        difficulty: q.difficulty || difficulty,
        imageUrl: shouldAttachImage ? imageBase64 : undefined,
        source: imageBase64 ? 'สร้างโดย AI สตช. (วิเคราะห์จากรูปภาพเอกสาร)' : 'สร้างโดยระบบ AI สตช.',
        createdAt: new Date().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-questions:', error);
    return res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการประมวลผล AI: ' + (error?.message || 'Unknown error'),
    });
  }
});

// AI Question Deep Explanation & Analysis Endpoint
app.post('/api/ai/explain-question', async (req, res) => {
  try {
    const { question, selectedOptionIndex } = req.body;

    if (!question || !question.question) {
      return res.status(400).json({ error: 'ข้อมูลข้อสอบไม่ครบถ้วน' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'ระบบ AI ไม่พร้อมใช้งานชั่วคราว',
      });
    }

    const systemInstruction = `คุณคืออาจารย์ติวเตอร์สอบนายสิบตำรวจระดับท็อปของประเทศ (ผู้เชี่ยวชาญทั้งสายปราบปรามและสายอำนวยการ)
วิเคราะห์และอธิบายข้อสอบข้อนี้อย่างลึกซึ้ง เข้าใจง่าย และให้เทคนิคทำคะแนนจริง
แบ่งหัวข้ออธิบายอย่างเป็นระบบ:
1. สรุปใจความสำคัญของโจทย์และประเด็นที่ผู้ออกข้อสอบต้องการวัดความรู้
2. เฉลยข้อที่ถูกต้องพร้อมเหตุผลทางกฎหมาย/สูตรคณิตศาสตร์/หลักภาษาที่ชัดเจน
3. เจาะลึกว่าทำไมตัวเลือกอื่นๆ ถึงผิด (ชี้จุดลวง)
4. เทคนิคจำง่าย สูตรลัด หรือข้อควรระวังในการสอบสนามจริง`;

    const userSelectedText =
      selectedOptionIndex !== undefined && question.options?.[selectedOptionIndex]
        ? `ผู้สอบเลือกตอบ: ข้อ (${['ก', 'ข', 'ค', 'ง'][selectedOptionIndex] || selectedOptionIndex}) ${question.options[selectedOptionIndex]}`
        : 'ผู้สอบยังไม่ได้เลือกคำตอบ';

    const prompt = `วิชา: ${question.subject || 'ทั่วไป'}
หัวข้อ: ${question.topic || 'ทั่วไป'}
โจทย์: ${question.question}
ตัวเลือก:
ก) ${question.options?.[0] || '-'}
ข) ${question.options?.[1] || '-'}
ค) ${question.options?.[2] || '-'}
ง) ${question.options?.[3] || '-'}

คำตอบที่ถูกต้องตามคลังข้อสอบคือ: ข้อ (${['ก', 'ข', 'ค', 'ง'][question.correctAnswerIndex] || question.correctAnswerIndex}) ${question.options?.[question.correctAnswerIndex] || ''}
${userSelectedText}

คำอธิบายเดิม: ${question.explanation || '-'}

กรุณาให้คำวิเคราะห์เจาะลึกและเทคนิคจำสำหรับข้อนี้อย่างละเอียดเป็นภาษาไทย`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    return res.json({
      success: true,
      analysis: response.text,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/explain-question:', error);
    return res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการวิเคราะห์เฉลย: ' + (error?.message || 'Unknown error'),
    });
  }
});

// AI Weakness Diagnostic & Coaching Roadmap Endpoint
app.post('/api/ai/weakness-coaching', async (req, res) => {
  try {
    const { totalScore, maxScore, percentage, passed, subjectScores, weakTopics, strongTopics } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'ระบบ AI ไม่พร้อมใช้งานชั่วคราว',
      });
    }

    const systemInstruction = `คุณคือผู้บัญชาการหลักสูตรติวสอบนายสิบตำรวจ สตช.
ให้คำวิจารณ์ผลสอบ (Diagnostic Assessment) และแผนติวเร่งด่วนรายบุคคล (Personalized Action Plan)
สำหรับผู้สอบนายสิบตำรวจที่เพิ่งทำแบบทดสอบเสร็จ
เน้นเกณฑ์ผ่านของ สตช. คือต้องผ่าน 60% ของกลุ่มวิชาความสามารถทั่วไป/ภาษาไทย และกลุ่มวิชากฎหมาย/ความรู้เฉพาะทาง
ให้กำลังใจอย่างนักสู้ และให้ตารางอ่านหนังสือ 7 วันที่นำไปปฏิบัติได้จริง`;

    const prompt = `สรุปผลสอบของผู้เรียน:
- คะแนนรวม: ${totalScore} / ${maxScore} (${percentage}%)
- สถานะ: ${passed ? 'ผ่านเกณฑ์มาตรฐาน สตช. (>= 60%)' : 'ยังไม่ผ่านเกณฑ์มาตรฐาน สตช. (< 60%)'}
- รายละเอียดคะแนนแต่ละวิชา:
${JSON.stringify(subjectScores, null, 2)}
- หัวข้อที่เป็นจุดอ่อนที่ทำผิดบ่อย:
${JSON.stringify(weakTopics, null, 2)}
- หัวข้อที่ทำได้ดี:
${JSON.stringify(strongTopics, null, 2)}

กรุณาสร้าง:
1. การประเมินภาพรวมความพร้อมลงสนามสอบจริง
2. วิเคราะห์จุดบอดสำคัญ 3 อันดับแรกที่ต้องอุดรอยรั่วทันที
3. แผนเร่งรัด 7 วันก่อนสอบ (วันละ 1-2 ข้อปฏิบัติที่เน้นหัวข้อที่อ่อน)
4. กำลังใจและคำคมสร้างวินัยสไตล์นักเรียนนายสิบตำรวจ`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    return res.json({
      success: true,
      coaching: response.text,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/weakness-coaching:', error);
    return res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการประมวลผลโค้ช AI: ' + (error?.message || 'Unknown error'),
    });
  }
});

// AI OCR & Exam Image Scanner Endpoint
app.post('/api/ai/scan-question-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', defaultSubject } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'กรุณาแนบไฟล์รูปภาพข้อสอบ' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'ระบบ AI ไม่พร้อมใช้งานชั่วคราวเนื่องจากขาด GEMINI_API_KEY',
      });
    }

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const systemInstruction = `คุณคือระบบอัจฉริยะในการตรวจเอกสารและสกัดข้อสอบนายสิบตำรวจจากรูปภาพ (OCR & Exam Intelligence Parser) ของสำนักงานตำรวจแห่งชาติ (สตช.)
หน้าที่ของคุณคือ:
1. อ่านข้อความภาษาไทยและภาษาอังกฤษจากรูปภาพอย่างแม่นยำ ไม่ตกหล่น
2. แปลงข้อสอบที่พบในรูปภาพให้เป็น JSON Array ของข้อสอบ
3. แต่ละข้อต้องประกอบด้วย:
   - question: คำถามข้อสอบที่ชัดเจน
   - options: อาร์เรย์ของตัวเลือก 4 ช้อยส์ (เรียงตาม ก, ข, ค, ง)
   - correctAnswerIndex: ตัวเลข 0 (ก), 1 (ข), 2 (ค), หรือ 3 (ง)
     (หากในรูปมีรอยกากบาท/วงกลมเฉลยให้ใช้ตามนั้น หากไม่มีเฉลย ให้ AI คำนวณและเฉลยข้อที่ถูกต้องตามหลักวิชาการ)
   - explanation: คำอธิบายเฉลยและเหตุผลประกอบอย่างละเอียด อ้างอิงตัวบทกฎหมาย มาตรา หรือวิธีคิด
   - tips: เทคนิคการจำหรือสูตรลัด
   - subject: ต้องเลือกให้ตรงกับ 1 ใน 6 วิชาหลักของ สตช. ได้แก่
     1) "ความสามารถทั่วไป (คณิตศาสตร์และตรรกศาสตร์)"
     2) "ภาษาไทย"
     3) "ภาษาอังกฤษ"
     4) "กฎหมายที่ประชาชนควรรู้และระเบียบ ตร."
     5) "สังคม วัฒนธรรม จริยธรรม และอาเซียน"
     6) "เทคโนโลยีสารสนเทศเพื่อการปฏิบัติงาน"
   - topic: หัวข้อย่อย เช่น การค้นในที่รโหฐาน, คำราชาศัพท์, อนุกรม
   - difficulty: "easy", "medium", หรือ "hard"`;

    const promptText = `กรุณาถอดข้อสอบทั้งหมดที่ปรากฏในรูปภาพนี้อย่างละเอียด และเฉลยพร้อมอธิบายเหตุผลประกอบ
${defaultSubject ? `หมายเหตุ: หากเป็นไปได้ให้จัดเข้าหมวดวิชา: "${defaultSubject}"` : ''}
ตอบกลับในรูปแบบ JSON Array ตาม schema ที่กำหนด`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const textPart = {
      text: promptText,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: 'คำถามข้อสอบที่อ่านได้จากรูปภาพ',
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'ตัวเลือก 4 ตัวเลือก เรียงตาม ก, ข, ค, ง',
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: 'ดัชนีคำตอบที่ถูกต้อง 0, 1, 2 หรือ 3',
              },
              explanation: {
                type: Type.STRING,
                description: 'คำอธิบายเฉลยและเหตุผลประกอบอย่างละเอียด',
              },
              tips: {
                type: Type.STRING,
                description: 'เทคนิคการจำหรือสูตรลัด',
              },
              subject: {
                type: Type.STRING,
                description: 'วิชาหลักตามหลักสูตร สตช.',
              },
              topic: {
                type: Type.STRING,
                description: 'หัวข้อย่อยหรือมาตรากฎหมาย',
              },
              difficulty: {
                type: Type.STRING,
                description: 'easy, medium, หรือ hard',
              },
            },
            required: ['question', 'options', 'correctAnswerIndex', 'explanation', 'subject', 'topic'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');

    return res.json({
      success: true,
      questions: parsed.map((q: any, idx: number) => ({
        id: `scan_${Date.now()}_${idx}`,
        subject: q.subject || defaultSubject || 'กฎหมายที่ประชาชนควรรู้และระเบียบ ตร.',
        topic: q.topic || 'สแกนจากรูปภาพ',
        question: q.question,
        options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : q.options,
        correctAnswerIndex:
          typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3
            ? q.correctAnswerIndex
            : 0,
        explanation: q.explanation || 'สแกนและวิเคราะห์เฉลยจากรูปภาพ',
        tips: q.tips || '',
        difficulty: q.difficulty || 'medium',
        source: 'สแกนจากรูปภาพข้อสอบ',
        createdAt: new Date().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error in /api/ai/scan-question-image:', error);
    return res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการสแกนรูปภาพข้อสอบ: ' + (error?.message || 'Unknown error'),
    });
  }
});

// Mount Vite or static server
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

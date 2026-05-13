import React, { useState, useRef } from 'react';
import { Camera, Mic, Plus, Loader2 } from 'lucide-react';
import type { NeedReport } from '../services/dataService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './InputFab.css';

interface InputFabProps {
  onReportAdded: (report: NeedReport) => void;
}

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'gemma3:4b';

// ─── Shared JSON prompt template ─────────────────────────────────────────────
const TEXT_PROMPT = (text: string) => `
You are an AI assistant for a local NGO. Extract information from the text and return ONLY a valid JSON object with no extra text:
{
  "title": "short descriptive title",
  "description": "full summary",
  "urgency": <integer 1-10>,
  "category": "one word",
  "peopleAffected": <integer>,
  "timeNeeded": "e.g. 2 hrs"
}
Text: "${text}"`;

const IMAGE_PROMPT = `You are an AI assistant for a local NGO. This image shows a paper survey form or community problem.
Extract and return ONLY a valid JSON object with no extra text:
{
  "title": "short descriptive title",
  "description": "full summary of the issue",
  "urgency": <integer 1-10>,
  "category": "one word: Water/Health/Education/Infrastructure/Safety",
  "peopleAffected": <integer>,
  "timeNeeded": "e.g. 2 hrs"
}`;

// ─── Ollama helpers ───────────────────────────────────────────────────────────
const callOllamaText = async (prompt: string): Promise<string> => {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response;
};

const callOllamaImage = async (prompt: string, base64: string): Promise<string> => {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      images: [base64],   // gemma3 supports vision via this field
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response;
};

// ─── Parse JSON from any LLM response ────────────────────────────────────────
const parseJSON = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in response');
  return JSON.parse(match[0]);
};

// ─── Build NeedReport from parsed data ───────────────────────────────────────
const buildReport = (data: any, fallbackDesc: string, sourceType: 'image' | 'voice'): NeedReport => ({
  id: `ai-${Date.now()}`,
  lat: 40.7128 + (Math.random() * 0.02 - 0.01),
  lng: -74.006 + (Math.random() * 0.02 - 0.01),
  title: data.title || 'New Need',
  description: data.description || fallbackDesc,
  urgency: data.urgency || 5,
  status: 'open',
  category: data.category || 'General',
  peopleAffected: data.peopleAffected || 10,
  timeNeeded: data.timeNeeded || '1 hr',
  trustScore: sourceType === 'image' ? 10 : 8,
});

// ─── Component ────────────────────────────────────────────────────────────────
const InputFab: React.FC<InputFabProps> = ({ onReportAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  if (recognition) {
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
  }

  // ── Gemini helpers ──────────────────────────────────────────────────────────
  const getGenAI = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY missing');
    return new GoogleGenerativeAI(apiKey);
  };

  const parseRetryDelay = (err: unknown) => {
    const m = String(err).match(/retryDelay[^\d]*(\d+)/);
    return m ? parseInt(m[1], 10) : 15;
  };

  const countdown = (secs: number): Promise<void> =>
    new Promise((resolve) => {
      let t = secs;
      setStatusMsg(`Gemini quota — retrying in ${t}s`);
      const iv = setInterval(() => {
        t -= 1;
        if (t <= 0) { clearInterval(iv); setStatusMsg('Retrying Gemini…'); resolve(); }
        else setStatusMsg(`Gemini quota — retrying in ${t}s`);
      }, 1000);
    });

  // ── Unified text pipeline: Gemini → Ollama fallback ────────────────────────
  const processText = async (text: string) => {
    setIsProcessing(true);
    try {
      let responseText = '';
      let usedOllama = false;

      // 1. Try each Gemini model
      const genAI = getGenAI();
      for (const modelName of GEMINI_MODELS) {
        try {
          setStatusMsg(`Gemini (${modelName})…`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(TEXT_PROMPT(text));
          responseText = result.response.text();
          break;
        } catch (err: unknown) {
          if (String(err).includes('429')) {
            await countdown(parseRetryDelay(err));
          } else { throw err; }
        }
      }

      // 2. All Gemini models failed → use local Ollama
      if (!responseText) {
        setStatusMsg(`Gemini quota exceeded — using local Ollama (${OLLAMA_MODEL})…`);
        responseText = await callOllamaText(TEXT_PROMPT(text));
        usedOllama = true;
      }

      console.log(`Response (${usedOllama ? 'Ollama' : 'Gemini'}):`, responseText);
      const data = parseJSON(responseText);
      onReportAdded(buildReport(data, text, 'voice'));
      setIsOpen(false);

    } catch (err) {
      console.error('Text AI Error:', err);
      // Check if Ollama isn't running
      const hint = String(err).includes('fetch')
        ? '\n\nMake sure Ollama is running:\n  ollama serve\n  ollama run gemma3:4b'
        : '';
      alert(`AI processing failed.${hint}\n\nAdding fallback report.`);
      onReportAdded({
        id: `fb-${Date.now()}`, lat: 40.7128, lng: -74.006,
        title: 'Manual Report', description: text,
        urgency: 5, status: 'open', category: 'General',
      });
    } finally {
      setIsProcessing(false);
      setStatusMsg('');
    }
  };

  // ── Unified image pipeline: Gemini → Ollama fallback ───────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Read base64 once — used by both Gemini and Ollama
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let responseText = '';
      let usedOllama = false;

      // 1. Try each Gemini model (vision)
      try {
        const genAI = getGenAI();
        const imagePart = { inlineData: { data: base64, mimeType: file.type || 'image/jpeg' } };
        for (const modelName of GEMINI_MODELS) {
          try {
            setStatusMsg(`Gemini vision (${modelName})…`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([IMAGE_PROMPT, imagePart]);
            responseText = result.response.text();
            break;
          } catch (err: unknown) {
            if (String(err).includes('429')) {
              await countdown(parseRetryDelay(err));
            } else { throw err; }
          }
        }
      } catch (_) {
        // Gemini init failed (no API key etc.) — skip straight to Ollama
      }

      // 2. Gemini exhausted or unavailable → Ollama vision
      if (!responseText) {
        setStatusMsg(`Gemini quota exceeded — using local Ollama (${OLLAMA_MODEL})…`);
        responseText = await callOllamaImage(IMAGE_PROMPT, base64);
        usedOllama = true;
      }

      console.log(`Vision response (${usedOllama ? 'Ollama' : 'Gemini'}):`, responseText);
      const data = parseJSON(responseText);
      onReportAdded(buildReport(data, 'Extracted from uploaded image', 'image'));
      setIsOpen(false);

    } catch (err) {
      console.error('Image AI Error:', err);
      const hint = String(err).includes('fetch')
        ? '\n\nMake sure Ollama is running:\n  ollama serve\n  ollama run gemma3:4b'
        : '';
      alert(`Failed to process image.${hint}\n\nAdding fallback report.`);
      onReportAdded({
        id: `fb-${Date.now()}`, lat: 40.7128, lng: -74.006,
        title: 'Manual Image Report',
        description: 'Image could not be processed.',
        urgency: 5, status: 'open', category: 'General',
      });
    } finally {
      setIsProcessing(false);
      setStatusMsg('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Speech ──────────────────────────────────────────────────────────────────
  const startRecording = () => {
    if (!recognition) { alert('Speech Recognition not supported. Use Chrome or Edge.'); return; }
    setIsRecording(true);
    recognition.start();
    recognition.onresult = (event: any) => {
      setIsRecording(false);
      processText(event.results[0][0].transcript);
    };
    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      setIsRecording(false);
    };
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fab-container">
      {isOpen && (
        <div className="fab-menu">
          <button
            className={`fab-item glass ${isRecording ? 'recording' : ''}`}
            onMouseDown={startRecording}
            onMouseUp={() => recognition?.stop()}
            title="Hold to Speak"
          >
            <Mic size={24} />
          </button>

          <button
            className="fab-item glass"
            onClick={() => fileInputRef.current?.click()}
            title="Snap & Map"
          >
            <Camera size={24} />
            <input
              type="file" accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </button>
        </div>
      )}

      {/* Live status pill */}
      {statusMsg && (
        <div style={{
          position: 'absolute', bottom: '5rem', right: 0,
          background: 'rgba(0,0,0,0.78)', color: '#fff',
          padding: '6px 14px', borderRadius: '20px',
          fontSize: '12px', whiteSpace: 'nowrap',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {statusMsg}
        </div>
      )}

      <button
        className={`fab-main ${isOpen ? 'open' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={() => !isProcessing && setIsOpen(!isOpen)}
      >
        {isProcessing ? <Loader2 className="spinner" size={28} /> : <Plus size={32} />}
      </button>
    </div>
  );
};

export default InputFab;
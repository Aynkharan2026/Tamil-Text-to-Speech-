/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  Upload, 
  FileText, 
  Settings, 
  Download, 
  Loader2, 
  Languages, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TRANSLATIONS, Language, VOICE_MAP, SPEED_MAP, LOGO_URL } from "./constants";

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [lang, setLang] = useState<Language>("ta");
  const [inputText, setInputText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

  // Voice Settings
  const [gender, setGender] = useState<"male" | "female">("female");
  const [tone, setTone] = useState<"soft" | "medium" | "hard">("medium");
  const [speed, setSpeed] = useState<"slow" | "normal" | "fast">("normal");

  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load Logo Image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = LOGO_URL;
    img.onload = () => {
      setLogoImage(img);
    };
    img.onerror = () => {
      console.warn("Failed to load logo from URL, using canvas fallback");
      setLogoImage(null);
    };
  }, []);

  // Generate Logo Base64 for MP4 background
  const getLogoBase64 = (): string => {
    const canvas = logoCanvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/png");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsExtracting(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t.errorGeneric);

      setInputText(data.text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConvert = async () => {
    if (!inputText.trim()) return;

    setError(null);
    setIsConverting(true);
    setVideoUrl(null);
    setSuccess(false);

    try {
      // Redraw canvas before generating base64 to ensure it's up to date
      drawLogo();

      // 1. Call Gemini TTS
      const voiceName = VOICE_MAP[gender][tone];
      const speedVal = SPEED_MAP[speed];
      
      // Construct prompt based on tone
      let toneInstruction = "";
      if (tone === "soft") toneInstruction = "Speak in a very soft, gentle, and calm voice.";
      if (tone === "hard") toneInstruction = "Speak in a firm, powerful, and authoritative voice.";
      if (tone === "medium") toneInstruction = "Speak in a natural, clear, and professional voice.";

      const prompt = `${toneInstruction} Read the following Tamil text clearly: ${inputText}`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioBase64) throw new Error("Failed to generate audio from AI");

      // 2. Call Backend to generate MP4
      const logoBase64 = getLogoBase64();
      const videoResponse = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, logoBase64 }),
      });

      if (!videoResponse.ok) {
        const errData = await videoResponse.json();
        throw new Error(errData.error || "Video generation failed");
      }

      const videoBlob = await videoResponse.blob();
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.errorGeneric);
    } finally {
      setIsConverting(false);
    }
  };

  // Draw Logo on Canvas
  const drawLogo = () => {
    const canvas = logoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size for HD video background (1280x720)
    canvas.width = 1280;
    canvas.height = 720;

    if (logoImage) {
      // Draw the loaded image
      // Center and scale to fit while maintaining aspect ratio
      const scale = Math.min(canvas.width / logoImage.width, canvas.height / logoImage.height) * 0.8;
      const x = (canvas.width / 2) - (logoImage.width / 2) * scale;
      const y = (canvas.height / 2) - (logoImage.height / 2) * scale;
      
      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(logoImage, x, y, logoImage.width * scale, logoImage.height * scale);
    } else {
      // Fallback: Original Canvas Drawing
      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, "#fdfcfb");
      grad.addColorStop(1, "#e2d1c3");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Draw a decorative circle/drum-like shape
      ctx.beginPath();
      ctx.arc(640, 360, 250, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(139, 69, 19, 0.1)";
      ctx.lineWidth = 20;
      ctx.stroke();

      // Text "தாய்வீடு"
      ctx.fillStyle = "#5d4037";
      ctx.font = "bold 120px 'Noto Sans Tamil', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("தாய்வீடு", 640, 340);

      // Subtext
      ctx.font = "italic 40px 'Noto Sans Tamil', sans-serif";
      ctx.fillStyle = "#8d6e63";
      ctx.fillText("Thaiveedu Tamil TTS", 640, 440);

      // Drum Illustration (Simplified)
      ctx.beginPath();
      ctx.ellipse(640, 550, 80, 30, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#3e2723";
      ctx.fill();
      ctx.fillRect(560, 550, 160, 40);
      ctx.beginPath();
      ctx.ellipse(640, 590, 80, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    drawLogo();
  }, [logoImage]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#2d3436] font-sans selection:bg-orange-100">
      {/* Hidden Canvas for Logo Generation */}
      <canvas ref={logoCanvasRef} className="hidden" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <Volume2 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">{t.title}</h1>
              <p className="text-xs text-gray-500 font-medium">{t.subtitle}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setLang(lang === "en" ? "ta" : "en")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-semibold"
          >
            <Languages size={18} />
            {t.language}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText size={20} className="text-orange-600" />
                {t.directText}
              </h2>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-orange-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Upload size={16} />
                {t.uploadDoc}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx" 
                onChange={handleFileUpload}
              />
            </div>

            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.placeholder}
                className="w-full h-80 p-5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-orange-500/20 text-lg leading-relaxed resize-none transition-all placeholder:text-gray-400"
              />
              {isExtracting && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
                  <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                  <p className="font-semibold text-gray-700">{t.extracting}</p>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-400 font-medium">{t.pageLimit}</p>
          </section>

          {/* Action Button */}
          <button
            onClick={handleConvert}
            disabled={!inputText.trim() || isConverting}
            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-lg font-bold transition-all shadow-xl ${
              !inputText.trim() || isConverting
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98] shadow-orange-200"
            }`}
          >
            {isConverting ? (
              <>
                <Loader2 className="animate-spin" />
                {t.converting}
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                {t.convert}
              </>
            )}
          </button>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 flex items-start gap-3"
              >
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-start gap-3"
              >
                <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm font-medium">{t.success}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Settings & Output */}
        <div className="space-y-6">
          {/* Settings Panel */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Settings size={20} className="text-orange-600" />
              {t.settings}
            </h2>

            <div className="space-y-6">
              {/* Gender */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{t.gender}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["male", "female"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                        gender === g 
                          ? "bg-orange-50 border-orange-600 text-orange-700" 
                          : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                      }`}
                    >
                      {t[g]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{t.tone}</label>
                <div className="grid grid-cols-1 gap-2">
                  {(["soft", "medium", "hard"] as const).map((ton) => (
                    <button
                      key={ton}
                      onClick={() => setTone(ton)}
                      className={`py-2.5 px-4 rounded-xl text-sm font-bold text-left transition-all border-2 ${
                        tone === ton 
                          ? "bg-orange-50 border-orange-600 text-orange-700" 
                          : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                      }`}
                    >
                      {t[ton]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{t.speed}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["slow", "normal", "fast"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
                        speed === s 
                          ? "bg-orange-50 border-orange-600 text-orange-700" 
                          : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                      }`}
                    >
                      {t[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Output Preview */}
          <AnimatePresence>
            {videoUrl && (
              <motion.section 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden"
              >
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Download size={20} className="text-orange-600" />
                  {t.preview}
                </h2>
                
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full aspect-video rounded-2xl bg-black shadow-inner"
                />

                <a
                  href={videoUrl}
                  download="thaiveedu_tamil_tts.mp4"
                  className="mt-4 w-full py-4 rounded-2xl bg-gray-900 text-white flex items-center justify-center gap-2 font-bold hover:bg-black transition-colors"
                >
                  <Download size={18} />
                  {t.download}
                </a>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
           <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <Volume2 size={24} />
           </div>
           <p className="text-xs font-bold uppercase tracking-[0.2em]">தாய்வீடு • Thaiveedu</p>
        </div>
      </footer>
    </div>
  );
}

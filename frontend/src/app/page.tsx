"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Upload, 
  Settings, 
  FileText, 
  Download, 
  Sparkles, 
  Play, 
  Pause, 
  Check, 
  RefreshCw,
  Video,
  Type,
  Maximize2,
  AlertCircle,
  Key,
  Languages,
  RotateCcw,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Wand2,
  ChevronDown,
  ChevronUp,
  Trash2,
  HelpCircle,
  X,
  Plus,
  Loader2,
  Sun,
  Moon,
  Search,
  Zap,
  Clock,
  History,
  FolderOpen
} from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

interface Word {
  word: string;
  start: number;
  end: number;
}

interface SubtitleStyle {
  name: string;
  fontName: string;
  fontSize: number;
  primaryColor: string;
  outlineColor: string;
  outlineWidth: number;
  shadowColor: string;
  shadowWidth: number;
  bold: number;
  italic: number;
  alignment: number | string;
  styleType: "classic" | "highlight" | "karaoke" | "pop";
  highlightColor: string;
  wordSpacing?: number;
}

const TEMPLATES: Record<string, SubtitleStyle> = {
  highlight: {
    name: "AI Highlight",
    fontName: "Arial",
    fontSize: 56,
    primaryColor: "#FFFFFF",
    outlineColor: "#000000",
    outlineWidth: 0.0,
    shadowColor: "#000000",
    shadowWidth: 0.0,
    bold: 1,
    italic: 0,
    alignment: "lower_bottom",
    styleType: "highlight",
    highlightColor: "#FFD400",
    wordSpacing: 0
  },
  karaoke: {
    name: "Neon Karaoke",
    fontName: "Arial",
    fontSize: 60,
    primaryColor: "#FFFFFF",
    outlineColor: "#000000",
    outlineWidth: 0.0,
    shadowColor: "#000000",
    shadowWidth: 0.0,
    bold: 1,
    italic: 0,
    alignment: "lower_bottom",
    styleType: "karaoke",
    highlightColor: "#00FF66",
    wordSpacing: 0
  },
  pop: {
    name: "Pop Word",
    fontName: "Impact",
    fontSize: 72,
    primaryColor: "#FFE500",
    outlineColor: "#000000",
    outlineWidth: 0.0,
    shadowColor: "#000000",
    shadowWidth: 0.0,
    bold: 1,
    italic: 0,
    alignment: "upper_middle",
    styleType: "pop",
    highlightColor: "#FFE500",
    wordSpacing: 0
  },
  classic: {
    name: "Classic Sub",
    fontName: "Arial",
    fontSize: 48,
    primaryColor: "#FFFFFF",
    outlineColor: "#000000",
    outlineWidth: 0.0,
    shadowColor: "#000000",
    shadowWidth: 1.0,
    bold: 1,
    italic: 0,
    alignment: "lower_bottom",
    styleType: "classic",
    highlightColor: "#FFFF00",
    wordSpacing: 0
  },
  cyber: {
    name: "Cyber Cyan",
    fontName: "Trebuchet MS",
    fontSize: 56,
    primaryColor: "#FFFFFF",
    outlineColor: "#0F172A",
    outlineWidth: 0.0,
    shadowColor: "#06B6D4",
    shadowWidth: 0.0,
    bold: 1,
    italic: 0,
    alignment: "lower_bottom",
    styleType: "highlight",
    highlightColor: "#00F0FF",
    wordSpacing: 0
  },
  sunset: {
    name: "Sunset Flame",
    fontName: "Montserrat",
    fontSize: 58,
    primaryColor: "#FFFFFF",
    outlineColor: "#1E1B4B",
    outlineWidth: 0.0,
    shadowColor: "#000000",
    shadowWidth: 0.0,
    bold: 1,
    italic: 0,
    alignment: "lower_bottom",
    styleType: "highlight",
    highlightColor: "#FF5E36",
    wordSpacing: 0
  }
};

const FONTS = [
  "Arial", 
  "Nirmala UI", 
  "Segoe UI", 
  "Poppins", 
  "Montserrat", 
  "Impact", 
  "Georgia", 
  "Trebuchet MS", 
  "Times New Roman", 
  "Verdana"
];

function chunkWords(
  words: Word[], 
  maxWords: number = 3, 
  maxChars: number = 22, 
  maxDuration: number = 2.0, 
  pauseThreshold: number = 0.4
): Word[][] {
  if (!words || words.length === 0) return [];
  const chunks: Word[][] = [];
  let currentChunk: Word[] = [];
  
  for (const wordInfo of words) {
    if (currentChunk.length === 0) {
      currentChunk.push(wordInfo);
      continue;
    }
    
    const prevWord = currentChunk[currentChunk.length - 1];
    const chunkText = currentChunk.map(w => w.word).join(" ") + " " + wordInfo.word;
    const chunkDuration = wordInfo.end - currentChunk[0].start;
    const timeGap = wordInfo.start - prevWord.end;
    
    if (currentChunk.length >= maxWords || 
        chunkText.length > maxChars || 
        timeGap > pauseThreshold || 
        chunkDuration > maxDuration) {
      chunks.push(currentChunk);
      currentChunk = [wordInfo];
    } else {
      currentChunk.push(wordInfo);
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

export default function Home() {
  // Theme State: default "light" to match the mockup aesthetic, toggleable to "dark"
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as "dark" | "light" | null;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        if (stored === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        // Default to light as shown in the mockup
        setTheme("light");
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Application State
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const [transcribeStage, setTranscribeStage] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [wordSearchQuery, setWordSearchQuery] = useState("");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Custom Styles
  const [selectedTemplate, setSelectedTemplate] = useState("highlight");
  const [customStyle, setCustomStyle] = useState<SubtitleStyle>(TEMPLATES.highlight);
  const [maxWords, setMaxWords] = useState(3);
  
  // Tabs: 'style' | 'transcript' | 'export'
  const [activeTab, setActiveTab] = useState<"style" | "transcript" | "export">("style");
  
  // Player & Sync Preview state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [localFilePreviewUrl, setLocalFilePreviewUrl] = useState<string | null>(null);

  // Manage object URL for local video preview & cleanup
  useEffect(() => {
    if (!file) {
      setLocalFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalFilePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Cloud Server Wake-up & Live Status State
  const [serverStatus, setServerStatus] = useState<"checking" | "awake" | "waking_up" | "offline">("checking");
  const [serverWakeTime, setServerWakeTime] = useState<number>(0);

  // Proactive background ping on page load
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    let wakeCounter: NodeJS.Timeout | undefined;
    const startTime = Date.now();

    const checkServerHealth = async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const res = await fetch(`${API_BASE_URL}/health`, { 
          signal: controller.signal,
          cache: "no-store" 
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          setServerStatus("awake");
          return true;
        } else {
          setServerStatus("waking_up");
          return false;
        }
      } catch {
        setServerStatus("waking_up");
        return false;
      }
    };

    checkServerHealth().then((isAwake) => {
      if (!isAwake) {
        wakeCounter = setInterval(() => {
          setServerWakeTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        timer = setInterval(async () => {
          const awake = await checkServerHealth();
          if (awake) {
            if (timer) clearInterval(timer);
            if (wakeCounter) clearInterval(wakeCounter);
          }
        }, 4000);
      }
    });

    return () => {
      if (timer) clearInterval(timer);
      if (wakeCounter) clearInterval(wakeCounter);
    };
  }, []);

  // Player container & video dimensions for exact WYSIWYG scaling
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 338, height: 600 });

  useEffect(() => {
    const container = playerContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      if (playerContainerRef.current) {
        const rect = playerContainerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    window.addEventListener("resize", updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [videoPreviewUrl]);

  const renderBox = useMemo(() => {
    const cWidth = containerSize.width || 338;
    const cHeight = containerSize.height || 600;

    const vWidth = videoDimensions?.width || 1080;
    const vHeight = videoDimensions?.height || 1920;

    const videoAspect = vWidth / vHeight;
    const containerAspect = cWidth / cHeight;

    let renderWidth = cWidth;
    let renderHeight = cHeight;

    if (videoAspect > containerAspect) {
      renderWidth = cWidth;
      renderHeight = cWidth / videoAspect;
    } else {
      renderHeight = cHeight;
      renderWidth = cHeight * videoAspect;
    }

    const top = (cHeight - renderHeight) / 2;
    const left = (cWidth - renderWidth) / 2;
    const scale = renderHeight / 1920;

    return { width: renderWidth, height: renderHeight, top, left, scale };
  }, [containerSize.width, containerSize.height, videoDimensions?.width, videoDimensions?.height]);

  const getVideoRenderBox = () => renderBox;
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState("");
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportQuality, setExportQuality] = useState<"480p" | "720p" | "1080p">("720p");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI API Keys & Provider states (Groq Cloud & Google Gemini)
  const [groqApiKey, setGroqApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showGroqApiKey, setShowGroqApiKey] = useState(false);
  const [showGeminiApiKey, setShowGeminiApiKey] = useState(false);
  const [activeKeyTab, setActiveKeyTab] = useState<"groq" | "gemini">("groq");
  
  const [isGroqKeyTesting, setIsGroqKeyTesting] = useState(false);
  const [groqValidationStatus, setGroqValidationStatus] = useState<{ checked: boolean; valid: boolean; message: string } | null>(null);
  
  const [isKeyTesting, setIsKeyTesting] = useState(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState<{ checked: boolean; valid: boolean; message: string } | null>(null);
  
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>("hinglish");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingLang, setTranslatingLang] = useState<string | null>(null);
  const [customLanguage, setCustomLanguage] = useState<string>("");
  const [showCustomLangInput, setShowCustomLangInput] = useState<boolean>(false);
  const [originalWords, setOriginalWords] = useState<Word[] | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>("original");
  const [translationBanner, setTranslationBanner] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Active Provider: If Groq API key exists, whole flow shifts to Groq!
  const activeProvider = useMemo<"groq" | "gemini" | "local">(() => {
    if (groqApiKey.trim()) return "groq";
    if (geminiApiKey.trim()) return "gemini";
    return "local";
  }, [groqApiKey, geminiApiKey]);

  // Auto-dismiss translation toast after 4.5s without shifting layout
  useEffect(() => {
    if (translationBanner) {
      const timer = setTimeout(() => {
        setTranslationBanner(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [translationBanner]);

  // Load saved API Keys from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedGroqKey = localStorage.getItem("captions_groq_api_key");
      if (savedGroqKey) {
        setGroqApiKey(savedGroqKey);
        setActiveKeyTab("groq");
      }
      const savedGeminiKey = localStorage.getItem("captions_gemini_api_key");
      if (savedGeminiKey) {
        setGeminiApiKey(savedGeminiKey);
        if (!savedGroqKey) {
          setActiveKeyTab("gemini");
        }
      }
    }
  }, []);

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    setCustomStyle(TEMPLATES[templateName]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ext || !["mp4", "mov", "avi", "mkv"].includes(ext)) {
      setErrorMsg("Unsupported file format. Please upload an MP4, MOV, AVI, or MKV video.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 1. Enforce Max File Size (100 MB)
    const MAX_SIZE_MB = 100;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE_BYTES) {
      const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
      setErrorMsg(`Video file size is ${fileSizeMB}MB, which exceeds the ${MAX_SIZE_MB}MB limit. Please upload a smaller video.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Enforce Max Video Duration (Max 3 minutes / 180 seconds)
    const MAX_DURATION_SEC = 180;
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    const blobUrl = URL.createObjectURL(selectedFile);
    tempVideo.src = blobUrl;

    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(blobUrl);
      const dur = tempVideo.duration;
      if (dur && dur > MAX_DURATION_SEC) {
        const mins = Math.floor(dur / 60);
        const secs = Math.floor(dur % 60);
        setErrorMsg(`Video duration is ${mins}m ${secs}s, which exceeds the 3-minute limit (max 180s). Please trim your video to 3 minutes or less.`);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFile(selectedFile);
      setErrorMsg(null);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      // Fallback: accept file if browser video player codec cannot parse, backend will strictly validate
      setFile(selectedFile);
      setErrorMsg(null);
    };
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (localFilePreviewUrl) {
      URL.revokeObjectURL(localFilePreviewUrl);
      setLocalFilePreviewUrl(null);
    }
    setFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChangeVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleResetWorkspace = () => {
    setShowResetConfirmModal(true);
  };

  const confirmResetWorkspace = () => {
    if (jobId) {
      // Immediately notify backend to delete previous video & temp files to conserve cloud storage
      fetch(`${API_BASE_URL}/api/cleanup/${jobId}`, { method: "POST" }).catch(() => {});
    }
    setJobId(null);
    setFile(null);
    setWords([]);
    setOriginalWords(null);
    setVideoPreviewUrl(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setErrorMsg(null);
    setTranslationBanner(null);
    setExportSuccess(false);
    setExportUrl(null);
    setTranscribeProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowResetConfirmModal(false);
  };

  const uploadAndTranscribe = async () => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setErrorMsg("Video file size exceeds the 100MB limit. Please upload a smaller video.");
      return;
    }
    setLoading(true);
    setTranscribeProgress(5);
    setTranscribeStage("Uploading video and extracting audio stream...");
    setLoadingText("Uploading video & extracting audio...");
    setErrorMsg(null);
    setTranslationBanner(null);
    setOriginalWords(null);
    setCurrentLanguage("original");
    
    const isGroq = Boolean(groqApiKey.trim());
    const isGemini = Boolean(geminiApiKey.trim());

    const formData = new FormData();
    formData.append("file", file);
    if (jobId) {
      // Clean up previous video from cloud instance when re-uploading
      formData.append("previousJobId", jobId);
    }
    if (isGroq) {
      formData.append("groqApiKey", groqApiKey.trim());
      formData.append("engine", "groq");
      setLoadingText("⚡ Groq Cloud Whisper Large is transcribing in 1-3 seconds...");
      setTranscribeStage("⚡ Uploading to Groq Cloud Whisper Large...");
    } else if (isGemini) {
      formData.append("geminiApiKey", geminiApiKey.trim());
      formData.append("engine", "gemini");
      setLoadingText("AI is transcribing audio verbatim with speech timestamps...");
      setTranscribeStage("AI is transcribing audio verbatim with speech timestamps...");
    } else {
      setLoadingText("Whisper is parsing audio and generating timestamps...");
      setTranscribeStage("Whisper is parsing audio locally...");
    }

    let currentP = 5.00;
    const transcribeStartTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - transcribeStartTime) / 1000);
      
      // Asymptotic smooth progression: fast at start, smooth micro-increments at the end, NEVER freezes
      if (currentP < 70) {
        currentP += isGroq ? 4.55 : 2.15;
      } else if (currentP < 90) {
        currentP += isGroq ? 2.25 : 1.15;
      } else if (currentP < 98) {
        currentP += 0.35; // Continuous smooth creeping
      }
      
      const roundedP = Math.min(98.95, Number(currentP.toFixed(2)));
      setTranscribeProgress(roundedP);

      if (roundedP < 25) {
        setTranscribeStage(isGroq ? "⚡ Uploading video to cloud container..." : "Uploading video & extracting audio stream...");
      } else if (roundedP < 55) {
        setTranscribeStage(isGroq 
          ? "⚡ Groq Cloud Whisper Large: Transcribing spoken words verbatim..." 
          : (isGemini 
            ? "Gemini Multimodal: Parsing audio speech timestamps..." 
            : "Whisper is analyzing audio and parsing timings locally..."));
      } else if (roundedP < 80) {
        setTranscribeStage(isGroq ? "⚡ Synchronizing phonetic word timestamps..." : "Synchronizing phonetic word timestamps...");
      } else if (roundedP < 92) {
        setTranscribeStage("Finalizing and preparing subtitle workspace...");
      } else {
        // Rotating stages after 92% with live elapsed counter so user knows it's actively working
        const cycle = elapsedSec % 12;
        if (cycle < 4) {
          setTranscribeStage(`Processing audio stream on cloud container (${elapsedSec}s)...`);
        } else if (cycle < 8) {
          setTranscribeStage(`⚡ Groq Cloud: Finalizing word timing alignments (${elapsedSec}s)...`);
        } else {
          setTranscribeStage(`Almost ready! Opening visual subtitle studio (${elapsedSec}s)...`);
        }
      }
    }, isGroq ? 300 : 500);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);
      
      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.detail || `Server returned HTTP ${response.status}.`);
      }
      
      setTranscribeProgress(100);
      setTranscribeStage("Transcription complete!");
      await new Promise(r => setTimeout(r, 350));
      
      const data = await response.json();
      setJobId(data.id);
      setWords(data.words);
      // Prioritize local blob URL for 100% zero-latency, buttery smooth 60fps playback without cloud network lag
      if (localFilePreviewUrl) {
        setVideoPreviewUrl(localFilePreviewUrl);
      } else if (file) {
        const localUrl = URL.createObjectURL(file);
        setLocalFilePreviewUrl(localUrl);
        setVideoPreviewUrl(localUrl);
      } else {
        setVideoPreviewUrl(`${API_BASE_URL}/api/preview/${data.id}`);
      }
      setActiveTab("style");
    } catch (err: any) {
      clearInterval(progressTimer);
      setTranscribeProgress(0);
      console.error(err);
      if (err?.name === "TypeError" || (typeof err?.message === "string" && err.message.toLowerCase().includes("fetch"))) {
        setErrorMsg("Backend server se connect nahi ho paya. Render Free Tier par server sleep ho jata hai aur start hone me ~50s leta hai. Kripya 30 second baad dobara try karein.");
      } else {
        setErrorMsg(err.message || "An error occurred during audio extraction or transcription.");
      }
    } finally {
      clearInterval(progressTimer);
      setLoading(false);
    }
  };

  const handleWordChange = (index: number, key: keyof Word, value: string | number) => {
    const updated = [...words];
    updated[index] = {
      ...updated[index],
      [key]: key === "word" ? value : Number(value)
    };
    setWords(updated);
  };

  const handleAddWord = (index: number) => {
    const current = words[index];
    const newWord: Word = {
      word: "new",
      start: current ? Number(current.end.toFixed(2)) : 0,
      end: current ? Number((current.end + 0.3).toFixed(2)) : 0.3
    };
    const updated = [...words];
    updated.splice(index + 1, 0, newWord);
    setWords(updated);
  };

  const handleDeleteWord = (index: number) => {
    if (words.length <= 1) return;
    const updated = words.filter((_, i) => i !== index);
    setWords(updated);
  };

  const handleSaveGroqApiKey = (key: string) => {
    setGroqApiKey(key);
    if (typeof window !== "undefined") {
      if (key.trim()) {
        localStorage.setItem("captions_groq_api_key", key.trim());
      } else {
        localStorage.removeItem("captions_groq_api_key");
      }
    }
    setGroqValidationStatus(null);
  };

  const handleTestGroqApiKey = async () => {
    if (!groqApiKey.trim()) return;
    setIsGroqKeyTesting(true);
    setGroqValidationStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-groq-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          groqApiKey: groqApiKey.trim(),
          key: groqApiKey.trim() 
        })
      });
      const data = await response.json();
      if (data.valid) {
        setGroqValidationStatus({ checked: true, valid: true, message: data.message || "Groq API key verified and active!" });
        handleSaveGroqApiKey(groqApiKey.trim());
      } else {
        setGroqValidationStatus({ checked: true, valid: false, message: data.message || "Invalid Groq API key." });
      }
    } catch {
      setGroqValidationStatus({ checked: true, valid: false, message: "Could not reach backend to verify Groq key." });
    } finally {
      setIsGroqKeyTesting(false);
    }
  };

  const handleSaveApiKey = (key: string) => {
    setGeminiApiKey(key);
    if (typeof window !== "undefined") {
      if (key.trim()) {
        localStorage.setItem("captions_gemini_api_key", key.trim());
      } else {
        localStorage.removeItem("captions_gemini_api_key");
      }
    }
    setKeyValidationStatus(null);
  };

  const handleTestApiKey = async () => {
    if (!geminiApiKey.trim()) return;
    setIsKeyTesting(true);
    setKeyValidationStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          geminiApiKey: geminiApiKey.trim(),
          key: geminiApiKey.trim() 
        })
      });
      const data = await response.json();
      if (data.valid) {
        setKeyValidationStatus({ checked: true, valid: true, message: data.message || "Gemini API key verified successfully!" });
        handleSaveApiKey(geminiApiKey.trim());
      } else {
        setKeyValidationStatus({ checked: true, valid: false, message: data.message || "Invalid Gemini API key." });
      }
    } catch {
      setKeyValidationStatus({ checked: true, valid: false, message: "Could not reach backend to verify key." });
    } finally {
      setIsKeyTesting(false);
    }
  };

  const handleTranslate = async (overrideLang?: string) => {
    const lang = overrideLang || targetLanguage;
    const isGroq = Boolean(groqApiKey.trim());
    const isGemini = Boolean(geminiApiKey.trim());

    if (!isGroq && !isGemini) {
      setIsKeyModalOpen(true);
      return;
    }
    if (words.length === 0) return;

    if (!originalWords) {
      setOriginalWords([...words]);
    }

    setTargetLanguage(lang);
    setTranslatingLang(lang);
    setIsTranslating(true);
    setErrorMsg(null);
    try {
      const payload: Record<string, any> = {
        words: originalWords || words,
        targetLanguage: lang,
        target_language: lang,
      };

      if (isGroq) {
        payload.groqApiKey = groqApiKey.trim();
        payload.groq_api_key = groqApiKey.trim();
        payload.provider = "groq";
      } else {
        payload.geminiApiKey = geminiApiKey.trim();
        payload.gemini_api_key = geminiApiKey.trim();
        payload.provider = "gemini";
      }

      const response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.detail || `Translation failed (${response.status})`);
      }

      const data = await response.json();
      setWords(data.words);
      const chosenLang = (data.targetLanguage || data.target_language || data.language || lang);
      setCurrentLanguage(chosenLang);
      setTargetLanguage(chosenLang);
      const langNames: Record<string, string> = {
        hinglish: "Hinglish (Roman Hindi)",
        hindi: "Hindi (हिंदी Devanagari)",
        english: "English"
      };
      const displayLangName = langNames[chosenLang.toLowerCase()] || (chosenLang.charAt(0).toUpperCase() + chosenLang.slice(1));
      const providerLabel = data.provider === "groq" ? "⚡ Groq Cloud" : "Gemini AI";
      setTranslationBanner(`Subtitles translated to ${displayLangName} via ${providerLabel}! Audio timestamps remain in sync.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isGemini ? "Failed to translate subtitles with Gemini AI." : "Failed to translate subtitles with Groq Cloud."));
    } finally {
      setIsTranslating(false);
      setTranslatingLang(null);
    }
  };

  const handleRevertToOriginal = () => {
    if (originalWords) {
      setWords([...originalWords]);
      setCurrentLanguage("original");
      setTranslationBanner("Restored original transcription.");
    }
  };

  const formatExportProgress = (p: number) => {
    if (p >= 100) return "100%";
    return `${Number(p).toFixed(2)}%`;
  };

  const handleExport = async () => {
    if (!jobId) return;
    setIsExporting(true);
    setExportSuccess(false);
    setErrorMsg(null);
    setExportProgress(5);
    setExportStage("Compiling ASS subtitle styling and layout...");

    let currentExpP = 5.00;
    const exportStartTime = Date.now();
    const expTimer = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - exportStartTime) / 1000);
      
      // Dynamic asymptotic progression with 4-digit precision (e.g. 44.45%) that NEVER freezes
      if (currentExpP < 50) {
        currentExpP += 3.65;
      } else if (currentExpP < 75) {
        currentExpP += 2.15;
      } else if (currentExpP < 90) {
        currentExpP += 1.05;
      } else if (currentExpP < 96) {
        currentExpP += 0.45;
      } else if (currentExpP < 98) {
        currentExpP += 0.22;
      } else if (currentExpP < 99.65) {
        const remaining = 99.85 - currentExpP;
        currentExpP += Math.max(0.035, remaining * 0.045);
      }
      
      const cappedExpP = Math.min(99.65, Number(currentExpP.toFixed(2)));
      setExportProgress(cappedExpP);

      if (cappedExpP < 25) {
        setExportStage("Generating ASS subtitle tracks and styling...");
      } else if (cappedExpP < 60) {
        setExportStage("FFmpeg is burning stylized captions into video frames...");
      } else if (cappedExpP < 85) {
        setExportStage("Encoding standard H.264 video packets on container...");
      } else if (cappedExpP < 95) {
        setExportStage("Finalizing MP4 container and optimizing download stream...");
      } else {
        // Rotating stages past 95% with live elapsed timer
        const cycle = elapsedSec % 16;
        if (cycle < 4) {
          setExportStage(`Encoding video frames in cloud container (${elapsedSec}s)...`);
        } else if (cycle < 8) {
          setExportStage(`Muxing audio & subtitle tracks into MP4 (${elapsedSec}s)...`);
        } else if (cycle < 12) {
          setExportStage(`Applying FastStart streaming optimization (${elapsedSec}s)...`);
        } else {
          setExportStage(`Almost finished! Packaging video download (${elapsedSec}s)...`);
        }
      }
    }, 380);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: jobId,
          words,
          style: customStyle,
          maxWords,
          quality: exportQuality
        }),
      });

      clearInterval(expTimer);
      
      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.detail || `Failed to compile video (HTTP ${response.status}).`);
      }
      
      setExportProgress(100);
      setExportStage("Render Complete!");
      await new Promise(r => setTimeout(r, 350));
      
      const data = await response.json();
      setExportUrl(`${API_BASE_URL}${data.download_url}`);
      setExportSuccess(true);
    } catch (err: any) {
      clearInterval(expTimer);
      setExportProgress(0);
      console.error(err);
      setErrorMsg(err.message || "An error occurred while compiling subtitles into the video.");
    } finally {
      clearInterval(expTimer);
      setIsExporting(false);
    }
  };

  const handleDownloadSrt = () => {
    if (!words || words.length === 0) return;
    const formatSrtTime = (seconds: number): string => {
      const pad = (n: number, z: number = 2) => ("00" + n).slice(-z);
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
    };

    const chunks = chunkWords(words, maxWords);
    const srtContent = chunks.map((chunk, idx) => {
      const start = formatSrtTime(chunk[0].start);
      const end = formatSrtTime(chunk[chunk.length - 1].end);
      const text = chunk.map((w: any) => w.word).join(" ");
      return `${idx + 1}\n${start} --> ${end}\n${text}\n`;
    }).join("\n");

    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subtitles_${jobId || "captions"}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const chunkedWords = useMemo(() => chunkWords(words, maxWords), [words, maxWords]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const getSubtitlePlacement = (alignment: string | number) => {
    const alignStr = String(alignment).toLowerCase().trim();
    
    if (alignStr === "upper_top" || alignStr === "8" || alignStr === "top_upper" || alignStr === "very_top") {
      return { top: `${(80 / 1920) * 100}%`, left: "50%", transform: "translateX(-50%)" };
    } else if (alignStr === "middle_top" || alignStr === "82" || alignStr === "top_middle") {
      return { top: `${(190 / 1920) * 100}%`, left: "50%", transform: "translateX(-50%)" };
    } else if (alignStr === "lower_top" || alignStr === "81" || alignStr === "below_notch" || alignStr === "7") {
      return { top: `${(300 / 1920) * 100}%`, left: "50%", transform: "translateX(-50%)" };
    } else if (alignStr === "upper_middle" || alignStr === "51" || alignStr === "middle_upper" || alignStr === "above_center") {
      return { top: `${(720 / 1920) * 100}%`, left: "50%", transform: "translateX(-50%)" };
    } else if (alignStr === "middle_middle" || alignStr === "5" || alignStr === "center" || alignStr === "middle") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    } else if (alignStr === "lower_middle" || alignStr === "52" || alignStr === "below_center" || alignStr === "4") {
      return { top: `${(1150 / 1920) * 100}%`, left: "50%", transform: "translateX(-50%)" };
    } else if (alignStr === "upper_bottom" || alignStr === "top_lower" || alignStr === "bottom_upper" || alignStr === "21" || alignStr === "1") {
      return { bottom: `${(340 / 1920) * 100}%`, left: "50%", transform: "translateX(-50%)" };
    } else if (alignStr === "middle_lower" || alignStr === "middle_bottom" || alignStr === "22") {
      return { bottom: `${(215 / 1920) * 100}%`, left: "50%", transform: "translateX(-50%)" };
    } else {
      return { bottom: `${(90 / 1920) * 100}%`, left: "50%", transform: "translateX(-50%)" };
    }
  };

  const getActiveSubtitleElement = (scale: number = 600 / 1920) => {
    const activeChunk = chunkedWords.find((chunk: Word[]) => {
      const start = chunk[0].start;
      const end = chunk[chunk.length - 1].end;
      return currentTime >= start && currentTime <= end;
    });

    if (!activeChunk) return null;

    const start = activeChunk[0].start;
    const end = activeChunk[activeChunk.length - 1].end;
    const placement = getSubtitlePlacement(customStyle.alignment);

    const scaledFontSize = Math.max(8, customStyle.fontSize * scale);
    const scaledOutline = customStyle.outlineWidth > 0 
      ? Math.max(0.6, customStyle.outlineWidth * scale * 1.1) 
      : 0;
    const scaledShadow = customStyle.shadowWidth > 0 
      ? Math.max(0.6, customStyle.shadowWidth * scale) 
      : 0;

    const textShadowStyle = scaledShadow > 0 
      ? `${scaledShadow.toFixed(1)}px ${scaledShadow.toFixed(1)}px 0px ${customStyle.shadowColor}` 
      : 'none';
      
    const textOutlineStyle = scaledOutline > 0
      ? [
          `-${scaledOutline.toFixed(1)}px -${scaledOutline.toFixed(1)}px 0 ${customStyle.outlineColor}`,
          `${scaledOutline.toFixed(1)}px -${scaledOutline.toFixed(1)}px 0 ${customStyle.outlineColor}`,
          `-${scaledOutline.toFixed(1)}px ${scaledOutline.toFixed(1)}px 0 ${customStyle.outlineColor}`,
          `${scaledOutline.toFixed(1)}px ${scaledOutline.toFixed(1)}px 0 ${customStyle.outlineColor}`,
          `0px -${scaledOutline.toFixed(1)}px 0 ${customStyle.outlineColor}`,
          `0px ${scaledOutline.toFixed(1)}px 0 ${customStyle.outlineColor}`,
          `-${scaledOutline.toFixed(1)}px 0px 0 ${customStyle.outlineColor}`,
          `${scaledOutline.toFixed(1)}px 0px 0 ${customStyle.outlineColor}`,
        ].join(', ')
      : 'none';

    const overlayStyle: React.CSSProperties = {
      fontFamily: customStyle.fontName,
      fontSize: `${scaledFontSize.toFixed(1)}px`,
      fontWeight: customStyle.bold ? "800" : "500",
      fontStyle: customStyle.italic ? "italic" : "normal",
      textShadow: textShadowStyle,
      WebkitTextStroke: scaledOutline > 0 ? `${(scaledOutline * 1.5).toFixed(1)}px ${customStyle.outlineColor}` : undefined,
      filter: scaledOutline > 0 ? `drop-shadow(0 0 1px ${customStyle.outlineColor})` : undefined,
      lineHeight: 1.15,
      textAlign: "center",
      wordBreak: "break-word",
      wordSpacing: `${((customStyle.wordSpacing || 0) * scale * 2.5).toFixed(1)}px`,
      maxWidth: "92%",
      pointerEvents: "none",
      userSelect: "none",
    };

    const containerStyle: React.CSSProperties = {
      position: "absolute",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 20,
      ...placement
    };

    if (customStyle.styleType === "classic") {
      const fullText = activeChunk.map((w: Word) => w.word).join(" ");
      return (
        <div style={containerStyle}>
          <span style={{ ...overlayStyle, color: customStyle.primaryColor }}>
            {fullText}
          </span>
        </div>
      );
    }

    if (customStyle.styleType === "highlight" || customStyle.styleType === "karaoke") {
      return (
        <div style={containerStyle}>
          <div 
            className="flex flex-wrap justify-center items-center" 
            style={{ 
              ...overlayStyle,
              columnGap: `${Math.max(4 + (customStyle.wordSpacing || 0), scale * (22 + (customStyle.wordSpacing || 0) * 3.5)).toFixed(1)}px`,
              rowGap: `${Math.max(2, scale * 10).toFixed(1)}px`
            }}
          >
            {activeChunk.map((w: Word, i: number) => {
              const isActive = currentTime >= w.start && (i === activeChunk.length - 1 ? currentTime <= end : currentTime < activeChunk[i+1].start);
              return (
                <span 
                  key={i} 
                  className="transition-transform duration-100 ease-out"
                  style={{ 
                    color: isActive ? customStyle.highlightColor : customStyle.primaryColor,
                    transform: isActive ? "scale(1.15)" : "scale(1.0)",
                    display: "inline-block"
                  }}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        </div>
      );
    }

    if (customStyle.styleType === "pop") {
      const activeWord = activeChunk.find((w: Word) => currentTime >= w.start && currentTime <= w.end);
      if (!activeWord) return null;
      
      return (
        <div style={containerStyle}>
          <span 
            style={{
              ...overlayStyle,
              transform: "scale(1.2)",
              display: "inline-block"
            }}
            className="animate-pulse"
          >
            {activeWord.word}
          </span>
        </div>
      );
    }

    return null;
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const filteredWords = useMemo(() => {
    if (!wordSearchQuery.trim()) return words;
    const q = wordSearchQuery.toLowerCase();
    return words.filter((w) => w.word.toLowerCase().includes(q));
  }, [words, wordSearchQuery]);

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-[#fafafa] dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200 relative flex flex-col justify-between">
      
      {/* Fluid Organic Wave Ribbons Background (matches reference mockup exactly) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <svg
          className="absolute -left-20 top-12 w-[650px] lg:w-[850px] h-[700px] opacity-40 dark:opacity-15 transition-opacity"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100 700 C 150 650, 200 400, 100 200 C 0 50, 350 50, 500 180 C 650 300, 750 550, 450 700 Z"
            fill="url(#waveGradLeft)"
          />
          <defs>
            <linearGradient id="waveGradLeft" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#cbd5e1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <svg
          className="absolute -right-24 top-24 w-[600px] lg:w-[800px] h-[750px] opacity-45 dark:opacity-15 transition-opacity"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M900 100 C 650 150, 550 350, 680 550 C 780 700, 500 750, 350 600 C 250 480, 200 200, 550 50 Z"
            fill="url(#waveGradRight)"
          />
          <defs>
            <linearGradient id="waveGradRight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Decorative Left Side Typography Accent */}
      <div className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 flex-col items-start gap-2 z-10 select-none pointer-events-none">
        <div className="text-[10px] font-black tracking-[0.22em] text-slate-800 dark:text-slate-300 uppercase leading-[1.6]">
          TURN<br />
          VIDEOS INTO<br />
          GLOBAL STORIES
        </div>
        <div className="w-7 h-[2px] bg-slate-900 dark:bg-slate-300" />
      </div>

      {/* Decorative Right Side Script Accent */}
      <div className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col items-end gap-1.5 z-10 select-none pointer-events-none">
        <div className="font-serif italic text-xl lg:text-2xl text-slate-800/90 dark:text-slate-200/90 leading-tight text-right">
          Captions<br />
          Without<br />
          Limits
        </div>
        <div className="w-8 h-[2px] bg-slate-900 dark:bg-slate-300 mr-0.5 mt-1" />
      </div>

      {/* TOP HEADER (Matches reference mockup exactly) */}
      <header className="relative z-30 w-full border-b border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-[#090a0f]/80 backdrop-blur-md shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 lg:h-16 flex items-center justify-between">
          
          {/* Logo Brand Squircle & Text */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-sm lg:text-base font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight">
                Captions AI Studio
              </h1>
              <p className="text-[8px] lg:text-[9px] text-slate-500 dark:text-slate-400 font-bold tracking-[0.18em] uppercase">
                AI Video Captioning & Translation
              </p>
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Nav: Home */}
            <div className="relative pt-0.5 cursor-pointer" onClick={() => jobId && handleResetWorkspace()}>
              <span className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">
                Home
              </span>
              <div className="h-[2px] w-4 bg-slate-950 dark:bg-white mx-auto mt-0.5 rounded-full" />
            </div>

            {/* Nav: Upload New Video Button (Prompt confirmation before discarding current video) */}
            {(jobId || file) && (
              <button
                type="button"
                onClick={handleResetWorkspace}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Discard current video and upload a new one"
              >
                <Upload className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Upload New</span>
              </button>
            )}

            {/* Nav: History */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              History
            </button>

            {/* Active AI Engine Badge */}
            {activeProvider === "groq" ? (
              <button
                onClick={() => {
                  setActiveKeyTab("groq");
                  setIsKeyModalOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-xs"
                title="Active Engine: Groq Cloud (Ultra-Fast 1-3s Whisper & LLM)"
              >
                <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                <span>Groq Cloud (Active)</span>
              </button>
            ) : activeProvider === "gemini" ? (
              <button
                onClick={() => {
                  setActiveKeyTab("gemini");
                  setIsKeyModalOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer shadow-xs"
                title="Active Engine: Google Gemini"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Gemini Active</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setActiveKeyTab("groq");
                  setIsKeyModalOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs"
                title="Add Groq API key for ultra-fast transcription & translation"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Set Groq API (Instant)</span>
              </button>
            )}

            {/* Settings Gear (Groq / Gemini key config) */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="p-1.5 sm:p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="AI Engine & API Keys (Groq / Gemini)"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* User Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer select-none">
              N
            </div>
          </div>

        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-20 flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-2 lg:py-3 flex flex-col justify-center lg:justify-evenly lg:overflow-hidden">
        
        {/* Floating Error Notice Toast (Zero Layout Shift) */}
        {errorMsg && (
          <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto px-4 py-2.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/95 dark:bg-red-950/95 backdrop-blur-md text-red-900 dark:text-red-200 flex items-start gap-2.5 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold">{errorMsg}</p>
            </div>
            <button 
              onClick={() => setErrorMsg(null)}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300 text-xs p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Floating Translation Banner Toast (Zero Layout Shift) */}
        {translationBanner && (
          <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto px-4 py-2 rounded-full border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white flex items-center justify-between gap-3 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              <p className="text-xs font-semibold select-none">{translationBanner}</p>
            </div>
            <button 
              onClick={() => setTranslationBanner(null)}
              className="text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* STEP 1: UPLOAD SCREEN (Matching Mockup) */}
        {!jobId && !loading && (
          <div className="flex flex-col items-center text-center w-full my-auto">
            
            {/* HERO PROMOTIONAL SECTION: Shown only when NO video is selected */}
            {!file && (
              <div className="flex flex-col items-center text-center w-full shrink-0 animate-in fade-in duration-200">
                {/* Top Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs mb-2 lg:mb-2.5 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" />
                  <span className="text-[11px] lg:text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Powered by Gemini AI
                  </span>
                </div>

                {/* Main Headline */}
                <h2 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[40px] font-black tracking-tight text-slate-950 dark:text-white leading-[1.14] shrink-0">
                  Create Styled Captions &<br />
                  <span className="bg-gradient-to-r from-slate-900 via-slate-600 to-slate-400 dark:from-white dark:via-slate-300 dark:to-slate-500 bg-clip-text text-transparent">
                    Translate Instantly
                  </span>
                </h2>

                {/* Subtitle */}
                <p className="text-[11px] sm:text-xs lg:text-[13px] text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-1 lg:mt-1.5 leading-relaxed font-normal shrink-0">
                  Upload your video, generate timestamped transcription, translate into Hinglish / Hindi / English with Gemini AI, and burn animated subtitles.
                </p>

                {/* 4 Feature Badges Row (as in mockup) */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 lg:gap-3 mt-2.5 lg:mt-3.5 w-full max-w-4xl shrink-0">
                  {/* Feature 1 */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-shadow">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                      <Zap className="w-3 h-3 fill-current" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white">AI Powered</div>
                      <div className="text-[9px] text-slate-400 font-medium">Gemini AI</div>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-shadow">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                      <Globe className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white">Multi-Language</div>
                      <div className="text-[9px] text-slate-400 font-medium">Hinglish / Hindi / English</div>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-shadow">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                      <Wand2 className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white">Styled Subtitles</div>
                      <div className="text-[9px] text-slate-400 font-medium">Clean & Animated</div>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-shadow">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                      <Clock className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white">Timestamped</div>
                      <div className="text-[9px] text-slate-400 font-medium">Accurate & Fast</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Centerpiece Upload / Preview Card */}
            <div className="w-full max-w-lg lg:max-w-xl shrink-0 my-auto">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative ${
                  file
                    ? "border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-xl backdrop-blur-md"
                    : "border-2 border-dashed border-slate-300/90 dark:border-white/15 bg-white/60 dark:bg-slate-900/40 p-4 sm:p-5 hover:border-slate-400 dark:hover:border-white/30 shadow-xs backdrop-blur-sm"
                } rounded-2xl lg:rounded-3xl flex flex-col items-center justify-center text-center transition-all`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="video-upload"
                  className="hidden"
                  accept="video/mp4,video/mov,video/avi,video/mkv"
                  onChange={handleFileInput}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = "";
                  }}
                />

                {file ? (
                  /* Selected File Mode with Centered Video */
                  <div className="w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                    {/* File Meta Pill */}
                    <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 mb-3 w-full">
                      <div className="w-9 h-9 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                            {file.name.split(".").pop() || "VIDEO"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Video Player Preview - Perfectly Centered with Natural Aspect Ratio */}
                    {localFilePreviewUrl && (
                      <div className="w-full flex items-center justify-center my-2">
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black shadow-lg flex items-center justify-center max-h-[250px] sm:max-h-[280px] max-w-full">
                          <video
                            src={localFilePreviewUrl}
                            controls
                            playsInline
                            className="max-h-[250px] sm:max-h-[280px] max-w-full w-auto h-auto object-contain block mx-auto"
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2.5 w-full mt-2">
                      <button
                        type="button"
                        onClick={uploadAndTranscribe}
                        className="w-full py-3 px-5 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-[0.99] cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 stroke-[2.2]" />
                        Generate Subtitles
                      </button>

                      <div className="flex items-center gap-2.5 w-full">
                        <button
                          type="button"
                          onClick={handleChangeVideo}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Change Video
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 text-rose-600 dark:text-red-400 border border-rose-200 dark:border-red-900/60 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove Video
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty Mockup Mode */
                  <div className="py-1">
                    {/* Central Black Squircle with Upload Icon */}
                    <div 
                      className="w-12 h-12 lg:w-13 lg:h-13 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center mb-2 mx-auto shadow-md shadow-black/15 dark:shadow-white/10 cursor-pointer hover:scale-105 transition-transform" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-5 h-5 lg:w-6 lg:h-6 stroke-[2.2]" />
                    </div>
                    
                    <label 
                      htmlFor="video-upload"
                      className="cursor-pointer text-xs sm:text-sm font-bold text-slate-950 dark:text-white hover:underline block"
                    >
                      Click to upload <span className="font-normal text-slate-500 dark:text-slate-400">or drag and drop</span>
                    </label>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                      MP4, MOV, AVI, or MKV • Max 3 Mins • Max 100MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Stepper Pill (Matches reference mockup exactly) */}
            <div className="mt-2.5 lg:mt-3.5 shrink-0">
              <div className="inline-flex items-center gap-2.5 sm:gap-3 px-5 sm:px-6 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <span className={`font-bold ${file ? "text-emerald-600 dark:text-emerald-400" : "text-slate-950 dark:text-white"}`}>
                  Upload {file ? "✓" : ""}
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>Transcribe</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>Translate</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>Stylize</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>Export</span>
              </div>
            </div>

          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="max-w-md mx-auto my-auto text-center p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-xl backdrop-blur-xl shrink-0">
            <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
              <div 
                className="absolute inset-0 rounded-full border-4 border-slate-950 dark:border-white border-t-transparent animate-spin" 
                style={{ animationDuration: "1.4s" }}
              />
              <span className="text-sm sm:text-base font-black text-slate-950 dark:text-white tabular-nums tracking-tight">
                {transcribeProgress >= 100 ? "100%" : `${transcribeProgress.toFixed(2)}%`}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Live Processing</span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              {loadingText || "Transcribing Audio..."}
            </h3>
            
            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2.5 border border-slate-200 dark:border-slate-800 overflow-hidden my-2.5 relative">
              <div 
                className="h-full bg-gradient-to-r from-slate-950 via-indigo-600 to-slate-950 dark:from-white dark:via-blue-400 dark:to-white rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(5, transcribeProgress)}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent animate-pulse pointer-events-none" />
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 min-h-[24px] flex items-center justify-center font-medium transition-opacity duration-300">
              {transcribeStage || "Whisper is loading and parsing audio timings..."}
            </p>
          </div>
        )}

        {/* STEP 2: WORKSPACE (Live Player & Tabbed Controls) */}
        {jobId && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center w-full lg:h-[calc(100vh-130px)] my-auto">
            
            {/* Left: Player Card */}
            <div className="lg:col-span-5 flex flex-col gap-2.5 justify-center lg:h-full">
              <div 
                ref={playerContainerRef}
                className="relative aspect-[9/16] max-h-[360px] sm:max-h-[420px] lg:max-h-[calc(100vh-210px)] w-auto max-w-full mx-auto rounded-2xl lg:rounded-3xl overflow-hidden bg-black border border-slate-200 dark:border-white/10 shadow-2xl flex items-center justify-center"
              >
                {videoPreviewUrl && (
                  <video
                    ref={videoRef}
                    src={videoPreviewUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      if (v.videoWidth && v.videoHeight) {
                        setVideoDimensions({ width: v.videoWidth, height: v.videoHeight });
                      }
                    }}
                    onClick={togglePlayback}
                    className="w-full h-full object-contain cursor-pointer"
                    playsInline
                  />
                )}
                
                {/* Active Subtitle Overlay */}
                {(() => {
                  const box = getVideoRenderBox();
                  return (
                    <div
                      className="absolute pointer-events-none overflow-hidden"
                      style={{
                        top: `${box.top}px`,
                        left: `${box.left}px`,
                        width: `${box.width}px`,
                        height: `${box.height}px`,
                      }}
                    >
                      {getActiveSubtitleElement(box.scale)}
                    </div>
                  );
                })()}

                {!isPlaying && (
                  <div 
                    onClick={togglePlayback}
                    className="absolute w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-950 dark:text-white flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform shadow-lg"
                  >
                    <Play className="w-5 h-5 lg:w-6 lg:h-6 fill-current ml-0.5" />
                  </div>
                )}

                {/* Cancel / Discard Video Cross Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetWorkspace();
                  }}
                  className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95 group/close"
                  title="Discard current video and upload new"
                >
                  <X className="w-4 h-4 transition-transform group-hover/close:rotate-90 duration-200" />
                </button>
              </div>

              {/* Player Progress Scrubber */}
              <div className="flex items-center gap-2.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-xs shrink-0 max-w-xs mx-auto w-full">
                <button 
                  onClick={togglePlayback}
                  className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white hover:text-slate-950 dark:hover:text-white active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>
                <div 
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative cursor-pointer" 
                  onClick={(e) => {
                    if (videoRef.current) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const width = rect.width;
                      const percent = Math.max(0, Math.min(1, clickX / width));
                      videoRef.current.currentTime = percent * videoRef.current.duration;
                    }
                  }}
                >
                  <div 
                    className="h-full bg-slate-950 dark:bg-white absolute left-0 top-0 rounded-full"
                    style={{ width: `${videoRef.current ? (currentTime / videoRef.current.duration) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 shrink-0">
                  {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || 0)}
                </span>
              </div>
            </div>

            {/* Right: Tabbed Controls Card */}
            <div className="lg:col-span-7 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl backdrop-blur-md flex flex-col lg:h-[calc(100vh-140px)] max-h-[calc(100vh-140px)]">
              
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/60 p-1.5 gap-1 shrink-0">
                <button
                  onClick={() => setActiveTab("style")}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "style" 
                      ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Styles</span>
                </button>

                <button
                  onClick={() => setActiveTab("transcript")}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "transcript" 
                      ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Transcript</span>
                  {currentLanguage !== "original" && (
                    <span className="w-2 h-2 rounded-full bg-slate-950 dark:bg-white animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("export")}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "export" 
                      ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>

              {/* Tab Contents with Internal Custom Scrollbar */}
              <div className="p-4 lg:p-5 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* TAB 1: STYLES */}
                {activeTab === "style" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Caption Presets
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.keys(TEMPLATES).map(key => (
                          <button
                            key={key}
                            onClick={() => handleTemplateChange(key)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              selectedTemplate === key
                                ? "border-slate-950 dark:border-white bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs"
                                : "border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                            }`}
                          >
                            <span className="font-bold text-xs block">{TEMPLATES[key].name}</span>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                              <span className="capitalize">{TEMPLATES[key].styleType}</span>
                              <span 
                                className="w-2 h-2 rounded-full border border-black/10" 
                                style={{ backgroundColor: TEMPLATES[key].highlightColor }} 
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <hr className="border-slate-200 dark:border-neutral-800" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">Font Family</label>
                        <select
                          value={customStyle.fontName}
                          onChange={(e) => setCustomStyle({ ...customStyle, fontName: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-neutral-100"
                        >
                          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">Font Size</label>
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{customStyle.fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="24"
                          max="120"
                          value={customStyle.fontSize}
                          onChange={(e) => setCustomStyle({ ...customStyle, fontSize: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">Words per Chunk</label>
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{maxWords} words</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="6"
                          value={maxWords}
                          onChange={(e) => setMaxWords(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">Outline Width</label>
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{customStyle.outlineWidth.toFixed(1)}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={customStyle.outlineWidth}
                          onChange={(e) => setCustomStyle({ ...customStyle, outlineWidth: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">Word Spacing</label>
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{(customStyle.wordSpacing || 0)}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="25"
                          step="1"
                          value={customStyle.wordSpacing || 0}
                          onChange={(e) => setCustomStyle({ ...customStyle, wordSpacing: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <hr className="border-slate-200 dark:border-neutral-800" />

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Color & Alignment</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">Primary Text</label>
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-2 py-1">
                            <input
                              type="color"
                              value={customStyle.primaryColor}
                              onChange={(e) => setCustomStyle({ ...customStyle, primaryColor: e.target.value })}
                              className="w-5 h-5 border-0 rounded cursor-pointer bg-transparent"
                            />
                            <span className="text-[11px] font-mono font-semibold uppercase">{customStyle.primaryColor}</span>
                          </div>
                        </div>

                        {["highlight", "karaoke"].includes(customStyle.styleType) && (
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold block mb-1">Highlight Word</label>
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-2 py-1">
                              <input
                                type="color"
                                value={customStyle.highlightColor}
                                onChange={(e) => setCustomStyle({ ...customStyle, highlightColor: e.target.value })}
                                className="w-5 h-5 border-0 rounded cursor-pointer bg-transparent"
                              />
                              <span className="text-[11px] font-mono font-semibold uppercase">{customStyle.highlightColor}</span>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">Outline Border</label>
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-2 py-1">
                            <input
                              type="color"
                              value={customStyle.outlineColor}
                              onChange={(e) => setCustomStyle({ ...customStyle, outlineColor: e.target.value })}
                              className="w-5 h-5 border-0 rounded cursor-pointer bg-transparent"
                            />
                            <span className="text-[11px] font-mono font-semibold uppercase">{customStyle.outlineColor}</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">Position</label>
                          <select
                            value={customStyle.alignment}
                            onChange={(e) => setCustomStyle({ ...customStyle, alignment: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-2 py-1.5 text-xs font-semibold"
                          >
                            <option value="upper_top">🔼 Upper Top</option>
                            <option value="middle_top">🔹 Middle Top</option>
                            <option value="lower_top">🔽 Lower Top</option>
                            <option value="upper_middle">🔼 Upper Middle</option>
                            <option value="middle_middle">🔹 Center</option>
                            <option value="lower_middle">🔽 Lower Middle</option>
                            <option value="upper_bottom">🔼 Upper Bottom</option>
                            <option value="middle_lower">🔹 Middle Lower</option>
                            <option value="lower_bottom">🔽 Bottom (Default)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: TRANSCRIPT */}
                {activeTab === "transcript" && (
                  <div className="flex flex-col gap-3">
                    
                    {/* Gemini AI Translation Bar */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Languages className="w-4 h-4 text-slate-800 dark:text-white shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0">AI Translate:</span>
                        {activeProvider === "groq" ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 fill-current" /> Groq Cloud (Ultra-Fast)
                          </span>
                        ) : activeProvider === "gemini" ? (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Gemini AI
                          </span>
                        ) : null}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleTranslate("hinglish")}
                            disabled={isTranslating}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                              currentLanguage === "hinglish" 
                                ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white shadow-xs font-bold" 
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                            } ${isTranslating && translatingLang !== "hinglish" ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            {translatingLang === "hinglish" && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            {currentLanguage === "hinglish" && !translatingLang && (
                              <Check className="w-3 h-3" />
                            )}
                            Hinglish
                          </button>

                          <button
                            onClick={() => handleTranslate("hindi")}
                            disabled={isTranslating}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                              currentLanguage === "hindi" 
                                ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white shadow-xs font-bold" 
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                            } ${isTranslating && translatingLang !== "hindi" ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            {translatingLang === "hindi" && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            {currentLanguage === "hindi" && !translatingLang && (
                              <Check className="w-3 h-3" />
                            )}
                            Hindi
                          </button>

                          <button
                            onClick={() => handleTranslate("english")}
                            disabled={isTranslating}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                              currentLanguage === "english" 
                                ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white shadow-xs font-bold" 
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                            } ${isTranslating && translatingLang !== "english" ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            {translatingLang === "english" && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            {currentLanguage === "english" && !translatingLang && (
                              <Check className="w-3 h-3" />
                            )}
                            English
                          </button>

                          {/* Custom Language Option */}
                          {showCustomLangInput ? (
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/20 rounded-lg p-0.5 shadow-xs">
                              <input
                                type="text"
                                autoFocus
                                placeholder="Enter language (e.g. Spanish, Tamil)..."
                                value={customLanguage}
                                onChange={(e) => setCustomLanguage(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && customLanguage.trim()) {
                                    handleTranslate(customLanguage.trim());
                                    setShowCustomLangInput(false);
                                  } else if (e.key === "Escape") {
                                    setShowCustomLangInput(false);
                                  }
                                }}
                                className="px-2 py-0.5 text-xs bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none w-36 sm:w-44"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (customLanguage.trim()) {
                                    handleTranslate(customLanguage.trim());
                                    setShowCustomLangInput(false);
                                  }
                                }}
                                disabled={!customLanguage.trim() || isTranslating}
                                className="px-2 py-0.5 rounded-md bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                              >
                                Convert
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowCustomLangInput(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowCustomLangInput(true)}
                              disabled={isTranslating}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                                !["hinglish", "hindi", "english", "original"].includes(currentLanguage)
                                  ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white shadow-xs font-bold" 
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                              } ${isTranslating && !["hinglish", "hindi", "english"].includes(translatingLang || "") ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              {isTranslating && !["hinglish", "hindi", "english"].includes(translatingLang || "") ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Converting...</span>
                                </>
                              ) : !["hinglish", "hindi", "english", "original"].includes(currentLanguage) ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span className="capitalize">{currentLanguage}</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  <span>Custom</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {originalWords && currentLanguage !== "original" && (
                        <button
                          onClick={handleRevertToOriginal}
                          disabled={isTranslating}
                          className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore Original
                        </button>
                      )}
                    </div>

                    {/* Filter & Words List */}
                    <div className="relative shrink-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search transcript..."
                        value={wordSearchQuery}
                        onChange={(e) => setWordSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100"
                      />
                    </div>

                    <div className="max-h-[calc(100vh-320px)] lg:max-h-[calc(100vh-270px)] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                      {filteredWords.map((item, index) => {
                        const realIndex = words.indexOf(item);
                        return (
                          <div 
                            key={realIndex}
                            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 group"
                          >
                            <button
                              onClick={() => {
                                if (videoRef.current) {
                                  videoRef.current.currentTime = item.start;
                                  videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                                }
                              }}
                              className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md shrink-0"
                            >
                              {item.start.toFixed(2)}s
                            </button>
                            
                            <input
                              type="text"
                              value={item.word}
                              onChange={(e) => handleWordChange(realIndex, "word", e.target.value)}
                              className="flex-1 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg px-2 py-0.5 text-xs font-semibold"
                            />

                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="number"
                                step="0.05"
                                value={item.start}
                                onChange={(e) => handleWordChange(realIndex, "start", e.target.value)}
                                className="w-13 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg px-1 py-0.5 text-center text-[11px] font-mono"
                              />
                              <span className="text-slate-400 text-xs">-</span>
                              <input
                                type="number"
                                step="0.05"
                                value={item.end}
                                onChange={(e) => handleWordChange(realIndex, "end", e.target.value)}
                                className="w-13 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg px-1 py-0.5 text-center text-[11px] font-mono"
                              />
                            </div>

                            <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleAddWord(realIndex)}
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWord(realIndex)}
                                className="p-1 rounded hover:bg-rose-100 text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          const last = words[words.length - 1];
                          const start = last ? Number(last.end.toFixed(2)) : 0;
                          setWords([...words, { word: "NewWord", start, end: Number((start + 0.3).toFixed(2)) }]);
                        }}
                        className="w-full py-1.5 border border-dashed border-slate-300 dark:border-neutral-800 text-slate-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-neutral-900"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Subtitle Word
                      </button>
                    </div>

                  </div>
                )}

                {/* TAB 3: EXPORT */}
                {activeTab === "export" && (
                  <div className="flex flex-col items-center justify-center min-h-[260px] text-center p-3">
                    {!isExporting && !exportSuccess && (
                      <div className="max-w-md">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4 mx-auto text-slate-900 dark:text-white">
                          <Video className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Render Final Video</h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                          Burn stylized captions directly into MP4 frames with cloud acceleration.
                        </p>

                        {/* Cloud Quality Toggle (480p, 720p, 1080p) */}
                        <div className="mb-4 p-2.5 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 text-left">
                          <div className="flex items-center justify-between px-1 mb-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Export Resolution</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                              {exportQuality === "480p" ? "⚡ 480p Fast" : exportQuality === "720p" ? "✨ 720p Balanced HD" : "🎬 1080p Full Quality"}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setExportQuality("480p")}
                              className={`p-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                                exportQuality === "480p"
                                  ? "bg-white dark:bg-neutral-800 text-slate-950 dark:text-white shadow-xs border border-slate-300 dark:border-neutral-700"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              480p
                              <span className="block text-[9px] font-normal text-slate-400 mt-0.5">Ultra Fast</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setExportQuality("720p")}
                              className={`p-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                                exportQuality === "720p"
                                  ? "bg-white dark:bg-neutral-800 text-slate-950 dark:text-white shadow-xs border border-slate-300 dark:border-neutral-700"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              720p HD
                              <span className="block text-[9px] font-normal text-slate-400 mt-0.5">Recommended</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setExportQuality("1080p")}
                              className={`p-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                                exportQuality === "1080p"
                                  ? "bg-white dark:bg-neutral-800 text-slate-950 dark:text-white shadow-xs border border-slate-300 dark:border-neutral-700"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              1080p FHD
                              <span className="block text-[9px] font-normal text-slate-400 mt-0.5">Crisp Original</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={handleExport}
                            className="w-full py-3 px-6 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs sm:text-sm shadow-md hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 stroke-[2.2]" />
                            Burn Subtitles & Export Video
                          </button>

                          <button
                            type="button"
                            onClick={handleDownloadSrt}
                            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            Download .SRT Subtitles (Instant)
                          </button>
                        </div>
                      </div>
                    )}

                    {isExporting && (
                      <div className="max-w-sm mx-auto p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg text-center">
                        <div className="relative w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                          <div 
                            className="absolute inset-0 rounded-full border-4 border-slate-950 dark:border-white border-t-transparent animate-spin" 
                            style={{ animationDuration: "1.2s" }}
                          />
                          <span className="text-sm font-black text-slate-950 dark:text-white tabular-nums tracking-tight select-none">
                            {formatExportProgress(exportProgress)}
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Cloud Encoding</span>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Rendering Video ({formatExportProgress(exportProgress)})
                        </h3>

                        <div className="w-full bg-slate-100 dark:bg-neutral-950 rounded-full h-2.5 border border-slate-200 dark:border-neutral-800 overflow-hidden my-2.5 relative">
                          <div 
                            className="h-full bg-gradient-to-r from-slate-950 via-indigo-600 to-slate-950 dark:from-white dark:via-blue-400 dark:to-white rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(5, Math.min(100, exportProgress))}%` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent animate-pulse pointer-events-none" />
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 min-h-[24px] flex items-center justify-center font-medium transition-opacity duration-300">
                          {exportStage || "FFmpeg is burning stylized captions..."}
                        </p>
                      </div>
                    )}

                    {exportSuccess && exportUrl && (
                      <div className="max-w-sm">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 mx-auto">
                          <Check className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Video Rendered!</h3>
                        <p className="text-xs text-slate-500 mt-1 mb-5">
                          Captions have been burned in using template styles.
                        </p>
                        <div className="flex flex-col gap-2.5">
                          <a
                            href={exportUrl}
                            download="captions_output.mp4"
                            className="w-full py-3 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                          >
                            <Download className="w-4 h-4" /> Download Video (MP4)
                          </a>

                          <button
                            type="button"
                            onClick={handleDownloadSrt}
                            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-500" /> Download .SRT Subtitles
                          </button>
                          <button
                            onClick={() => setExportSuccess(false)}
                            className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Render with new styles
                          </button>

                          <button
                            type="button"
                            onClick={handleResetWorkspace}
                            className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Start with a new video
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            </div>
            
          </div>
        )}

      </main>

      {/* FOOTER BAR (Matches reference mockup bottom tags) */}
      <footer className="relative z-20 w-full border-t border-slate-200/50 dark:border-white/5 py-2 lg:py-2.5 px-6 text-[11px] lg:text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Built with Gemini AI</span>
        </div>
        <div className="font-medium">
          Make Your Content Global —
        </div>
      </footer>

      {/* SETTINGS / AI ENGINE MODAL (GROQ & GEMINI) */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div 
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold">AI Engine & API Keys</h3>
                  <p className="text-xs text-slate-400">Configure Groq Cloud (Ultra-Fast) or Gemini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Provider Tabs Switcher */}
            <div className="mt-4 grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-white/5">
              <button
                type="button"
                onClick={() => setActiveKeyTab("groq")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeKeyTab === "groq"
                    ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200 dark:border-white/10"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${activeKeyTab === "groq" ? "text-emerald-500 fill-emerald-500" : ""}`} />
                <span>Groq Cloud</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-semibold ml-0.5">
                  Fast ⚡
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveKeyTab("gemini")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeKeyTab === "gemini"
                    ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200 dark:border-white/10"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${activeKeyTab === "gemini" ? "text-indigo-500" : ""}`} />
                <span>Google Gemini</span>
              </button>
            </div>

            {/* TAB 1: GROQ CLOUD */}
            {activeKeyTab === "groq" && (
              <div className="mt-4 space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 fill-emerald-600 dark:fill-emerald-400" />
                  <div>
                    <span className="font-bold">Full Flow Shifts to Groq Cloud:</span>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                      Groq API enter karte hi <strong>poora flow Groq par shift ho jayega</strong> — transcription <strong>Whisper Large v3 Turbo (1-3 sec)</strong> par hogi aur translation <strong>ultra-fast Groq LLMs</strong> se instantly execute hogi.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Groq API Key
                    </label>
                    {groqApiKey.trim() && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        ✓ Flow Active
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showGroqApiKey ? "text" : "password"}
                      placeholder="gsk_..."
                      value={groqApiKey}
                      onChange={(e) => {
                        setGroqApiKey(e.target.value);
                        handleSaveGroqApiKey(e.target.value);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroqApiKey(!showGroqApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showGroqApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {groqValidationStatus && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                    groqValidationStatus.valid 
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40" 
                      : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/40"
                  }`}>
                    {groqValidationStatus.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{groqValidationStatus.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                  <span className="text-[11px]">Auto-saved in browser storage</span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline text-xs"
                  >
                    Get Free Groq API Key <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* TAB 2: GOOGLE GEMINI */}
            {activeKeyTab === "gemini" && (
              <div className="mt-4 space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Google Gemini Multimodal AI:</span>
                    <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
                      Gemini API key enables speech transcription & subtitle translation into <strong>Hinglish</strong>, <strong>Hindi</strong>, and <strong>English</strong>.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Gemini API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showGeminiApiKey ? "text" : "password"}
                      placeholder="AIzaSy..."
                      value={geminiApiKey}
                      onChange={(e) => {
                        setGeminiApiKey(e.target.value);
                        handleSaveApiKey(e.target.value);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiApiKey(!showGeminiApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showGeminiApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {keyValidationStatus && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                    keyValidationStatus.valid 
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40" 
                      : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/40"
                  }`}>
                    {keyValidationStatus.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{keyValidationStatus.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                  <span className="text-[11px]">Auto-saved in browser storage</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-900 dark:text-white font-bold flex items-center gap-1 hover:underline text-xs"
                  >
                    Get Free Gemini API Key <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div>
                {activeKeyTab === "groq" && groqApiKey.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveGroqApiKey("");
                      setGroqValidationStatus(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Clear Groq
                  </button>
                )}
                {activeKeyTab === "gemini" && geminiApiKey.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveApiKey("");
                      setKeyValidationStatus(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Clear Gemini
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {activeKeyTab === "groq" ? (
                  <button
                    type="button"
                    onClick={handleTestGroqApiKey}
                    disabled={isGroqKeyTesting || !groqApiKey.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isGroqKeyTesting ? (
                      <span className="w-3.5 h-3.5 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin inline-block mr-1.5" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 inline mr-1 text-emerald-500 fill-emerald-500" />
                    )}
                    Test Groq Key
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={isKeyTesting || !geminiApiKey.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isKeyTesting ? (
                      <span className="w-3.5 h-3.5 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin inline-block mr-1.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />
                    )}
                    Test Gemini Key
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold">Recent Projects</h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-8 text-center text-slate-400">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-xs font-semibold">No recent history yet</p>
              <p className="text-[11px] text-slate-400 mt-1">Videos you transcribe will appear here for quick access.</p>
            </div>

            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* FANCY RESET WORKSPACE / START OVER CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowResetConfirmModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative text-slate-900 dark:text-white animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Icon Badge & Title */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  Discard current video?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure to discard this video and upload a new one?
                </p>
              </div>
            </div>

            {/* Details Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 mb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your current video, subtitles, timing adjustments, translations, and style customizations will be permanently cleared.
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Tip: Download your <strong>.SRT</strong> or rendered video before discarding if you want to keep them.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer text-center"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={confirmResetWorkspace}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                Discard & Upload New
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

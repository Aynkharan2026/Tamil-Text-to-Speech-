
export const LOGO_URL = "https://share.google/8trC7tWAantyaE7zA";

export const TRANSLATIONS = {
  en: {
    title: "Thaiveedu Tamil TTS",
    subtitle: "Convert Tamil text to MP4 with high-quality voice",
    directText: "Direct Text Input",
    uploadDoc: "Upload Document",
    placeholder: "Enter Tamil text here...",
    convert: "Convert to MP4",
    converting: "Converting...",
    download: "Download MP4",
    settings: "Voice Settings",
    gender: "Voice Gender",
    male: "Male",
    female: "Female",
    tone: "Tone",
    soft: "Soft",
    medium: "Medium",
    hard: "Hard",
    speed: "Speed",
    slow: "Slow",
    normal: "Normal",
    fast: "Fast",
    pageLimit: "Max 25 pages",
    errorLimit: "Document exceeds 25 page limit.",
    errorGeneric: "Something went wrong. Please try again.",
    extracting: "Extracting text...",
    success: "Conversion successful!",
    preview: "Preview",
    logoAlt: "Thaiveedu Logo",
    dropzone: "Drag & drop PDF/Word or click to select",
    language: "தமிழ்",
  },
  ta: {
    title: "தாய்வீடு தமிழ் TTS",
    subtitle: "தமிழ் உரையை உயர்தர ஒலியுடன் MP4 ஆக மாற்றவும்",
    directText: "நேரடி உரை",
    uploadDoc: "கோப்பு பதிவேற்றம்",
    placeholder: "இங்கே தமிழ் உரையை உள்ளிடவும்...",
    convert: "MP4 ஆக மாற்று",
    converting: "மாற்றப்படுகிறது...",
    download: "MP4 பதிவிறக்கம்",
    settings: "ஒலி அமைப்புகள்",
    gender: "பாலினம்",
    male: "ஆண்",
    female: "பெண்",
    tone: "ஒலி வகை",
    soft: "மென்மையான",
    medium: "சாதாரண",
    hard: "கம்பீரமான/வலிய",
    speed: "வேகம்",
    slow: "மெதுவான",
    normal: "சாதாரண",
    fast: "வேகமான",
    pageLimit: "அதிகபட்சம் 25 பக்கங்கள்",
    errorLimit: "ஆவணம் 25 பக்க வரம்பை மீறுகிறது.",
    errorGeneric: "ஏதோ தவறு நடந்துவிட்டது. மீண்டும் முயற்சிக்கவும்.",
    extracting: "உரை பிரித்தெடுக்கப்படுகிறது...",
    success: "வெற்றிகரமாக மாற்றப்பட்டது!",
    preview: "முன்னோட்டம்",
    logoAlt: "தாய்வீடு லோகோ",
    dropzone: "PDF/Word கோப்பை இங்கே இழுக்கவும் அல்லது கிளிக் செய்யவும்",
    language: "English",
  },
};

export type Language = "en" | "ta";

export const VOICE_MAP = {
  male: {
    soft: "Fenrir",
    medium: "Charon",
    hard: "Puck", // Puck can be versatile
  },
  female: {
    soft: "Kore",
    medium: "Zephyr",
    hard: "Zephyr", // Zephyr is quite clear
  },
};

export const SPEED_MAP = {
  slow: 0.8,
  normal: 1.0,
  fast: 1.2,
};

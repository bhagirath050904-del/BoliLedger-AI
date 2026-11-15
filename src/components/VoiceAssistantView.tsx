import { useEffect, useRef, useState } from "react";
import {
  Check,
  Loader2,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  X,
} from "lucide-react";
import {
  SAMPLE_VOICE_COMMANDS,
  t,
  VOICE_LANGUAGE_OPTIONS,
} from "../i18n/translations";
import {
  AppLanguage,
  Customer,
  ParsedVoiceAction,
  PaymentMode,
  Product,
  VoiceIntent,
  VoiceLogItem,
  VoicePreferences,
} from "../types";
import { formatDateTime, formatINR } from "../utils/format";

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface VoiceAssistantViewProps {
  language: AppLanguage;
  voicePrefs: VoicePreferences;
  customers: Customer[];
  products: Product[];
  todaySales: number;
  pendingUdhaar: number;
  voiceLogs: VoiceLogItem[];
  initialPromptHint?: string | null;
  onClearHint?: () => void;
  onChangeVoiceLang: (langCode: string) => void;
  onCommitAction: (transcript: string, action: ParsedVoiceAction) => void;
}

const INTENT_LABELS: Record<
  VoiceIntent,
  { en: string; hi: string; tone: string }
> = {
  SALE: {
    en: "Cash / UPI Sale",
    hi: "नकद / UPI बिक्री",
    tone: "text-emerald-700",
  },
  UDHAAR_GIVEN: {
    en: "Customer Udhaar (Credit)",
    hi: "ग्राहक उधार",
    tone: "text-rose-700",
  },
  PAYMENT_RECEIVED: {
    en: "Payment Received (Jama)",
    hi: "उधार जमा / भुगतान",
    tone: "text-emerald-700",
  },
  ADD_INVENTORY: {
    en: "Add / Restock Inventory",
    hi: "स्टॉक / माल जोड़ें",
    tone: "text-amber-700",
  },
  EXPENSE: {
    en: "Shop Expense",
    hi: "दुकान का खर्च",
    tone: "text-slate-700",
  },
  QUERY: {
    en: "Business Question",
    hi: "हिसाब सवाल",
    tone: "text-slate-700",
  },
  UNKNOWN: {
    en: "Needs Clarification",
    hi: "स्पष्ट नहीं हुआ",
    tone: "text-amber-700",
  },
};

export function VoiceAssistantView({
  language,
  voicePrefs,
  customers,
  products,
  todaySales,
  pendingUdhaar,
  voiceLogs,
  initialPromptHint,
  onClearHint,
  onChangeVoiceLang,
  onCommitAction,
}: VoiceAssistantViewProps) {
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [parsedAction, setParsedAction] = useState<ParsedVoiceAction | null>(
    null
  );

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const latestTranscriptRef = useRef("");

  useEffect(() => {
    if (initialPromptHint) {
      setTranscript(initialPromptHint);
      onClearHint?.();
    }
  }, [initialPromptHint, onClearHint]);

  useEffect(() => {
    latestTranscriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const speakConfirmation = async (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, language }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          audioBase64?: string;
          mimeType?: string;
        };
        if (data.audioBase64) {
          const audio = new Audio(
            `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`
          );
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback to browser SpeechSynthesis
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.lang = language === "hi" ? "hi-IN" : "en-IN";
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    } else {
      setIsSpeaking(false);
    }
  };

  const analyzeTranscript = async (textToAnalyze: string) => {
    const clean = textToAnalyze.trim();
    if (!clean) {
      setErrorMsg(
        language === "hi"
          ? "कृपया पहले कुछ बोलें या लिखें।"
          : "Please speak or enter a command first."
      );
      return;
    }

    setErrorMsg(null);
    setSavedNotice(null);
    setIsParsing(true);

    try {
      const res = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: clean,
          uiLanguage: language,
          voiceLanguage: voicePrefs.voiceLanguage,
          todaySales,
          pendingUdhaar,
          customers: customers.map((c) => ({
            id: c.id,
            name: c.name,
            balance: c.balance,
          })),
          inventory: products.map((p) => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            sellingPrice: p.sellingPrice,
            stock: p.stock,
          })),
        }),
      });

      const data = (await res.json()) as {
        parsed?: ParsedVoiceAction;
        error?: string;
      };
      if (!res.ok || !data.parsed) {
        throw new Error(data.error || "Unable to understand voice command.");
      }

      setParsedAction(data.parsed);

      if (voicePrefs.autoSpeakConfirmation) {
        const spokenText =
          data.parsed.intent === "QUERY"
            ? language === "hi"
              ? data.parsed.queryAnswerHi || data.parsed.confirmationSummaryHi
              : data.parsed.queryAnswerEn || data.parsed.confirmationSummaryEn
            : language === "hi"
            ? data.parsed.confirmationSummaryHi
            : data.parsed.confirmationSummaryEn;
        void speakConfirmation(spokenText);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to analyze command. Please try again."
      );
    } finally {
      setIsParsing(false);
    }
  };

  const startGeminiAudioRecording = async () => {
    setErrorMsg(null);
    setSavedNotice(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecordingAudio(false);
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 400) return;

        setIsTranscribing(true);
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ""));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType,
              voiceLanguage: voicePrefs.voiceLanguage,
            }),
          });
          const data = (await res.json()) as {
            transcript?: string;
            error?: string;
          };
          if (!res.ok) throw new Error(data.error || "Transcription failed");
          const text = (data.transcript || "").trim();
          setTranscript(text);
          if (text) {
            await analyzeTranscript(text);
          }
        } catch (err: unknown) {
          setErrorMsg(
            err instanceof Error ? err.message : "Audio transcription failed."
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingAudio(true);
    } catch {
      setErrorMsg(
        language === "hi"
          ? "माइक्रोफ़ोन की अनुमति नहीं मिली। नीचे टाइप करें या सैंपल कमांड चुनें।"
          : "Microphone access was denied or unavailable. Type below or tap a sample command."
      );
    }
  };

  const toggleMicrophone = () => {
    if (isRecordingAudio && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      const currentText = latestTranscriptRef.current.trim();
      if (currentText) {
        void analyzeTranscript(currentText);
      }
      return;
    }

    setErrorMsg(null);
    setSavedNotice(null);
    setParsedAction(null);

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (voicePrefs.captureMode === "gemini-audio" || !SpeechRec) {
      void startGeminiAudioRecording();
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = voicePrefs.voiceLanguage || "hi-IN";
      recognition.continuous = true;
      recognition.interimResults = true;

      let accumulated = "";
      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            accumulated = `${accumulated} ${piece}`.trim();
          } else {
            interim += piece;
          }
        }
        const combined = `${accumulated}${interim ? ` ${interim}` : ""}`.trim();
        setTranscript(combined);
        setInterimText(interim);
        latestTranscriptRef.current = combined;
      };

      recognition.onerror = (ev) => {
        setIsListening(false);
        setInterimText("");
        if (ev.error === "not-allowed") {
          setErrorMsg(
            language === "hi"
              ? "माइक्रोफ़ोन की अनुमति दें या नीचे टाइप करें।"
              : "Microphone permission blocked. Allow mic access or type below."
          );
        } else if (ev.error !== "aborted") {
          void startGeminiAudioRecording();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText("");
      };

      recognitionRef.current = recognition;
      setTranscript("");
      setInterimText("");
      recognition.start();
      setIsListening(true);
    } catch {
      void startGeminiAudioRecording();
    }
  };

  const handleConfirmSave = () => {
    if (!parsedAction) return;
    onCommitAction(transcript, parsedAction);
    setSavedNotice(
      language === "hi"
        ? "हिसाब सफलतापूर्वक सेव हो गया!"
        : "Entry confirmed and saved to ledger!"
    );
    setParsedAction(null);
    setTranscript("");
  };

  const activeListening = isListening || isRecordingAudio;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {t(language, "voiceHeroTitle")}
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                {t(language, "voiceHeroDesc")}
              </p>
            </div>
            <div className="shrink-0">
              <label htmlFor="voice-lang-select" className="sr-only">
                Voice Language
              </label>
              <select
                id="voice-lang-select"
                value={voicePrefs.voiceLanguage}
                onChange={(e) => onChangeVoiceLang(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {VOICE_LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-6 border-y border-slate-100">
            <button
              type="button"
              onClick={toggleMicrophone}
              disabled={isTranscribing || isParsing}
              className={`relative flex h-28 w-28 items-center justify-center rounded-full transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 ${
                activeListening
                  ? "bg-rose-600 text-white shadow-lg ring-8 ring-rose-100"
                  : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-md ring-8 ring-emerald-50"
              } disabled:opacity-60`}
              aria-label={
                activeListening
                  ? t(language, "listeningNow")
                  : t(language, "tapToSpeak")
              }
            >
              {isTranscribing || isParsing ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : activeListening ? (
                <Square className="h-9 w-9 fill-current" />
              ) : (
                <Mic className="h-11 w-11" />
              )}
            </button>
            <p className="mt-4 text-sm font-medium text-slate-800">
              {isTranscribing
                ? t(language, "transcribingAudio")
                : isParsing
                ? t(language, "processingVoice")
                : isRecordingAudio
                ? t(language, "recordingAudio")
                : isListening
                ? t(language, "listeningNow")
                : t(language, "tapToSpeak")}
            </p>
            {interimText && (
              <p className="mt-1 text-xs text-slate-500 italic max-w-md text-center">
                {interimText}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="live-transcript-box"
                className="text-xs font-medium text-slate-600"
              >
                {t(language, "transcriptLabel")}
              </label>
              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    setTranscript("");
                    setParsedAction(null);
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{language === "hi" ? "साफ़ करें" : "Clear"}</span>
                </button>
              )}
            </div>
            <textarea
              id="live-transcript-box"
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={t(language, "transcriptPlaceholder")}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => void analyzeTranscript(transcript)}
                disabled={isParsing || isTranscribing || !transcript.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                <span>{t(language, "analyzeCommand")}</span>
              </button>
              {savedNotice && (
                <span className="text-sm font-medium text-emerald-700 inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  {savedNotice}
                </span>
              )}
            </div>
            {errorMsg && (
              <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}
          </div>

          <div className="pt-2 space-y-2.5">
            <p className="text-xs font-medium text-slate-500">
              {t(language, "sampleCommands")}
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_VOICE_COMMANDS.map((sample) => (
                <button
                  key={sample.labelEn}
                  type="button"
                  onClick={() => {
                    setTranscript(sample.command);
                    void analyzeTranscript(sample.command);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
                >
                  {language === "hi" ? sample.labelHi : sample.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                {t(language, "aiConfirmationTitle")}
              </h3>
              {parsedAction && (
                <button
                  type="button"
                  onClick={() =>
                    void speakConfirmation(
                      language === "hi"
                        ? parsedAction.confirmationSummaryHi
                        : parsedAction.confirmationSummaryEn
                    )
                  }
                  disabled={isSpeaking}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <Volume2 className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{t(language, "speakSummary")}</span>
                </button>
              )}
            </div>

            {!parsedAction ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  {language === "hi"
                    ? "पुष्टि कार्ड यहाँ दिखेगा"
                    : "Confirmation preview appears here"}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {language === "hi"
                    ? "कोई भी आदेश बोलें या उदाहरण चुनें। सेव करने से पहले आप नाम और राशि बदल सकते हैं।"
                    : "Speak any Hindi, Hinglish, or regional command. You can review and edit fields before saving."}
                </p>
              </div>
            ) : parsedAction.intent === "QUERY" ? (
              <div className="pt-4 space-y-4">
                <p className="text-xs font-medium text-slate-500">
                  {INTENT_LABELS.QUERY[language]}
                </p>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-sm font-medium text-slate-900">
                    {language === "hi"
                      ? parsedAction.queryAnswerHi ||
                        parsedAction.confirmationSummaryHi
                      : parsedAction.queryAnswerEn ||
                        parsedAction.confirmationSummaryEn}
                  </p>
                  <p className="text-xs text-slate-500">
                    {language === "hi"
                      ? parsedAction.queryAnswerEn
                      : parsedAction.queryAnswerHi}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setParsedAction(null)}
                  className="w-full py-2 px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {language === "hi" ? "ठीक है" : "Done"}
                </button>
              </div>
            ) : (
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span
                    className={`font-semibold ${
                      INTENT_LABELS[parsedAction.intent].tone
                    }`}
                  >
                    {INTENT_LABELS[parsedAction.intent][language]}
                  </span>
                  <span className="font-mono tabular-nums">
                    {t(language, "confidence")}:{" "}
                    {Math.round((parsedAction.confidence || 0.9) * 100)}%
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-sm text-slate-800">
                  {language === "hi"
                    ? parsedAction.confirmationSummaryHi
                    : parsedAction.confirmationSummaryEn}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {t(language, "intent")}
                    </label>
                    <select
                      value={parsedAction.intent}
                      onChange={(e) =>
                        setParsedAction({
                          ...parsedAction,
                          intent: e.target.value as VoiceIntent,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900"
                    >
                      <option value="SALE">{INTENT_LABELS.SALE[language]}</option>
                      <option value="UDHAAR_GIVEN">
                        {INTENT_LABELS.UDHAAR_GIVEN[language]}
                      </option>
                      <option value="PAYMENT_RECEIVED">
                        {INTENT_LABELS.PAYMENT_RECEIVED[language]}
                      </option>
                      <option value="ADD_INVENTORY">
                        {INTENT_LABELS.ADD_INVENTORY[language]}
                      </option>
                      <option value="EXPENSE">
                        {INTENT_LABELS.EXPENSE[language]}
                      </option>
                    </select>
                  </div>

                  {(parsedAction.intent === "UDHAAR_GIVEN" ||
                    parsedAction.intent === "PAYMENT_RECEIVED") && (
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {t(language, "customer")}
                      </label>
                      <input
                        type="text"
                        value={parsedAction.customerName || ""}
                        onChange={(e) =>
                          setParsedAction({
                            ...parsedAction,
                            customerName: e.target.value,
                            matchedCustomerId: undefined,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {t(language, "amount")}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={parsedAction.amount}
                      onChange={(e) =>
                        setParsedAction({
                          ...parsedAction,
                          amount: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {t(language, "paymentMode")}
                    </label>
                    <select
                      value={parsedAction.paymentMode}
                      onChange={(e) =>
                        setParsedAction({
                          ...parsedAction,
                          paymentMode: e.target.value as PaymentMode,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="UDHAAR">Udhaar</option>
                    </select>
                  </div>
                </div>

                {parsedAction.items.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-600">
                      {t(language, "itemsDetected")}
                    </p>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                      {parsedAction.items.map((item, idx) => (
                        <div
                          key={`${item.productName}-${idx}`}
                          className="flex items-center justify-between px-3 py-2 text-xs"
                        >
                          <span className="font-medium text-slate-800">
                            {item.productName}
                          </span>
                          <span className="font-mono tabular-nums text-slate-600">
                            {item.quantity} {item.unit} ·{" "}
                            {formatINR(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors whitespace-nowrap"
                  >
                    <Check className="h-4 w-4" />
                    <span>{t(language, "confirmAndSave")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setParsedAction(null)}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    <X className="h-4 w-4" />
                    <span>{t(language, "discard")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              {t(language, "recentVoiceLogs")}
            </h3>
            {voiceLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                {language === "hi"
                  ? "अभी तक कोई वॉइस एंट्री नहीं है।"
                  : "No voice entries saved yet."}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {voiceLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-2.5 space-y-1">
                    <p className="text-xs font-medium text-slate-800">
                      “{log.transcript}”
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="truncate pr-2">{log.summary}</span>
                      <span className="font-mono tabular-nums shrink-0">
                        {formatDateTime(log.createdAt, language)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

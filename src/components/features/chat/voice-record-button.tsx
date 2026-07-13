"use client";

import { useCallback, useRef, useState } from "react";
import { Mic, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

type VoiceRecordButtonProps = {
  disabled?: boolean;
  onRecorded: (file: File) => void;
  onError: (message: string) => void;
};

export function VoiceRecordButton({ disabled, onRecorded, onError }: VoiceRecordButtonProps) {
  const { t } = useLanguage();
  const [recording, setRecording] = useState(false);
  const [cancelHint, setCancelHint] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startYRef = useRef(0);
  const cancelledRef = useRef(false);

  const stopTracks = useCallback((recorder: MediaRecorder | null) => {
    recorder?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  async function startRecording(clientY: number) {
    if (disabled || recording) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      cancelledRef.current = false;
      startYRef.current = clientY;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopTracks(recorder);
        setRecording(false);
        setCancelHint(false);

        if (cancelledRef.current || !chunksRef.current.length) {
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 800) {
          onError(t("chatVoiceTooShort"));
          return;
        }

        onRecorded(new File([blob], `voice-${Date.now()}.webm`, { type: mimeType }));
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      onError(t("chatVoiceMicDenied"));
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    void startRecording(event.clientY);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!recording) {
      return;
    }
    setCancelHint(startYRef.current - event.clientY > 72);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (!recording || !recorderRef.current) {
      return;
    }

    cancelledRef.current = cancelHint;
    recorderRef.current.stop();
    recorderRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="relative">
      {recording ? (
        <div
          className={`absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-2xl px-3 py-2 text-xs font-medium shadow-lg ${
            cancelHint
              ? "bg-[var(--danger-bg)] text-[var(--danger-text)]"
              : "surface-panel text-[var(--foreground)]"
          }`}
        >
          {cancelHint ? (
            <span className="inline-flex items-center gap-1">
              <Trash2 aria-hidden className="size-3.5" />
              {t("chatVoiceReleaseCancel")}
            </span>
          ) : (
            t("chatVoiceReleaseSend")
          )}
        </div>
      ) : null}

      <button
        aria-label={t("chatVoiceHold")}
        className={`grid size-11 shrink-0 place-items-center rounded-full shadow-md transition-transform active:scale-95 disabled:opacity-50 ${
          recording ? "bg-[var(--danger-bg)] text-[var(--danger-text)]" : "bg-[var(--accent)] text-white"
        }`}
        disabled={disabled}
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        type="button"
      >
        <Mic aria-hidden className="size-5" />
      </button>
    </div>
  );
}

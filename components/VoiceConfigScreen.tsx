"use client";

import { useState } from "react";
import type { ParsedWorkout } from "@/lib/types";
import { useSpeechRecognition } from "@/lib/useSpeech";
import { parseWorkout } from "@/lib/parseClient";
import type { AudioEngine } from "@/lib/audio";
import { Button } from "./Button";

type Props = {
  audio: AudioEngine;
  onStart: (c: ParsedWorkout) => void;
};

type Stage = "idle" | "parsing" | "review";

export function VoiceConfigScreen({ audio, onStart }: Props) {
  const { supported, listening, transcript, start, stop, reset } = useSpeechRecognition();
  const [stage, setStage] = useState<Stage>("idle");
  const [parsed, setParsed] = useState<ParsedWorkout | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMic = async () => {
    setError(null);
    if (listening) {
      stop();
      await runParse(transcript);
    } else {
      reset();
      setParsed(null);
      start();
    }
  };

  const runParse = async (text: string) => {
    if (!text.trim()) return;
    setStage("parsing");
    try {
      const result = await parseWorkout(text);
      setParsed(result);
      setStage("review");
    } catch {
      setError("Couldn't understand that, please try again");
      setStage("idle");
    }
  };

  const handleStart = async () => {
    await audio.resume(); // unlock audio on user gesture
    if (parsed) onStart(parsed);
  };

  const reRecord = () => {
    setParsed(null);
    setStage("idle");
    reset();
  };

  return (
    <main className="flex min-h-dvh flex-col items-center bg-white p-6 text-brand-navy">
      <h1 className="mb-2 mt-4 text-2xl font-bold">Describe your workout</h1>
      <p className="mb-8 text-center text-sm text-brand-navy/60">
        e.g. 30 seconds prep, 5 rounds, first 2 at 30 seconds, 4th round 40 seconds, last round 20 seconds, rest 15 seconds
      </p>

      {!supported && (
        <p className="mb-4 text-center text-brand-red">
          Voice input isn&apos;t supported in this browser. Open BoxTimer in Chrome on Android.
        </p>
      )}

      {(stage === "idle" || stage === "parsing") && (
        <>
          <button
            onClick={handleMic}
            disabled={stage === "parsing" || !supported}
            aria-label={listening ? "Stop listening" : "Start listening"}
            className={`flex h-32 w-32 items-center justify-center rounded-full bg-brand-navy text-white ${
              listening ? "animate-pulse" : ""
            }`}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
              <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11Z" />
            </svg>
          </button>

          {listening && transcript && (
            <p className="mt-6 max-w-sm text-center text-brand-navy">{transcript}</p>
          )}

          {stage === "parsing" && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-navy/30 border-t-brand-navy" />
              <p>Parsing...</p>
            </div>
          )}

          {error && <p className="mt-6 text-center text-brand-red">{error}</p>}
        </>
      )}

      {stage === "review" && parsed && (
        <div className="flex w-full max-w-sm flex-col items-center">
          <p className="mb-1 text-center text-4xl font-extrabold">
            {parsed.rounds.length} {parsed.rounds.length === 1 ? "round" : "rounds"}
          </p>
          <p className="mb-6 text-center text-xl text-brand-navy/70">
            {parsed.preparation}s prep · {parsed.rest}s rest
          </p>
          <ul className="mb-8 w-full text-center text-2xl font-semibold">
            {parsed.rounds.map((d, i) => (
              <li key={i}>
                Round {i + 1}: {d}s
              </li>
            ))}
          </ul>
          <div className="flex w-full flex-col gap-3">
            <Button onClick={handleStart}>Start</Button>
            <Button
              className="!bg-white !text-brand-navy border-2 border-brand-navy"
              onClick={reRecord}
            >
              Re-record
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

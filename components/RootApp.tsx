"use client";

import { useRef, useState } from "react";
import type { ParsedWorkout, Screen, WorkoutConfig } from "@/lib/types";
import { AudioEngine } from "@/lib/audio";
import { persistConfig } from "@/lib/storage";
import { HomeScreen } from "./HomeScreen";
import { VoiceConfigScreen } from "./VoiceConfigScreen";
import { TimerScreen } from "./TimerScreen";
import { DoneScreen } from "./DoneScreen";

type ActiveConfig = Pick<WorkoutConfig, "preparation" | "rounds" | "rest">;

export function RootApp() {
  const audioRef = useRef<AudioEngine>(new AudioEngine());
  const [screen, setScreen] = useState<Screen>("home");
  const [activeConfig, setActiveConfig] = useState<ActiveConfig | null>(null);
  // The voice-created config eligible to be saved on the Done screen. Null when
  // the workout was launched from an already-saved card (or after it's saved).
  const [saveable, setSaveable] = useState<ActiveConfig | null>(null);
  const [lastElapsed, setLastElapsed] = useState(0);
  const [timerKey, setTimerKey] = useState(0);

  const startTimer = (c: ActiveConfig) => {
    setActiveConfig(c);
    setTimerKey((k) => k + 1);
    setScreen("timer");
  };

  const goHome = () => {
    setActiveConfig(null);
    setSaveable(null);
    setScreen("home");
  };

  if (screen === "home") {
    return (
      <HomeScreen
        onNewWorkout={() => setScreen("voice")}
        onSelectConfig={(c: WorkoutConfig) => {
          void audioRef.current.resume();
          setSaveable(null); // already saved
          startTimer(c);
        }}
      />
    );
  }

  if (screen === "voice") {
    return (
      <VoiceConfigScreen
        audio={audioRef.current}
        onStart={(c: ParsedWorkout) => {
          setSaveable(c); // offer to save it after the workout
          startTimer(c);
        }}
      />
    );
  }

  if (screen === "timer" && activeConfig) {
    return (
      <TimerScreen
        key={timerKey}
        config={activeConfig}
        audio={audioRef.current}
        onStop={goHome}
        onDone={(elapsed) => {
          setLastElapsed(elapsed);
          setScreen("done");
        }}
      />
    );
  }

  if (screen === "done") {
    return (
      <DoneScreen
        elapsed={lastElapsed}
        canSave={saveable !== null}
        onSave={(name) => {
          if (saveable) persistConfig(saveable, name);
          setSaveable(null);
        }}
        onRepeat={() => {
          if (!activeConfig) return goHome();
          void audioRef.current.resume();
          setTimerKey((k) => k + 1);
          setScreen("timer");
        }}
        onHome={goHome}
      />
    );
  }

  // fallback
  return (
    <HomeScreen
      onNewWorkout={() => setScreen("voice")}
      onSelectConfig={(c) => {
        setSaveable(null);
        startTimer(c);
      }}
    />
  );
}

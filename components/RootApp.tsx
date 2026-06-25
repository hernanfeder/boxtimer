"use client";

import { useRef, useState } from "react";
import type { ParsedWorkout, Screen, WorkoutConfig } from "@/lib/types";
import { AudioEngine } from "@/lib/audio";
import { HomeScreen } from "./HomeScreen";
import { VoiceConfigScreen } from "./VoiceConfigScreen";
import { TimerScreen } from "./TimerScreen";
import { DoneScreen } from "./DoneScreen";

type ActiveConfig = Pick<WorkoutConfig, "preparation" | "rounds" | "rest">;

export function RootApp() {
  const audioRef = useRef<AudioEngine>(new AudioEngine());
  const [screen, setScreen] = useState<Screen>("home");
  const [activeConfig, setActiveConfig] = useState<ActiveConfig | null>(null);
  const [lastElapsed, setLastElapsed] = useState(0);
  const [timerKey, setTimerKey] = useState(0);

  const startTimer = (c: ActiveConfig) => {
    setActiveConfig(c);
    setTimerKey((k) => k + 1);
    setScreen("timer");
  };

  const goHome = () => {
    setActiveConfig(null);
    setScreen("home");
  };

  if (screen === "home") {
    return (
      <HomeScreen
        onNewWorkout={() => setScreen("voice")}
        onSelectConfig={(c: WorkoutConfig) => {
          void audioRef.current.resume();
          startTimer(c);
        }}
      />
    );
  }

  if (screen === "voice") {
    return (
      <VoiceConfigScreen
        audio={audioRef.current}
        onStart={(c: ParsedWorkout) => startTimer(c)}
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
    <HomeScreen onNewWorkout={() => setScreen("voice")} onSelectConfig={(c) => startTimer(c)} />
  );
}

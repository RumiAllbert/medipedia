"use client";

import { useEffect, useMemo, useState } from "react";

type ArticleListenProps = {
  title: string;
  summary: string;
  markdown: string;
};

function toSpeakableText(input: string): string {
  return input
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[>*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ArticleListen({ title, summary, markdown }: ArticleListenProps) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  const text = useMemo(
    () => toSpeakableText(`${title}. ${summary}. ${markdown}`),
    [markdown, summary, title],
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    });
    return () => {
      cancelAnimationFrame(id);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const onListen = () => {
    if (!supported) return;
    const synth = window.speechSynthesis;

    if (speaking && !paused) {
      synth.pause();
      setPaused(true);
      return;
    }
    if (speaking && paused) {
      synth.resume();
      setPaused(false);
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    synth.speak(utterance);
  };

  const onStop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  if (!supported) return null;

  return (
    <div className="mt-4 flex items-center gap-2">
      <button
        type="button"
        onClick={onListen}
        className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
      >
        {speaking ? (paused ? "Resume audio" : "Pause audio") : "Listen to article"}
      </button>
      {speaking ? (
        <button
          type="button"
          onClick={onStop}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Stop
        </button>
      ) : null}
    </div>
  );
}

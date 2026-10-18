"use client";

import { useEffect, useState } from "react";

type Line = { c: "cmd" | "ok" | "warn" | "info"; t: string };

const script: Line[] = [
  { c: "cmd", t: "aegisctl baseline --bucket data" },
  { c: "ok", t: "128 fayl · Merkle root 3f9a71…c2e8" },
  { c: "cmd", t: "aegisctl monitor --window 30s" },
  { c: "info", t: "izləmə aktiv · 10s polling" },
  { c: "warn", t: "anomaliya: 41% fayl dəyişdi (hədd 30%)" },
  { c: "cmd", t: "aegisctl contain svc-prod" },
  { c: "info", t: "containment addımı təklif edildi (nümunə)" },
  { c: "cmd", t: "aegisctl restore --verify" },
  { c: "ok", t: "128/128 fayl baseline hash ilə uyğun" },
];

const tone: Record<Line["c"], string> = {
  cmd: "text-accent",
  ok: "text-accent-2",
  warn: "text-amber-300",
  info: "text-muted",
};

export default function HeroTerminal() {
  const [done, setDone] = useState<Line[]>([]);
  const [cur, setCur] = useState("");

  useEffect(() => {
    let alive = true;
    let i = 0;
    let ch = 0;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      if (!alive) return;
      if (i >= script.length) {
        timer = setTimeout(() => {
          if (!alive) return;
          setDone([]);
          setCur("");
          i = 0;
          ch = 0;
          step();
        }, 2600);
        return;
      }
      const line = script[i].t;
      if (ch <= line.length) {
        setCur(line.slice(0, ch));
        ch++;
        timer = setTimeout(step, 16);
      } else {
        const finished = script[i];
        setDone((d) => [...d, finished]);
        setCur("");
        i++;
        ch = 0;
        timer = setTimeout(step, 380);
      }
    };

    step();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="panel relative overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-panel/70 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-400/70" />
        <span className="h-3 w-3 rounded-full bg-amber-400/70" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
        <span className="mono ml-2 text-xs text-muted">nümunə terminal · demo, real agent deyil</span>
      </div>
      <div className="mono h-64 space-y-1.5 overflow-hidden p-4 text-xs leading-6">
        {done.map((l, k) => (
          <p key={k} className={tone[l.c]}>
            {l.c === "cmd" ? <span className="text-accent-2">$ </span> : null}
            {l.t}
          </p>
        ))}
        <p className={tone[script[Math.min(done.length, script.length - 1)].c]}>
          {script[Math.min(done.length, script.length - 1)].c === "cmd" ? (
            <span className="text-accent-2">$ </span>
          ) : null}
          {cur}
          <span className="anim-blink ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-accent" />
        </p>
      </div>
    </div>
  );
}

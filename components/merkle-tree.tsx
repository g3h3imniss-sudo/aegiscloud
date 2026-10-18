"use client";

import { useCallback, useEffect, useState } from "react";

const LEAF_NAMES = [
  "invoice.pdf",
  "db.sqlite",
  "keys.pem",
  "users.csv",
  "canary.docx",
  "backup.zip",
  "config.yml",
  "report.xlsx",
];
const CANARY = 4;

const OK = "rgba(127,168,106,0.85)";
const OK_FILL = "rgba(127,168,106,0.12)";
const BAD = "rgba(196,85,59,0.9)";
const BAD_FILL = "rgba(196,85,59,0.16)";
const CANARY_STROKE = "rgba(224,164,60,0.9)";
const CANARY_FILL = "rgba(224,164,60,0.14)";
const INK = "#918d86";

async function sha(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type Levels = string[][];

async function buildLevels(tampered: number | null): Promise<Levels> {
  const contents = LEAF_NAMES.map((n, i) =>
    i === tampered ? `${n}::CORRUPTED` : n,
  );
  const L0 = await Promise.all(contents.map(sha));
  const L1 = await Promise.all(
    [0, 1, 2, 3].map((i) => sha(L0[i * 2] + L0[i * 2 + 1])),
  );
  const L2 = await Promise.all([0, 1].map((i) => sha(L1[i * 2] + L1[i * 2 + 1])));
  const L3 = [await sha(L2[0] + L2[1])];
  return [L0, L1, L2, L3];
}

const leafX = (i: number) => 70 + i * 80;
const mid = (a: number, b: number) => (a + b) / 2;

export default function MerkleTree() {
  const [levels, setLevels] = useState<Levels | null>(null);
  const [tampered, setTampered] = useState<number | null>(null);

  const recompute = useCallback(async (t: number | null) => {
    setLevels(await buildLevels(t));
  }, []);

  useEffect(() => {
    let alive = true;
    buildLevels(null).then((l) => {
      if (alive) setLevels(l);
    });
    return () => {
      alive = false;
    };
  }, []);

  function corrupt() {
    let i = Math.floor(Math.random() * LEAF_NAMES.length);
    if (i === CANARY) i = (i + 1) % LEAF_NAMES.length;
    setTampered(i);
    recompute(i);
  }

  function restore() {
    setTampered(null);
    recompute(null);
  }

  const Y = [300, 230, 160, 80];

  const dirty = (level: number, idx: number): boolean => {
    if (tampered === null) return false;
    if (level === 0) return idx === tampered;
    return dirty(level - 1, idx * 2) || dirty(level - 1, idx * 2 + 1);
  };

  const nodeX = (level: number, idx: number): number => {
    if (level === 0) return leafX(idx);
    return mid(nodeX(level - 1, idx * 2), nodeX(level - 1, idx * 2 + 1));
  };

  const root = levels ? levels[3][0] : "";

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel-2 px-5 py-3">
        <div className="mono flex items-center gap-2 text-xs">
          <span
            className={`h-1.5 w-1.5 ${
              tampered === null ? "bg-accent-2" : "bg-[#c4553b]"
            }`}
          />
          <span className="text-muted">
            {tampered === null
              ? "bütövlük qorunur"
              : "bütövlük pozuntusu aşkarlandı"}
          </span>
        </div>
        <div className="mono flex gap-2 text-xs">
          <button
            onClick={corrupt}
            className="rounded-sm bg-[#c4553b] px-3.5 py-1.5 font-semibold text-[#0b0b0d] hover:bg-[#d05a3f]"
          >
            nümunəni dəyiş
          </button>
          <button
            onClick={restore}
            disabled={tampered === null}
            className="rounded-sm border border-line px-3.5 py-1.5 text-muted hover:text-foreground disabled:opacity-40"
          >
            bərpa et
          </button>
        </div>
      </div>

      <div className="p-4">
        <svg viewBox="0 0 700 360" className="w-full">
          <title>Merkle ağacı: bütövlük sübutu</title>
          {[1, 2, 3].map((level) =>
            Array.from({ length: 8 / 2 ** level }).map((_, idx) => {
              const x = nodeX(level, idx);
              const px = nodeX(level - 1, idx * 2);
              const qx = nodeX(level - 1, idx * 2 + 1);
              const bad = dirty(level, idx);
              return (
                <g key={`e-${level}-${idx}`}>
                  <line
                    x1={px}
                    y1={Y[level - 1]}
                    x2={x}
                    y2={Y[level]}
                    stroke={bad ? BAD : OK}
                    strokeWidth={1.4}
                    className={bad ? "" : "flow-dash"}
                  />
                  <line
                    x1={qx}
                    y1={Y[level - 1]}
                    x2={x}
                    y2={Y[level]}
                    stroke={bad ? BAD : OK}
                    strokeWidth={1.4}
                    className={bad ? "" : "flow-dash"}
                  />
                </g>
              );
            }),
          )}

          {LEAF_NAMES.map((n, i) => {
            const isCanary = i === CANARY;
            const bad = dirty(0, i);
            return (
              <g key={n}>
                <rect
                  x={leafX(i) - 9}
                  y={Y[0] - 9}
                  width={18}
                  height={18}
                  rx={2}
                  fill={bad ? BAD_FILL : isCanary ? CANARY_FILL : OK_FILL}
                  stroke={bad ? BAD : isCanary ? CANARY_STROKE : OK}
                  strokeWidth={1.6}
                />
                <text
                  x={leafX(i)}
                  y={Y[0] + 28}
                  textAnchor="middle"
                  className="mono"
                  fontSize="8.5"
                  fill={isCanary ? "#e0a43c" : INK}
                >
                  {n}
                </text>
              </g>
            );
          })}

          {levels &&
            levels.slice(1, 3).map((row, li) =>
              row.map((_, idx) => {
                const level = li + 1;
                const bad = dirty(level, idx);
                return (
                  <rect
                    key={`n-${level}-${idx}`}
                    x={nodeX(level, idx) - 7}
                    y={Y[level] - 7}
                    width={14}
                    height={14}
                    rx={2}
                    fill={bad ? BAD_FILL : "rgba(224,164,60,0.12)"}
                    stroke={bad ? BAD : "rgba(224,164,60,0.7)"}
                    strokeWidth={1.4}
                  />
                );
              }),
            )}

          <rect
            x={nodeX(3, 0) - 10}
            y={Y[3] - 10}
            width={20}
            height={20}
            rx={2}
            fill={tampered === null ? OK_FILL : BAD_FILL}
            stroke={tampered === null ? OK : BAD}
            strokeWidth={2}
          />
          <text
            x={nodeX(3, 0)}
            y={Y[3] - 20}
            textAnchor="middle"
            className="mono"
            fontSize="9.5"
            fill={INK}
          >
            ROOT (SHA-256)
          </text>
        </svg>

        <div className="mono mt-1 truncate rounded-sm border border-line bg-black/30 px-3 py-2 text-xs">
          <span className="text-muted">root = </span>
          <span className={tampered === null ? "text-accent-2" : "text-[#d97a5f]"}>
            {root ? root.slice(0, 48) + "…" : "hesablanır…"}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">
          Nümunə leaf dəyəri dəyişəndə onun hash-i və yuxarı qovşaqlar yenilənir.
          Sarı leaf canary ideyasını göstərir, amma real fayl və agent izlənmir.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const stages = [
  { id: "baseline", t: "Baseline", s: "SHA-256 Merkle root", tags: ["ISO A.8.24", "RFC 6962"] },
  { id: "monitor", t: "Monitor", s: "dəyişiklik sürəti", tags: ["10s polling"] },
  { id: "detect", t: "Detect", s: "pəncərə + canary", tags: ["ISO A.8.16"] },
  { id: "contain", t: "Contain", s: "IAM yazma dondurma", tags: ["least privilege"] },
  { id: "audit", t: "Audit", s: "hash zəncirli log", tags: ["ISO A.8.15"] },
  { id: "restore", t: "Restore", s: "AEAD + baseline hash", tags: ["NIST 800-38D"] },
] as const;

type Id = (typeof stages)[number]["id"];

function Detail({ id }: { id: Id }) {
  if (id === "baseline")
    return (
      <div>
        <p className="text-sm text-muted">
          Hər faylın 64 simvollu SHA-256 barmaq izi hesablanır və cüt-cüt birləşərək
          deterministik Merkle kökünə yığılır.
        </p>
        <pre className="mono mt-3 rounded-sm border border-line bg-black/30 p-3 text-xs text-accent-2">
{`leaf   = SHA-256(object)
parent = SHA-256(left || right)
root   = 3f9a71c8…c2e8`}
        </pre>
      </div>
    );
  if (id === "monitor") {
    const bars = [12, 18, 15, 22, 19, 26, 24, 31, 28, 41, 38, 44];
    return (
      <div>
        <p className="text-sm text-muted">
          Sütunlar uydurma nümunə göstəriciləridir; burada R2 dəyişiklik sürəti hesablanmır.
        </p>
        <div className="mt-4 flex h-28 items-end gap-1">
          {bars.map((b, i) => (
            <div
              key={i}
              className={`anim-bar flex-1 ${b >= 30 ? "bg-[#c4553b]" : "bg-accent/70"}`}
              style={{ height: `${b}%`, animationDelay: `${i * 30}ms` }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Qırmızı sütunlar 30% həddini keçən anlardır.
        </p>
      </div>
    );
  }
  if (id === "detect")
    return (
      <div>
        <p className="text-sm text-muted">
          Bu kartlar işləyən aşkarlama qaydası deyil, nümunə vəziyyətlərdir.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-sm border border-accent-2/50 bg-accent-2/10 p-3">
            <p className="mono text-accent-2">NORMAL</p>
            <p className="mt-1 text-muted">&lt; 10%</p>
          </div>
          <div className="rounded-sm border border-accent/50 bg-accent/10 p-3">
            <p className="mono text-accent">SUSPICIOUS</p>
            <p className="mt-1 text-muted">10-30%</p>
          </div>
          <div className="rounded-sm border border-[#c4553b]/60 bg-[#c4553b]/10 p-3">
            <p className="mono text-[#d97a5f]">RANSOMWARE</p>
            <p className="mt-1 text-muted">≥ 30% / canary</p>
          </div>
        </div>
      </div>
    );
  if (id === "contain")
    return (
      <div>
        <p className="text-sm text-muted">
          Bu tətbiq Cloudflare R2 token icazələrini dəyişmir. Aşağıdakı mətn əməliyyat deyil,
          konseptual nümunədir.
        </p>
        <pre className="mono mt-3 rounded-sm border border-line bg-black/30 p-3 text-xs text-[#d97a5f]">
{`# nümunə addım — Cloudflare API çağırışı edilmir
# R2 token icazələri dəyişdirilmir
# incident komandası insan təsdiqi ilə araşdırır`}
        </pre>
      </div>
    );
  if (id === "audit")
    return (
      <div>
        <p className="text-sm text-muted">
          Hər hadisə əvvəlkinin hash-ini özündə daşıyır. Bir qeyd dəyişsə, zəncir
          qırılır.
        </p>
        <div className="mono mt-3 space-y-1.5 text-xs">
          {["genesis", "#102", "#103", "#104"].map((b, i) => (
            <div key={b} className="flex items-center gap-2">
              <span className="rounded-sm border border-line px-2 py-1 text-muted">
                {b}
              </span>
              {i < 3 && <span className="text-accent-2">→</span>}
              <span className="truncate text-accent-2">
                h={["00…00", "a1f3…9c", "b7d2…4e", "c9a8…71"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  return (
    <div>
      <p className="text-sm text-muted">
        Real backup bu tətbiqdə yoxdur. Bu nümunə ekran bərpa yoxlamasının
        mümkün çıxışını təsvir edir; bərpa üçün müstəqil ehtiyat nüsxə lazımdır.
      </p>
      <div className="mt-3 space-y-1.5 text-sm">
        {[
          ["128 fayl", "VALID", "text-accent-2"],
          ["0 fayl", "MODIFIED", "text-accent"],
          ["0 fayl", "MISSING", "text-muted"],
        ].map(([n, s, c]) => (
          <div
            key={s}
            className="flex items-center justify-between rounded-sm border border-line bg-panel-2 px-3 py-2"
          >
            <span className="text-muted">{n}</span>
            <span className={`mono ${c}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Lifecycle() {
  const [active, setActive] = useState<Id>("baseline");
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setActive((cur) => {
        const i = stages.findIndex((s) => s.id === cur);
        return stages[(i + 1) % stages.length].id;
      });
    }, 2200);
    return () => clearInterval(t);
  }, [auto]);

  const current = stages.find((s) => s.id === active)!;

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-panel-2 px-5 py-3">
        <span className="mono text-xs text-muted">konseptual lifecycle demo / 6 mərhələ</span>
        <button
          onClick={() => setAuto((a) => !a)}
          className={`mono rounded-sm border px-3 py-1.5 text-xs ${
            auto ? "tab-active" : "border-line text-muted hover:text-foreground"
          }`}
        >
          {auto ? "[ stop ]" : "[ auto-play ]"}
        </button>
      </div>

      <div className="grid gap-px bg-line md:grid-cols-6">
        {stages.map((s, i) => {
          const on = s.id === active;
          return (
            <button
              key={s.id}
              onClick={() => {
                setActive(s.id);
                setAuto(false);
              }}
              className={`p-3 text-left transition-colors ${
                on ? "bg-accent/10" : "bg-panel hover:bg-panel-2"
              }`}
            >
              <span className="mono text-[11px] text-muted">0{i + 1}</span>
              <p className={`mt-1 text-sm font-medium ${on ? "text-accent" : "text-muted"}`}>
                {s.t}
              </p>
              <p className="mono mt-0.5 text-[10px] text-muted">{s.s}</p>
            </button>
          );
        })}
      </div>

      <div className="border-t border-line p-5">
        <div key={active} className="anim-popin grid gap-5 md:grid-cols-3">
          <div>
            <span className="mono text-xs text-accent-2">mərhələ</span>
            <h3 className="mt-1 text-lg font-semibold">{current.t}</h3>
            <div className="mono mt-3 flex flex-wrap gap-2 text-[11px]">
              {current.tags.map((t) => (
                <span key={t} className="rounded-sm border border-line px-2 py-0.5 text-muted">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Detail id={active} />
          </div>
        </div>
      </div>
    </div>
  );
}

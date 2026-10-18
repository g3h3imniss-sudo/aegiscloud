"use client";

import { useCallback, useEffect, useState } from "react";

type Status = {
  platform: string;
  region: string;
  env: string;
  node: string;
  now: string;
  db: boolean;
};

type Scan = {
  ok: boolean;
  error?: string;
  finalUrl: string;
  status: number;
  redirects: { from: string; to: string; status: number }[];
  tls: { authorized: boolean; protocol: string | null; issuer: string | null; validTo: string | null } | null;
  headers: Record<string, string>;
  present: string[];
  missing: string[];
  logged?: boolean;
};

type AuditRow = {
  id: number;
  action: string;
  target: string | null;
  status: number | null;
  tls_issuer: string | null;
  entry_hash: string;
  created_at: string;
};

type AuditState = {
  configured: boolean;
  rows: AuditRow[];
  chain: { total: number; valid: boolean; broken_id: number | null } | null;
  stats: { total: number; unique: number; passRate: number } | null;
};

const EMPTY: AuditState = { configured: false, rows: [], chain: null, stats: null };

export default function LiveCheck() {
  const [status, setStatus] = useState<Status | null>(null);
  const [url, setUrl] = useState("vercel.com");
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<AuditState>(EMPTY);
  const [token, setToken] = useState("");
  const [auditError, setAuditError] = useState("");
  const [statusError, setStatusError] = useState("");

  const loadAudit = useCallback(async () => {
    setAuditError("");
    try {
      const r = await fetch("/api/audit", {
        headers: { "x-admin-token": token },
      });
      const j = (await r.json()) as AuditState & { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) throw new Error(j.error ?? "Audit məlumatlarını yükləmək alınmadı.");
      setAudit({
        configured: j.configured,
        rows: j.rows ?? [],
        chain: j.chain ?? null,
        stats: j.stats ?? null,
      });
    } catch (cause) {
      setAuditError(cause instanceof Error ? cause.message : "Audit məlumatlarını yükləmək alınmadı.");
    }
  }, [token]);

  useEffect(() => {
    let alive = true;
    fetch("/api/status")
      .then(async (response) => {
        const result = (await response.json()) as Status & {
          ok?: boolean;
          error?: string;
        };
        if (!response.ok || !result.ok) {
          throw new Error(result.error ?? "Statusu yükləmək alınmadı.");
        }
        return result;
      })
      .then((j) => {
        if (alive) setStatus(j);
      })
      .catch((cause: unknown) => {
        if (alive) {
          setStatusError(
            cause instanceof Error ? cause.message : "Statusu yükləmək alınmadı.",
          );
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  async function run() {
    setLoading(true);
    setError("");
    setScan(null);
    try {
      const r = await fetch(`/api/scan?url=${encodeURIComponent(url)}`, {
        headers: { "x-admin-token": token },
      });
      const j = (await r.json()) as Scan;
      if (!r.ok || !j.ok) setError(j.error ?? "Yoxlama alınmadı.");
      else {
        setScan(j);
        await loadAudit();
      }
    } catch {
      setError("Server cavab vermədi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-line pt-6">
      <div className="mono grid gap-x-8 gap-y-3 text-xs sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["platform", status?.platform ?? "…"],
          ["region", status?.region ?? "…"],
          ["runtime", status?.node ?? "…"],
          ["supabase", status ? (status.db ? "connected" : "not set") : "…"],
          ["tarama sayı", audit.stats ? String(audit.stats.total) : "…"],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-muted">{k}</p>
            <p className={`mt-0.5 ${v === "not set" ? "text-[#d97a5f]" : "text-accent"}`}>
              {v}
            </p>
          </div>
        ))}
      </div>
      {statusError && <p className="mono mt-2 text-xs text-[#d97a5f]">{statusError}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          type="password"
          autoComplete="off"
          placeholder="operator tokeni (ən azı 32 simvol)"
          className="mono w-full rounded-sm border border-line bg-black/30 px-3 py-2 text-sm outline-none focus:border-accent/60"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="domen və ya URL"
          className="mono flex-1 rounded-sm border border-line bg-black/30 px-3 py-2 text-sm outline-none focus:border-accent/60"
        />
        <button
          onClick={run}
          disabled={loading || token.length < 32}
          className="mono rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-[#0b0b0d] hover:bg-accent/90 disabled:opacity-40"
        >
          {loading ? "yoxlanır…" : "yoxla"}
        </button>
      </div>

      {error && <p className="mono mt-3 text-xs text-[#d97a5f]">{error}</p>}

      {scan && (
        <div className="mt-5 space-y-4 anim-rise">
          <div className="mono flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <span>
              <span className="text-muted">status </span>
              <span className={scan.status < 400 ? "text-accent-2" : "text-[#d97a5f]"}>
                {scan.status}
              </span>
            </span>
            <span>
              <span className="text-muted">TLS </span>
              <span className={scan.tls?.authorized ? "text-accent-2" : "text-muted"}>
                {scan.tls ? `${scan.tls.protocol} · ${scan.tls.issuer ?? "?"}` : "yoxdur"}
              </span>
            </span>
            <span className="truncate text-muted">{scan.finalUrl}</span>
          </div>

          {scan.redirects.length > 0 && (
            <div className="mono space-y-1 text-xs text-muted">
              {scan.redirects.map((r, i) => (
                <p key={i}>
                  <span className="text-accent">{r.status}</span> {r.from} → {r.to}
                </p>
              ))}
            </div>
          )}

          <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
            <div>
              <p className="mono text-[11px] text-accent-2">mövcud başlıqlar</p>
              <ul className="mono mt-1 space-y-1 text-xs text-muted">
                {scan.present.length === 0 && <li>yoxdur</li>}
                {scan.present.map((h) => (
                  <li key={h}>
                    <span className="text-accent-2">+</span> {h}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mono text-[11px] text-[#d97a5f]">çatışmayan başlıqlar</p>
              <ul className="mono mt-1 space-y-1 text-xs text-muted">
                {scan.missing.length === 0 && <li>yoxdur</li>}
                {scan.missing.map((h) => (
                  <li key={h}>
                    <span className="text-[#d97a5f]">-</span> {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Audit ledger (Supabase) */}
      <div className="mt-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="mono text-[11px] text-muted">
            audit ledger · supabase / son 8 qeyd
          </p>
          <button
            onClick={loadAudit}
            disabled={token.length < 32}
            className="mono rounded-sm border border-line px-2.5 py-1 text-[11px] text-muted hover:border-accent/50 hover:text-accent disabled:opacity-40"
          >
            zənciri yoxla
          </button>
        </div>

        {auditError && <p className="mt-2 text-xs text-[#d97a5f]">{auditError}</p>}
        {!audit.configured ? (
          <p className="mt-1 text-xs text-muted">
            Operator tokeni ilə audit məlumatlarını yükləyin.
          </p>
        ) : (
          <>
            <div className="mono mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
              {audit.chain && (
                <span>
                  <span className="text-muted">zəncir: </span>
                  <span className={audit.chain.valid ? "text-accent-2" : "text-[#d97a5f]"}>
                    {audit.chain.valid
                      ? `valid · ${audit.chain.total} qeyd`
                      : `pozulub (id ${audit.chain.broken_id})`}
                  </span>
                </span>
              )}
              {audit.stats && (
                <span className="text-muted">
                  cəm {audit.stats.total} · unikal {audit.stats.unique} · uğur{" "}
                  {audit.stats.passRate}%
                </span>
              )}
            </div>

            {audit.rows.length === 0 ? (
              <p className="mt-2 text-xs text-muted">
                Hələ qeyd yoxdur. Yuxarıdan bir domen yoxla.
              </p>
            ) : (
              <div className="mono mt-2 text-xs">
                {audit.rows.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-line-soft py-1.5"
                  >
                    <span className="text-muted">{r.created_at.slice(11, 19)}</span>
                    <span className="text-accent">{r.action}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">{r.target}</span>
                    <span className={r.status && r.status < 400 ? "text-accent-2" : "text-[#d97a5f]"}>
                      {r.status ?? "-"}
                    </span>
                    <span className="text-muted" title={r.entry_hash}>
                      {r.entry_hash.slice(0, 12)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-muted">
        Server yalnız ictimai ünvanlara qoşulur; yönləndirmələr də yoxlanır.
        Yoxlama operator tokeni tələb edir və audit qeydi Supabase-ə yazılmağa
        çalışır.
      </p>
    </div>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";

type StoredFile = {
  name: string;
  size: number | null;
  updated: string | null;
  url: string | null;
};

function human(bytes: number | null) {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function StoragePanel() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [configured, setConfigured] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/storage", {
        headers: { "x-admin-token": token },
      });
      const j = (await r.json()) as {
        ok: boolean;
        configured: boolean;
        files: StoredFile[];
        error?: string;
      };
      if (!r.ok || !j.ok) throw new Error(j.error ?? "Faylları yükləmək alınmadı.");
      setConfigured(j.configured);
      setFiles(j.files ?? []);
      setLoaded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Faylları yükləmək alınmadı.");
    } finally {
      setBusy(false);
    }
  }, [token]);

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/storage", {
        method: "POST",
        headers: { "x-admin-token": token },
        body: fd,
      });
      const j = await r.json();
      if (!r.ok || !j.ok) setError(j.error ?? "yükləmək alınmadı");
      else await load();
    } catch {
      setError("şəbəkə xətası");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="border-t border-line pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
          className="mono text-xs text-muted file:mr-3 file:rounded-sm file:border file:border-line file:bg-black/30 file:px-3 file:py-1.5 file:text-xs file:text-accent"
        />
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          type="password"
          autoComplete="off"
          placeholder="operator tokeni (ən azı 32 simvol)"
          className="mono flex-1 rounded-sm border border-line bg-black/30 px-3 py-1.5 text-xs outline-none focus:border-accent/60"
        />
        <button
          disabled={busy}
          onClick={load}
          className="rounded-sm border border-line px-3 py-1.5 text-xs text-muted hover:border-accent/50 hover:text-accent disabled:opacity-40"
        >
          siyahını yüklə
        </button>
      </div>

      {busy && <p className="mono mt-3 text-xs text-accent">yüklənir…</p>}
      {error && <p className="mono mt-3 text-xs text-[#d97a5f]">{error}</p>}

      {!loaded ? (
        <p className="mt-3 text-xs text-muted">
          Faylları görmək üçün operator tokenini daxil edib siyahını yüklə.
        </p>
      ) : !configured ? (
        <p className="mt-3 text-xs text-muted">Cloudflare R2 konfiqurasiya edilməyib.</p>
      ) : files.length === 0 ? (
        <p className="mt-3 text-xs text-muted">Hələ fayl yoxdur. Yuxarıdan fayl seç.</p>
      ) : (
        <div className="mono mt-3 text-xs">
          {files.map((f) => (
            <div
              key={f.name}
              className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-line-soft py-1.5"
            >
              <span className="min-w-0 flex-1 truncate text-foreground">{f.name}</span>
              <span className="text-muted">{human(f.size)}</span>
              <span className="text-muted">{f.updated?.slice(0, 19).replace("T", " ")}</span>
              {f.url && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  endir
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        Fayllar konfiqurasiya edilmiş Cloudflare R2 bucket-də saxlanır; API
        tokenini yalnız bu bucket üçün icazələrlə məhdudlaşdırın.
        Yükləmə serverdə gedir, endirmə üçün müddətli imzalı URL verilir.
      </p>
    </div>
  );
}

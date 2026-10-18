"use client";

import { useState } from "react";
import {
  aesDecrypt,
  aesEncrypt,
  ecdsaSign,
  ecdsaVerify,
  genEcdsaKeys,
  hashHex,
  hmacHex,
  pbkdf2Hex,
  type AesBundle,
  type SigKeys,
} from "@/lib/webcrypto";

type TabId = "hash" | "hmac" | "aead" | "sig" | "kdf";

const tabs: { id: TabId; label: string; algo: string }[] = [
  { id: "aead", label: "AES-256-GCM", algo: "Simmetrik şifrələmə (AEAD)" },
  { id: "hash", label: "SHA-256 / 512", algo: "Hash funksiyası (bütövlük)" },
  { id: "hmac", label: "HMAC-SHA256", algo: "Mesaj autentifikasiyası" },
  { id: "sig", label: "ECDSA P-256", algo: "Rəqəmsal imza (asimmetrik)" },
  { id: "kdf", label: "PBKDF2", algo: "Açar törəmə funksiyası" },
];

function Out({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <pre className="mono mt-1 max-h-40 overflow-auto break-all rounded-md border border-line bg-black/30 p-3 text-xs text-accent-2">
        {value}
      </pre>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-line bg-black/30 px-3 py-2 text-sm outline-none focus:border-accent/60";
const btnCls =
  "rounded-md bg-accent px-4 py-2 text-sm font-semibold text-[#0b0b0d] hover:bg-accent/90 disabled:opacity-40";
const btnGhost =
  "rounded-md border border-line bg-panel px-4 py-2 text-sm hover:border-accent/40 hover:text-accent disabled:opacity-40";

export default function CryptoLab() {
  const [tab, setTab] = useState<TabId>("aead");

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b border-line bg-panel/60 p-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
              tab === t.id
                ? "tab-active"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "aead" && <AeadPanel />}
        {tab === "hash" && <HashPanel />}
        {tab === "hmac" && <HmacPanel />}
        {tab === "sig" && <SigPanel />}
        {tab === "kdf" && <KdfPanel />}
      </div>
    </div>
  );
}

/* ── AES-256-GCM ───────────────────────────────────────────────── */
function AeadPanel() {
  const [pw, setPw] = useState("gizli-parol-2026");
  const [text, setText] = useState("Kredit kartı: 4111 1111 1111 1111");
  const [bundle, setBundle] = useState<AesBundle | null>(null);
  const [decPw, setDecPw] = useState("gizli-parol-2026");
  const [recovered, setRecovered] = useState("");
  const [err, setErr] = useState("");
  const [tampered, setTampered] = useState("");

  async function doEncrypt() {
    setErr("");
    setRecovered("");
    try {
      setBundle(await aesEncrypt(pw, text));
    } catch (e) {
      setErr(String(e));
    }
  }

  async function doDecrypt(password: string) {
    if (!bundle) return;
    setErr("");
    try {
      setRecovered(await aesDecrypt(password, bundle.saltB64, bundle.ivB64, bundle.cipherB64));
    } catch {
      setRecovered("");
      setErr("Deşifrələmə alınmadı. Parol səhvdir, ya da AEAD bütövlük teqi uyğun gəlmir.");
    }
  }

  async function doTamper() {
    if (!bundle) return;
    // Şifrə mətninin bir baytını dəyişirik → AEAD teqi tutmalıdır.
    const bytes = Uint8Array.from(atob(bundle.cipherB64), (c) => c.charCodeAt(0));
    bytes[0] ^= 0xff;
    let s = "";
    bytes.forEach((b) => (s += String.fromCharCode(b)));
    const broken = btoa(s);
    try {
      await aesDecrypt(pw, bundle.saltB64, bundle.ivB64, broken);
      setTampered("Gözlənilməz: korlanmış şifrə mətn qəbul edildi!");
    } catch {
      setTampered("Bütövlük pozuntusu aşkarlandı. GCM teqi korlanmış məlumatı rədd etdi.");
    }
  }

  const none = <p className="text-sm text-muted">Hələ nəticə yoxdur.</p>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <label className="text-xs text-muted">Parol (açar PBKDF2 ilə törədilir)</label>
        <input className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} />
        <label className="mt-3 block text-xs text-muted">Açıq mətn (plaintext)</label>
        <textarea
          className={`${inputCls} h-24 resize-none`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className={`${btnCls} mt-3`} onClick={doEncrypt}>
          Şifrələ
        </button>

        {bundle ? (
          <>
            <Out label="Salt (16 bayt, Base64)" value={bundle.saltB64} />
            <Out label="IV / Nonce (12 bayt, Base64)" value={bundle.ivB64} />
            <Out label="Şifrə mətn + teq (Base64)" value={bundle.cipherB64} />
            <p className="mt-2 text-xs text-muted">
              Şifrə mətn ölçüsü: {bundle.cipherBytes} bayt (açıq mətn + 16 bayt AEAD teqi)
            </p>
          </>
        ) : (
          none
        )}
      </div>

      <div>
        <label className="text-xs text-muted">Deşifrələmə üçün parol</label>
        <input
          className={inputCls}
          value={decPw}
          onChange={(e) => setDecPw(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={btnGhost}
            disabled={!bundle}
            onClick={() => doDecrypt(decPw)}
          >
            Deşifrələ
          </button>
          <button
            className={btnGhost}
            disabled={!bundle}
            onClick={() => {
              setDecPw("yanlış-parol");
              doDecrypt("yanlış-parol");
            }}
          >
            Səhv parolla yoxla
          </button>
          <button className={btnGhost} disabled={!bundle} onClick={doTamper}>
            Şifrə mətni korla
          </button>
        </div>

        {recovered && (
          <div className="mt-3 rounded-md border border-accent-2/40 bg-accent-2/5 p-3 text-sm">
            Açılan mətn:{" "}
            <span className="mono break-all text-accent-2">{recovered}</span>
          </div>
        )}
        {tampered && (
          <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-300">
            {tampered}
          </div>
        )}
        {err && (
          <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/5 p-3 text-xs text-red-300">
            {err}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── SHA ───────────────────────────────────────────────────────── */
function HashPanel() {
  const [text, setText] = useState("Sifariş #10245: 3 ədəd monitor");
  const [s256, setS256] = useState("");
  const [s512, setS512] = useState("");

  async function run() {
    setS256(await hashHex("SHA-256", text));
    setS512(await hashHex("SHA-512", text));
  }

  return (
    <div>
      <label className="text-xs text-muted">Mətn</label>
      <textarea
        className={`${inputCls} h-20 resize-none`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className={`${btnCls} mt-3`} onClick={run}>
        Hash hesabla
      </button>
      {s256 && <Out label="SHA-256 (256 bit / 64 hex)" value={s256} />}
      {s512 && <Out label="SHA-512 (512 bit / 128 hex)" value={s512} />}
      <p className="mt-3 text-xs text-muted">
        Mətndə bir simvol dəyişsəniz, hash tamamilə fərqli olacaq. Buna
        &quot;avalanche effekti&quot; deyilir.
      </p>
    </div>
  );
}

/* ── HMAC ──────────────────────────────────────────────────────── */
function HmacPanel() {
  const [key, setKey] = useState("server-secret-key");
  const [msg, setMsg] = useState("user_id=42&amount=150");
  const [mac, setMac] = useState("");

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-muted">Açar (key)</label>
          <input className={inputCls} value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted">Mesaj</label>
          <input className={inputCls} value={msg} onChange={(e) => setMsg(e.target.value)} />
        </div>
      </div>
      <button className={`${btnCls} mt-3`} onClick={async () => setMac(await hmacHex(key, msg))}>
        HMAC hesabla
      </button>
      {mac && <Out label="HMAC-SHA256" value={mac} />}
      <p className="mt-3 text-xs text-muted">
        HMAC mesajı və açarı birləşdirərək bütövlüyü və mənbəyi təsdiqləyir.
        Token və API imzalarında istifadə olunur.
      </p>
    </div>
  );
}

/* ── ECDSA ─────────────────────────────────────────────────────── */
function SigPanel() {
  const [keys, setKeys] = useState<SigKeys | null>(null);
  const [msg, setMsg] = useState("Müqavilə #A-2026: təsdiq edirəm");
  const [sig, setSig] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("Müqavilə #A-2026: təsdiq edirəm");
  const [ok, setOk] = useState<boolean | null>(null);

  async function gen() {
    const k = await genEcdsaKeys();
    setKeys(k);
    setSig("");
    setOk(null);
  }
  async function sign() {
    if (!keys) return;
    setSig(await ecdsaSign(keys.privateKey, msg));
    setOk(null);
  }
  async function verify() {
    if (!keys || !sig) return;
    setOk(await ecdsaVerify(keys.publicB64, sig, verifyMsg));
  }

  return (
    <div>
      <button className={btnCls} onClick={gen}>
        {keys ? "Yeni açar cütü yarat" : "Açar cütü yarat"}
      </button>

      {keys && (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <Out label="Public açar (koordinat, Base64)" value={keys.publicB64} />
            <p className="mt-2 text-xs text-muted">
              Private açar heç vaxt ixrac olunmur, brauzerin qorunan yaddaşında qalır.
            </p>
          </div>
          <div>
            <label className="text-xs text-muted">İmzalanacaq mesaj</label>
            <textarea
              className={`${inputCls} h-20 resize-none`}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
            <button className={`${btnGhost} mt-3`} onClick={sign}>
              İmzala
            </button>
            {sig && <Out label="İmza (ECDSA, DER, Base64)" value={sig} />}
          </div>
        </div>
      )}

      {sig && (
        <div className="mt-6 border-t border-line pt-5">
          <label className="text-xs text-muted">
            Yoxlama üçün mesaj (dəyişsəniz imza etibarsız olacaq)
          </label>
          <textarea
            className={`${inputCls} h-20 resize-none`}
            value={verifyMsg}
            onChange={(e) => setVerifyMsg(e.target.value)}
          />
          <div className="mt-3 flex items-center gap-3">
            <button className={btnGhost} onClick={verify}>
              İmzanı yoxla
            </button>
            {ok !== null && (
              <span
                className={`rounded-md px-3 py-1 text-xs ${
                  ok
                    ? "border border-accent-2/40 bg-accent-2/10 text-accent-2"
                    : "border border-red-500/40 bg-red-500/10 text-red-300"
                }`}
              >
                {ok ? "İmza ETİBARLIDIR" : "İmza ETİBARSIZDIR"}
              </span>
            )}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        İmza mesajın hash-ini açar ilə şifrələyir. Mesajı bir simvol dəyişsəniz,
        yoxlama uğursuz olur. Bu, bütövlüyü və inkarılmazlığı (non-repudiation)
        təmin edir.
      </p>
    </div>
  );
}

/* ── PBKDF2 ────────────────────────────────────────────────────── */
function KdfPanel() {
  const [pw, setPw] = useState("istifadeci-parolu");
  const [salt, setSalt] = useState("techvault-random-salt");
  const [iter, setIter] = useState(200000);
  const [out, setOut] = useState("");

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs text-muted">Parol</label>
          <input className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted">Salt</label>
          <input
            className={inputCls}
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted">İterasiya sayı</label>
          <input
            type="number"
            className={inputCls}
            value={iter}
            onChange={(e) => setIter(Number(e.target.value) || 1)}
          />
        </div>
      </div>
      <button
        className={`${btnCls} mt-3`}
        onClick={async () => setOut(await pbkdf2Hex(pw, salt, iter))}
      >
        256-bit açar törə
      </button>
      {out && <Out label="Törədilmiş açar (hex)" value={out} />}
      <p className="mt-3 text-xs text-muted">
        İterasiya sayı artdıqca brute-force cəhdləri xətti deyil, bahalaşır.
        Real serverdə parol saxlama üçün PBKDF2-dən daha güclü olan Argon2id
        istifadə edilir.
      </p>
    </div>
  );
}

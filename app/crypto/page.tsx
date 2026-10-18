import type { Metadata } from "next";
import CryptoLab from "@/components/crypto-lab";
import Reveal from "@/components/reveal";

export const metadata: Metadata = {
  title: "Kripto laboratoriyası · AegisCloud",
  description:
    "AES-256-GCM, SHA-256, HMAC-SHA256, ECDSA və PBKDF2 nümunələri brauzerdə işləyir.",
};

const algos = [
  {
    n: "AES-256-GCM",
    type: "Simmetrik, AEAD",
    why: "Eyni açar həm şifrələyir, həm açır. GCM rejimi məxfiliklə yanaşı bütövlüyü də yoxlayır, ona görə kəsilmiş və ya dəyişdirilmiş şifrə mətn qəbul edilmir.",
    where: "Bazada saxlanan həssas sahələr, backup arxivləri, fayl şifrələmə.",
  },
  {
    n: "SHA-256 / SHA-512",
    type: "Hash funksiyası",
    why: "Birtərəfli funksiyadır, geri qaytarıla bilmir. Girişdə bir simvol dəyişsə, çıxış tamamilə fərqli olur.",
    where: "Fayl bütövlüyü, sessiya tokenlərinin hash-lənməsi, Merkle ağacları.",
  },
  {
    n: "HMAC-SHA256",
    type: "Açar əsaslı MAC",
    why: "Açar olmadan düzgün MAC yaratmaq mümkün deyil, ona görə yoxlama mesajın mənbəyini də təsdiqləyir.",
    where: "API imzaları, sessiya bütövlüyü, CSRF token müqayisəsi.",
  },
  {
    n: "ECDSA P-256",
    type: "Asimmetrik imza",
    why: "Private açar imzalayır, public açar yoxlayır. Kiçik açar ölçüsü ilə yüksək təhlükəsizlik verir.",
    where: "Audit qeydlərinin imzalanması, fayl yoxlaması, TLS sertifikatları.",
  },
  {
    n: "PBKDF2",
    type: "Açar törəmə (KDF)",
    why: "Parolu birbaşa açar kimi işlətmək əvəzinə, çoxlu iterasiya ilə ondan güclü açar törədir.",
    where: "Şifrələmə açarının paroldan alınması, parol hash-i (serverdə Argon2id).",
  },
  {
    n: "TLS 1.3",
    type: "Transport protokolu",
    why: "Handshake zamanı ECDHE ilə sessiya açarı razılaşdırılır, bu da forward secrecy verir.",
    where: "Brauzerlə server arası bütün trafik (HTTPS).",
  },
];

export default function CryptoPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <span className="text-xs font-semibold uppercase tracking-wider text-accent-2">
        kriptoqrafiya
      </span>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Kripto laboratoriyası
      </h1>
      <p className="mt-3 max-w-3xl text-muted">
        Aşağıdaki alətlər brauzerin öz{" "}
        <span className="mono text-foreground">crypto.subtle</span> API-si ilə
        işləyir. Hər alqoritmi sınaya, nəticəni görə və səhv halda sistemin nəyi
        rədd etdiyini müşahidə edə bilərsiniz.
      </p>

      <Reveal className="mt-8">
        <CryptoLab />
      </Reveal>

      <h2 className="mt-14 text-xl font-semibold">Alqoritmlər: nə, niyə, harada</h2>
      <div className="mt-4">
        {algos.map((a, i) => (
          <Reveal key={a.n} delay={i * 40}>
            <div className="grid gap-3 border-t border-line py-6 md:grid-cols-[220px_1fr]">
              <div>
                <h3 className="mono text-sm font-semibold text-accent">{a.n}</h3>
                <p className="mono mt-1 text-[11px] text-muted">{a.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted">{a.why}</p>
                <p className="mt-2 text-sm text-muted">
                  <span className="text-foreground">İstifadə yeri: </span>
                  {a.where}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <h2 className="mt-14 text-xl font-semibold">Açar idarəsi</h2>
      <div className="mt-4 max-w-3xl space-y-3 border-t border-line pt-6 text-sm text-muted">
        <p>
          <span className="text-foreground">Simmetrik açar: </span>
          Şifrələmə açarı KMS və ya HSM kimi xidmətdə saxlanılır, heç vaxt koda yazılmır.
          Məlumat zərf (envelope) sxemi ilə şifrələnir. Əvvəlcə məlumat açarı ilə
          fayl şifrələnir, sonra həmin açar KMS-dəki əsas açar ilə qorunur.
        </p>
        <p>
          <span className="text-foreground">Asimmetrik açar cütü: </span>
          imza üçün private açar server tərəfdə qalır, public açar isə sərbəst
          yayıla bilər. AegisCloud public açarı yalnız yoxlama üçün istifadə edir.
        </p>
        <p>
          <span className="text-foreground">Rotasiya: </span>
          açarlar müəyyən müddətdən sonra dəyişdirilir. Köhnə açarlar yalnız köhnə
          məlumatı oxumaq üçün saxlanılır.
        </p>
      </div>

      <div className="mt-8 max-w-3xl border-l-2 border-accent/60 pl-4 text-xs text-muted">
        Bu laboratoriya təhsil üçündür. İstehsalda parol hash-i üçün Argon2id,
        açar idarəsi üçün isə HSM və ya KMS istifadə edilməlidir.
      </div>
    </div>
  );
}

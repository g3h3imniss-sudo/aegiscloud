const items = [
  "AES-256-GCM",
  "ISO/IEC 27001:2022",
  "Ed25519",
  "RFC 8032",
  "SHA-256 Merkle",
  "RFC 6962",
  "TLS 1.3",
  "NIST SP 800-38D",
  "Argon2id",
  "least privilege",
  "KMS envelope",
  "CloudTrail",
  "OWASP",
  "least privilege",
  "PBKDF2",
  "zero trust",
];

export default function Marquee() {
  return (
    <div className="overflow-hidden border-b border-line bg-panel/40 py-4">
      <div className="anim-marquee flex w-max gap-8">
        {[...items, ...items].map((it, i) => (
          <span key={i} className="mono whitespace-nowrap text-xs text-muted">
            <span className="text-accent-2">/</span> {it}
          </span>
        ))}
      </div>
    </div>
  );
}

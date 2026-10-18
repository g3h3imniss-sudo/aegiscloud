export default function ThreatRadar() {
  const blips = [
    { top: "28%", left: "64%", d: "0s" },
    { top: "58%", left: "38%", d: "0.7s" },
    { top: "70%", left: "66%", d: "1.4s" },
    { top: "40%", left: "30%", d: "2.1s" },
    { top: "19%", left: "44%", d: "1.1s" },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[380px]">
      <div className="absolute inset-0 rounded-full border border-line" />
      <div className="absolute inset-[12%] rounded-full border border-line" />
      <div className="absolute inset-[28%] rounded-full border border-line" />
      <div className="absolute inset-[44%] rounded-full border border-line" />

      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line/70" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-line/70" />

      <div className="radar-sweep spin-fast absolute inset-0" />

      {blips.map((b, i) => (
        <span
          key={i}
          className="pulse-dot absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
          style={{ top: b.top, left: b.left, animationDelay: b.d }}
        />
      ))}

      <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
      <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/40 spin-rev" />
    </div>
  );
}

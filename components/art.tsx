// Original, locally-defined SVG artwork. Nothing here loads from the network.
import { useId } from "react";

export function Logo({ size = 44 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF8A4C" /><stop offset="1" stopColor="#FF4A12" /></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill={`url(#${id})`} />
      <path d="M8 25h7l3-9 5 16 4-11 2 4h11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Warm sunrise-over-mountains header decoration. Fades into the page background. */
export function Mountains({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 390 250" preserveAspectRatio="xMaxYMin slice" aria-hidden>
      <defs>
        <radialGradient id={`s${id}`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#FFC08A" /><stop offset="1" stopColor="#FF8A4C" /></radialGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CF8F72" stopOpacity=".95" /><stop offset="1" stopColor="#F6D9C4" stopOpacity="0" /></linearGradient>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A85F45" stopOpacity="1" /><stop offset="1" stopColor="#F0C9B0" stopOpacity="0" /></linearGradient>
        <linearGradient id={`m${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".85" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <filter id={`bl${id}`} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id={`sg${id}`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <circle cx="268" cy="82" r="58" fill="#FFA45E" opacity=".45" filter={`url(#sg${id})`} />
      <circle cx="268" cy="82" r="42" fill={`url(#s${id})`} />
      <path d="M96 190 L150 142 L182 160 L246 104 L296 146 L336 120 L390 158 V250 H96Z" fill={`url(#b${id})`} />
      <path d="M150 206 L212 150 L246 176 L304 128 L346 170 L390 150 V250 H150Z" fill={`url(#f${id})`} />
      <path d="M212 150 L226 164 L218 176 L246 176 L232 160Z M304 128 L318 146 L306 156 L346 170 L322 150Z" fill="#fff" opacity=".18" />
      <ellipse cx="250" cy="196" rx="170" ry="16" fill={`url(#m${id})`} filter={`url(#bl${id})`} />
      <ellipse cx="330" cy="222" rx="140" ry="14" fill="#fff" opacity=".8" filter={`url(#bl${id})`} />
    </svg>
  );
}

function Dumbbell({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x="-34" y="-5" width="68" height="10" rx="4" fill="#4A4A4F" />
      <rect x="-34" y="-3" width="68" height="2.5" fill="#8A8A90" opacity=".6" />
      {[-1, 1].map(k => (
        <g key={k} transform={`scale(${k} 1)`}>
          <rect x="22" y="-23" width="14" height="46" rx="6" fill="#1B1B1D" stroke="#FF8A4C" strokeOpacity=".55" strokeWidth="1.2" />
          <rect x="36" y="-17" width="9" height="34" rx="4" fill="#232326" stroke="#FF8A4C" strokeOpacity=".35" strokeWidth="1" />
          <rect x="25" y="-20" width="3" height="40" rx="1.5" fill="#FFB27A" opacity=".5" />
        </g>
      ))}
    </g>
  );
}

/** Dark gym scene with warm orange light and dumbbells, sits on the right half of the hero card. */
export function HeroArt({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 360 240" preserveAspectRatio="xMaxYMax slice" aria-hidden>
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1A1411" /><stop offset=".6" stopColor="#2A1A10" /><stop offset="1" stopColor="#4A2410" /></linearGradient>
        <linearGradient id={`beam${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FF7A2E" stopOpacity="0" /><stop offset=".55" stopColor="#FF9A55" stopOpacity=".8" /><stop offset="1" stopColor="#FFD2A8" stopOpacity=".9" /></linearGradient>
        <radialGradient id={`glow${id}`} cx=".85" cy=".2" r=".7"><stop offset="0" stopColor="#FF8A3D" stopOpacity=".65" /><stop offset="1" stopColor="#FF8A3D" stopOpacity="0" /></radialGradient>
        <linearGradient id={`floor${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A2417" /><stop offset="1" stopColor="#120D0A" /></linearGradient>
        <filter id={`bl${id}`}><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <rect width="360" height="240" fill={`url(#bg${id})`} />
      <rect width="360" height="240" fill={`url(#glow${id})`} />
      <polygon points="120,40 360,-10 360,28 150,70" fill={`url(#beam${id})`} filter={`url(#bl${id})`} opacity=".9" />
      <polygon points="150,62 360,16 360,36 170,80" fill="#FFE3C8" opacity=".55" />
      <path d="M0 150 L360 120 V240 H0Z" fill={`url(#floor${id})`} />
      {[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M${-40 + i * 80} 240 L${60 + i * 60} 124`} stroke="#FF9A55" strokeOpacity=".08" strokeWidth="2" />)}
      {[150, 175, 205].map((y, i) => <path key={y} d={`M0 ${y} L360 ${y - 28 - i * 4}`} stroke="#FF9A55" strokeOpacity=".07" strokeWidth="2" />)}
      <ellipse cx="270" cy="196" rx="95" ry="12" fill="#FF7A2E" opacity=".25" filter={`url(#bl${id})`} />
      <Dumbbell x={296} y={150} rot={-14} s={1.25} />
      <Dumbbell x={262} y={204} rot={-8} s={1.35} />
      <Dumbbell x={335} y={214} rot={-6} s={1.1} />
    </svg>
  );
}

/* ---------------- Exercise thumbnails ---------------- */
type ExKind = "legcurl" | "calf" | "crunch" | "abduct" | "barbell" | "dumbbell" | "cable" | "legpress" | "machine" | "cardio" | "bodyweight";
export function exKind(name: string, equipment = ""): ExKind {
  const n = `${name} ${equipment}`.toLowerCase();
  if (/leg press/.test(n)) return "legpress";
  if (/leg curl|hamstring curl/.test(n)) return "legcurl";
  if (/calf/.test(n)) return "calf";
  if (/abdominal|crunch/.test(n)) return "crunch";
  if (/abduction|adduction/.test(n)) return "abduct";
  if (/treadmill|cycling|bike|cardio/.test(n)) return "cardio";
  if (/leg raise|plank|push.?up/.test(n) && !/machine/.test(n)) return "bodyweight";
  if (/cable|pushdown|pulldown|seated row|triceps extension|fly/.test(n) && !/machine/.test(n)) return "cable";
  if (/dumbbell|curl|raise|one arm|hammer|wrist/.test(n) && !/machine|leg curl|seated leg/.test(n)) return "dumbbell";
  if (/bench|barbell|deadlift|thrust|squat bar|t-bar/.test(n) && !/machine/.test(n)) return "barbell";
  return "machine";
}
const L = "#E4DFD8", A = "#FF8A4C";
export function ExThumb({ name, equipment, className = "" }: { name: string; equipment?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const k = exKind(name, equipment);
  return (
    <svg className={className} viewBox="0 0 64 56" role="img" aria-label={`${name} illustration`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#55535A" /><stop offset="1" stopColor="#222127" /></linearGradient></defs>
      <rect width="64" height="56" fill={`url(#${id})`} />
      <rect y="46" width="64" height="10" fill="#000" opacity=".25" />
      {k === "barbell" && <g><rect x="4" y="27" width="56" height="3" rx="1.5" fill={L} />
        {[0, 1].map(s => <g key={s} transform={s ? "translate(64 0) scale(-1 1)" : ""}><rect x="9" y="14" width="6" height="29" rx="2" fill="#2B2A30" stroke={A} strokeWidth="1" /><rect x="15" y="18" width="4" height="21" rx="1.5" fill="#35343A" stroke={L} strokeOpacity=".5" strokeWidth=".8" /></g>)}
        <rect x="26" y="40" width="12" height="6" rx="2" fill={L} opacity=".5" /></g>}
      {k === "dumbbell" && <g>{[[-14, 20], [10, 36]].map(([dx, y], i) => <g key={i} transform={`translate(${32 + dx / 2} ${y}) rotate(-18)`}><rect x="-14" y="-2" width="28" height="4" rx="2" fill={L} />{[-1, 1].map(s => <rect key={s} x={s * 12 - 3.5} y="-9" width="7" height="18" rx="2.5" fill="#2B2A30" stroke={A} strokeWidth="1" />)}</g>)}</g>}
      {k === "cable" && <g><rect x="8" y="6" width="14" height="40" rx="2" fill="#2B2A30" stroke={L} strokeOpacity=".5" />{[12, 18, 24, 30, 36].map(y => <rect key={y} x="11" y={y} width="8" height="3" rx="1" fill={A} opacity={y < 26 ? 1 : .5} />)}
        <circle cx="15" cy="9" r="2.4" fill={L} /><path d="M17 9 L48 22" stroke={L} strokeWidth="1.4" /><rect x="46" y="19" width="10" height="4" rx="2" transform="rotate(28 51 21)" fill={A} /></g>}
      {k === "legpress" && <g><path d="M8 44 L50 12" stroke={L} strokeWidth="3" strokeLinecap="round" /><rect x="40" y="8" width="14" height="22" rx="3" transform="rotate(35 47 19)" fill="#2B2A30" stroke={A} strokeWidth="1.2" />
        <rect x="9" y="30" width="22" height="7" rx="3" fill="#35343A" stroke={L} strokeOpacity=".5" /><path d="M12 44 H40" stroke={L} strokeOpacity=".6" strokeWidth="2" /></g>}
      {k === "machine" && <g><rect x="12" y="8" width="8" height="38" rx="2" fill="#2B2A30" stroke={L} strokeOpacity=".5" />{[13, 19, 25].map(y => <rect key={y} x="14" y={y} width="4" height="3" rx="1" fill={A} />)}
        <rect x="24" y="26" width="22" height="7" rx="3.5" fill="#35343A" stroke={L} strokeOpacity=".6" /><rect x="40" y="10" width="6" height="18" rx="3" fill="#35343A" stroke={L} strokeOpacity=".6" /><path d="M30 33 V44 M44 33 V44" stroke={L} strokeOpacity=".6" strokeWidth="2" /><circle cx="22" cy="20" r="3" fill={A} /></g>}
      {k === "legcurl" && <g><rect x="8" y="30" width="30" height="7" rx="3.5" fill="#35343A" stroke={L} strokeOpacity=".6" /><rect x="8" y="14" width="7" height="18" rx="3" fill="#35343A" stroke={L} strokeOpacity=".6" /><path d="M38 33 L52 42" stroke={L} strokeWidth="3" strokeLinecap="round" /><circle cx="52" cy="42" r="4" fill="#2B2A30" stroke={A} strokeWidth="1.4" /><path d="M14 37 V46 M34 37 V46" stroke={L} strokeOpacity=".6" strokeWidth="2" /></g>}
      {k === "calf" && <g><rect x="10" y="38" width="30" height="5" rx="2" fill="#35343A" stroke={L} strokeOpacity=".6" /><rect x="14" y="14" width="22" height="7" rx="3.5" fill="#2B2A30" stroke={A} strokeWidth="1.2" /><path d="M16 21 V38 M34 21 V38" stroke={L} strokeOpacity=".6" strokeWidth="2" /><rect x="46" y="8" width="8" height="38" rx="2" fill="#2B2A30" stroke={L} strokeOpacity=".5" />{[13, 19, 25].map(y => <rect key={y} x="48" y={y} width="4" height="3" rx="1" fill={A} />)}</g>}
      {k === "crunch" && <g><path d="M12 42 Q14 26 30 22" fill="none" stroke={L} strokeWidth="5" strokeLinecap="round" /><rect x="30" y="10" width="14" height="10" rx="4" fill="#2B2A30" stroke={A} strokeWidth="1.3" transform="rotate(20 37 15)" /><rect x="10" y="40" width="30" height="5" rx="2" fill="#35343A" stroke={L} strokeOpacity=".6" /><rect x="48" y="8" width="8" height="38" rx="2" fill="#2B2A30" stroke={L} strokeOpacity=".5" /></g>}
      {k === "abduct" && <g><rect x="22" y="26" width="20" height="8" rx="4" fill="#35343A" stroke={L} strokeOpacity=".6" /><rect x="26" y="10" width="12" height="18" rx="4" fill="#35343A" stroke={L} strokeOpacity=".6" /><rect x="10" y="22" width="7" height="18" rx="3" fill="#2B2A30" stroke={A} strokeWidth="1.4" /><rect x="47" y="22" width="7" height="18" rx="3" fill="#2B2A30" stroke={A} strokeWidth="1.4" /><path d="M20 44 H44 M8 32 h-0 M17 31 l-5 0 M47 31 l5 0" stroke={A} strokeWidth="1.4" strokeLinecap="round" /></g>}
      {k === "cardio" && <g><path d="M8 40 L52 36 L56 42 L10 46Z" fill="#2B2A30" stroke={L} strokeOpacity=".6" /><path d="M46 36 L40 10 H34" stroke={L} strokeWidth="2.4" strokeLinecap="round" fill="none" /><rect x="28" y="6" width="12" height="7" rx="2" fill="#35343A" stroke={A} /></g>}
      {k === "bodyweight" && <g><rect x="6" y="38" width="52" height="6" rx="3" fill="#2B2A30" stroke={A} strokeOpacity=".8" /><path d="M16 36 Q32 8 48 36" fill="none" stroke={L} strokeWidth="3" strokeLinecap="round" /><circle cx="16" cy="36" r="3" fill={A} /><circle cx="48" cy="36" r="3" fill={A} /></g>}
    </svg>
  );
}

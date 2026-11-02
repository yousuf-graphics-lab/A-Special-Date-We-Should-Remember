'use client';

import { clsx } from 'clsx';

type Palette = 'blush' | 'rose' | 'deep' | 'red' | 'cream';

const GRADIENTS: Record<Palette, { fill: string; edge: string; centre: string }> = {
  blush: { fill: 'url(#petalBlush)', edge: 'rgba(178,108,124,0.45)', centre: '#C07C8C' },
  rose: { fill: 'url(#petalRose)', edge: 'rgba(150,74,92,0.5)', centre: '#A9536A' },
  deep: { fill: 'url(#petalDeep)', edge: 'rgba(104,38,54,0.55)', centre: '#7C2D3E' },
  red: { fill: 'url(#petalRed)', edge: 'rgba(92,22,36,0.6)', centre: '#5E1726' },
  cream: { fill: 'url(#petalCream)', edge: 'rgba(196,168,132,0.5)', centre: '#D8C4A4' },
};

function Rose({
  cx,
  cy,
  radius,
  palette,
  turn = 0,
}: {
  cx: number;
  cy: number;
  radius: number;
  palette: Palette;
  turn?: number;
}) {
  const { fill, edge, centre } = GRADIENTS[palette];
  const outer = Array.from({ length: 6 }, (_, i) => i);
  const middle = Array.from({ length: 5 }, (_, i) => i);
  const inner = Array.from({ length: 4 }, (_, i) => i);

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <ellipse cx="2" cy={radius * 0.5} rx={radius * 0.95} ry={radius * 0.5} fill="rgba(90,40,50,0.16)" />
      <g transform={`rotate(${turn})`}>
        {outer.map((i) => {
          const angle = (360 / outer.length) * i;
          const distance = radius * 0.62;
          const rad = (angle * Math.PI) / 180;
          return (
            <ellipse
              key={`o-${i}`}
              cx={Math.cos(rad) * distance}
              cy={Math.sin(rad) * distance * 0.82}
              rx={radius * 0.56}
              ry={radius * 0.42}
              transform={`rotate(${angle} ${Math.cos(rad) * distance} ${Math.sin(rad) * distance * 0.82})`}
              fill={fill}
              stroke={edge}
              strokeWidth={0.5}
            />
          );
        })}
        {middle.map((i) => {
          const angle = (360 / middle.length) * i + 32 + turn * 0.5;
          const distance = radius * 0.36;
          const rad = (angle * Math.PI) / 180;
          return (
            <ellipse
              key={`m-${i}`}
              cx={Math.cos(rad) * distance}
              cy={Math.sin(rad) * distance * 0.8}
              rx={radius * 0.4}
              ry={radius * 0.3}
              transform={`rotate(${angle + 14} ${Math.cos(rad) * distance} ${Math.sin(rad) * distance * 0.8})`}
              fill={fill}
              stroke={edge}
              strokeWidth={0.45}
              opacity={0.97}
            />
          );
        })}
        {inner.map((i) => {
          const angle = (360 / inner.length) * i + 68;
          const distance = radius * 0.16;
          const rad = (angle * Math.PI) / 180;
          return (
            <ellipse
              key={`i-${i}`}
              cx={Math.cos(rad) * distance}
              cy={Math.sin(rad) * distance * 0.8}
              rx={radius * 0.26}
              ry={radius * 0.19}
              transform={`rotate(${angle + 24} ${Math.cos(rad) * distance} ${Math.sin(rad) * distance * 0.8})`}
              fill={fill}
              stroke={edge}
              strokeWidth={0.4}
            />
          );
        })}
      </g>
      <circle r={radius * 0.15} fill={centre} opacity="0.9" />
      <circle r={radius * 0.075} fill="rgba(255,244,238,0.5)" />
    </g>
  );
}

function Leaf({ x, y, rotate, scale = 1 }: { x: number; y: number; rotate: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path
        d="M0 0C12 -16 34 -22 46 -11C35 5 14 11 0 0Z"
        fill="url(#leafGreen)"
        stroke="rgba(52,72,48,0.35)"
        strokeWidth="0.6"
      />
      <path d="M2 -1C16 -5 32 -9 44 -11" fill="none" stroke="rgba(238,246,232,0.35)" strokeWidth="0.7" />
    </g>
  );
}

function FillerFlower({ x, y, scale = 1, rotate = 0 }: { x: number; y: number; scale?: number; rotate?: number }) {
  const petals = Array.from({ length: 5 }, (_, i) => i);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rotate})`}>
      {petals.map((i) => {
        const angle = (360 / petals.length) * i;
        const rad = (angle * Math.PI) / 180;
        return (
          <ellipse
            key={i}
            cx={Math.cos(rad) * 6.4}
            cy={Math.sin(rad) * 6.4}
            rx={5.4}
            ry={4}
            transform={`rotate(${angle} ${Math.cos(rad) * 6.4} ${Math.sin(rad) * 6.4})`}
            fill="url(#petalCream)"
            stroke="rgba(190,158,124,0.4)"
            strokeWidth="0.4"
          />
        );
      })}
      <circle r="2.4" fill="#E6C98F" />
    </g>
  );
}

function Sprig({ x, y, rotate, scale = 1, opacity = 0.9 }: { x: number; y: number; rotate: number; scale?: number; opacity?: number }) {
  const dots = [
    [0, -10], [10, -20], [-8, -22], [18, -6], [-16, -8], [4, -32], [-24, -20], [26, -24],
  ];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
      <path d="M0 0C2 -16 6 -30 12 -44" fill="none" stroke="rgba(96,116,88,0.65)" strokeWidth="1" />
      {dots.map(([dx, dy], i) => (
        <circle key={i} cx={dx * 0.5} cy={dy} r={i % 3 === 0 ? 2 : 1.4} fill="rgba(251,246,236,0.92)" />
      ))}
    </g>
  );
}

/**
 * A hand-drawn bouquet: blush and red roses, cream filler flowers, greenery and
 * soft wrapping paper with a wine ribbon. Entirely vector, so it stays crisp on
 * every screen and can bloom gently.
 */
export function BouquetArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 580"
      className={clsx('h-auto w-full', className)}
      role="img"
      aria-label="A bouquet of blush and red roses with cream flowers and greenery"
    >
      <defs>
        <radialGradient id="petalBlush" cx="36%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#FBE3E6" />
          <stop offset="46%" stopColor="#F0C3CB" />
          <stop offset="82%" stopColor="#DDA0AE" />
          <stop offset="100%" stopColor="#C68496" />
        </radialGradient>
        <radialGradient id="petalRose" cx="36%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#F3C6CE" />
          <stop offset="45%" stopColor="#DB9BA9" />
          <stop offset="80%" stopColor="#BC7385" />
          <stop offset="100%" stopColor="#A05367" />
        </radialGradient>
        <radialGradient id="petalDeep" cx="36%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#DE9BA7" />
          <stop offset="45%" stopColor="#B76A7D" />
          <stop offset="80%" stopColor="#8E3F53" />
          <stop offset="100%" stopColor="#6F2637" />
        </radialGradient>
        <radialGradient id="petalRed" cx="36%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#C97483" />
          <stop offset="42%" stopColor="#A34051" />
          <stop offset="78%" stopColor="#7B2434" />
          <stop offset="100%" stopColor="#591325" />
        </radialGradient>
        <radialGradient id="petalCream" cx="38%" cy="30%" r="76%">
          <stop offset="0%" stopColor="#FFFCF6" />
          <stop offset="55%" stopColor="#FBF1E1" />
          <stop offset="85%" stopColor="#EFDEC7" />
          <stop offset="100%" stopColor="#E0C9AC" />
        </radialGradient>
        <linearGradient id="leafGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8DA47F" />
          <stop offset="55%" stopColor="#6B8360" />
          <stop offset="100%" stopColor="#4C6247" />
        </linearGradient>
        <linearGradient id="wrapBack" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#F6E4D6" />
          <stop offset="55%" stopColor="#EED3C1" />
          <stop offset="100%" stopColor="#DCB9A4" />
        </linearGradient>
        <linearGradient id="wrapFront" x1="0.2" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#FCF1E7" />
          <stop offset="55%" stopColor="#F6E5D6" />
          <stop offset="100%" stopColor="#E7C9B6" />
        </linearGradient>
        <linearGradient id="ribbonWine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A9536A" />
          <stop offset="50%" stopColor="#8A3A4F" />
          <stop offset="100%" stopColor="#621F30" />
        </linearGradient>
        <radialGradient id="bouquetGlow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="rgba(255,244,238,0.95)" />
          <stop offset="60%" stopColor="rgba(246,221,225,0.45)" />
          <stop offset="100%" stopColor="rgba(246,221,225,0)" />
        </radialGradient>
        <filter id="bouquetShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#6E2A3A" floodOpacity="0.22" />
        </filter>
      </defs>

      <ellipse cx="260" cy="290" rx="250" ry="250" fill="url(#bouquetGlow)" />

      <g filter="url(#bouquetShadow)" className="animate-sway motion-reduce:animate-none" style={{ transformOrigin: '260px 470px' }}>
        {/* stems */}
        <g opacity="0.85">
          {[
            [258, 200, 250, 400], [196, 226, 226, 400], [320, 224, 292, 400],
            [156, 268, 214, 402], [354, 262, 300, 402], [226, 276, 240, 404],
          ].map(([x1, y1, x2, y2], i) => (
            <path
              key={i}
              d={`M${x1} ${y1} C${x1 + (i % 2 ? -8 : 8)} ${y1 + 60} ${x2 + (i % 2 ? 6 : -6)} ${y2 - 70} ${x2} ${y2}`}
              fill="none"
              stroke="#6E8163"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* greenery behind */}
        <g opacity="0.95">
          <Leaf x={118} y={300} rotate={-32} scale={1.15} />
          <Leaf x={402} y={292} rotate={196} scale={1.1} />
          <Leaf x={148} y={352} rotate={-6} scale={0.92} />
          <Leaf x={374} y={344} rotate={178} scale={0.95} />
          <Leaf x={214} y={158} rotate={-108} scale={0.8} />
          <Leaf x={308} y={154} rotate={-72} scale={0.78} />
          <Leaf x={96} y={248} rotate={-48} scale={0.85} />
          <Leaf x={424} y={240} rotate={212} scale={0.85} />
          <Leaf x={186} y={330} rotate={18} scale={0.7} />
          <Leaf x={338} y={326} rotate={162} scale={0.72} />
          <Leaf x={104} y={316} rotate={-64} scale={0.66} />
          <Leaf x={418} y={308} rotate={246} scale={0.66} />
          <Leaf x={252} y={140} rotate={-96} scale={0.62} />
        </g>

        <Sprig x={132} y={272} rotate={-26} scale={1} opacity={0.85} />
        <Sprig x={392} y={264} rotate={26} scale={0.95} opacity={0.8} />
        <Sprig x={228} y={158} rotate={-8} scale={0.8} opacity={0.7} />

        {/* wrap */}
        <path
          d="M136 300C150 386 198 474 258 524C320 472 368 384 384 300C352 330 312 344 260 344C208 344 168 330 136 300Z"
          fill="url(#wrapBack)"
          stroke="rgba(180,142,116,0.35)"
          strokeWidth="1"
        />
        <path
          d="M136 300C168 322 210 334 260 334C310 334 352 322 384 300C372 356 344 414 306 462C288 484 270 506 260 524C250 506 232 484 214 462C176 414 148 356 136 300Z"
          fill="url(#wrapFront)"
          opacity="0.96"
        />
        <path d="M260 334C258 396 250 468 260 524" fill="none" stroke="rgba(178,138,112,0.28)" strokeWidth="1.2" />
        <path d="M196 330C206 392 226 466 244 512" fill="none" stroke="rgba(178,138,112,0.2)" strokeWidth="1" />
        <path d="M324 330C314 392 294 466 276 512" fill="none" stroke="rgba(178,138,112,0.2)" strokeWidth="1" />
        <path
          d="M136 300C168 322 210 334 260 334C310 334 352 322 384 300"
          fill="none"
          stroke="rgba(255,250,244,0.65)"
          strokeWidth="1.6"
        />
        <path
          d="M138 302C158 326 176 340 196 348C214 355 236 358 260 358C284 358 306 355 324 348C344 340 362 326 382 302C360 318 330 326 300 328C280 330 268 330 260 330C252 330 240 330 220 328C190 326 160 318 138 302Z"
          fill="rgba(255,250,245,0.5)"
          opacity="0.85"
        />
        <path
          d="M258 524C268 508 282 490 306 462"
          fill="none"
          stroke="rgba(199,169,123,0.4)"
          strokeWidth="1.4"
        />

        {/* flowers */}
        <Rose cx={258} cy={196} radius={40} palette="rose" turn={12} />
        <Rose cx={196} cy={228} radius={33} palette="blush" turn={-8} />
        <Rose cx={322} cy={226} radius={34} palette="deep" turn={22} />
        <Rose cx={156} cy={272} radius={27} palette="rose" turn={6} />
        <Rose cx={356} cy={264} radius={25} palette="blush" turn={-14} />
        <Rose cx={226} cy={280} radius={29} palette="red" turn={16} />
        <Rose cx={292} cy={286} radius={27} palette="rose" turn={-4} />
        <Rose cx={258} cy={244} radius={22} palette="cream" turn={26} />
        <Rose cx={334} cy={304} radius={21} palette="deep" turn={8} />
        <Rose cx={188} cy={310} radius={20} palette="blush" turn={-20} />
        <Rose cx={258} cy={318} radius={16} palette="red" turn={10} />

        {/* filler blossoms */}
        <FillerFlower x={170} y={240} scale={1.05} rotate={12} />
        <FillerFlower x={306} y={196} scale={0.95} rotate={-6} />
        <FillerFlower x={340} y={246} scale={0.9} rotate={20} />
        <FillerFlower x={212} y={190} scale={0.85} rotate={-18} />
        <FillerFlower x={146} y={300} scale={0.8} rotate={6} />
        <FillerFlower x={370} y={286} scale={0.78} rotate={-10} />
        <FillerFlower x={280} y={312} scale={0.7} rotate={14} />

        {/* ribbon */}
        <g transform="translate(260 400)">
          <path
            d="M-5 3C-24 -22 -58 -26 -66 -8C-73 9 -44 22 -6 8Z"
            fill="url(#ribbonWine)"
            stroke="rgba(48,12,22,0.3)"
            strokeWidth="0.7"
          />
          <path
            d="M5 3C24 -22 58 -26 66 -8C73 9 44 22 6 8Z"
            fill="url(#ribbonWine)"
            stroke="rgba(48,12,22,0.3)"
            strokeWidth="0.7"
          />
          <path d="M-18 -6C-34 -16 -52 -14 -58 -2" fill="none" stroke="rgba(255,214,210,0.22)" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M18 -6C34 -16 52 -14 58 -2" fill="none" stroke="rgba(255,214,210,0.22)" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M-6 3C-32 8 -52 14 -58 8" fill="none" stroke="rgba(48,12,22,0.28)" strokeWidth="1" />
          <path d="M6 3C32 8 52 14 58 8" fill="none" stroke="rgba(48,12,22,0.28)" strokeWidth="1" />
          <path
            d="M-3 6C-11 28 -22 50 -16 68C-13 77 -7 76 -6 66C-4 48 -2 26 -1 9Z"
            fill="url(#ribbonWine)"
            stroke="rgba(48,12,22,0.28)"
            strokeWidth="0.6"
          />
          <path
            d="M3 6C11 28 22 50 16 68C13 77 7 76 6 66C4 48 2 26 1 9Z"
            fill="url(#ribbonWine)"
            stroke="rgba(48,12,22,0.28)"
            strokeWidth="0.6"
            opacity="0.94"
          />
          <path d="M-6 14C-10 34 -14 54 -12 64" fill="none" stroke="rgba(255,214,210,0.16)" strokeWidth="1" />
          <ellipse cx="0" cy="3" rx="11.5" ry="9" fill="#9C465B" stroke="rgba(48,12,22,0.45)" strokeWidth="0.8" />
          <ellipse cx="-3" cy="0" rx="5" ry="3.4" fill="rgba(255,225,219,0.3)" />
        </g>
      </g>
    </svg>
  );
}

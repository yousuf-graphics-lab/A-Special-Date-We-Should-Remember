'use client';

import { clsx } from 'clsx';

function Firefly({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <circle cx={x} cy={y} r="1.8" fill="#F6E3C8" opacity="0.85">
      <animate attributeName="opacity" values="0.12;0.9;0.12" dur="6s" begin={`${delay}s`} repeatCount="indefinite" />
    </circle>
  );
}

function Tuft({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} stroke="#170C11" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.95">
      <path d="M0 0C-2 -8 -6 -11 -9 -13" />
      <path d="M2 0C2 -10 3 -14 1 -19" />
      <path d="M5 0C7 -8 11 -11 14 -12" />
    </g>
  );
}

/**
 * Two people sitting together under the evening sky — quiet, small and
 * silhouette-soft, so it never competes with the words on screen.
 */
export function CoupleArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 320"
      className={clsx('h-auto w-full', className)}
      role="img"
      aria-label="An illustration of a couple sitting together on a bench under the evening sky"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,240,220,0.5)" />
          <stop offset="50%" stopColor="rgba(247,222,196,0.16)" />
          <stop offset="100%" stopColor="rgba(247,222,196,0)" />
        </radialGradient>
        <radialGradient id="moonBody" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#FFFBF2" />
          <stop offset="58%" stopColor="#F9EBD3" />
          <stop offset="100%" stopColor="#EBD3B2" />
        </radialGradient>
        <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6B3446" />
          <stop offset="100%" stopColor="#512635" />
        </linearGradient>
        <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#30161F" />
          <stop offset="100%" stopColor="#1B0D13" />
        </linearGradient>
        <linearGradient id="figureFill" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#1A0D13" />
          <stop offset="100%" stopColor="#120A0E" />
        </linearGradient>
        <linearGradient id="benchFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B1B27" />
          <stop offset="100%" stopColor="#24101A" />
        </linearGradient>
        <filter id="moonBlur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      {/* moon and its halo */}
      <circle cx="486" cy="92" r="118" fill="url(#moonGlow)" />
      <circle cx="486" cy="92" r="54" fill="#F7E7CC" opacity="0.3" filter="url(#moonBlur)" />
      <circle cx="486" cy="92" r="43" fill="url(#moonBody)" />
      <circle cx="473" cy="80" r="7" fill="#E8CFAD" opacity="0.45" />
      <circle cx="497" cy="103" r="5" fill="#E8CFAD" opacity="0.32" />
      <circle cx="487" cy="71" r="3.2" fill="#E8CFAD" opacity="0.28" />

      {/* distant hills */}
      <path d="M0 250C78 230 138 240 204 254C268 268 328 250 396 242C458 235 532 250 640 256V320H0Z" fill="url(#hillFar)" />
      <path d="M0 286C92 268 152 280 228 291C306 302 376 284 456 282C540 280 590 293 640 299V320H0Z" fill="url(#hillNear)" />

      {/* bench */}
      <g fill="url(#benchFill)">
        <rect x="268" y="248" width="136" height="7" rx="3.5" />
        <rect x="270" y="208" width="132" height="5" rx="2.5" opacity="0.9" />
        <rect x="270" y="220" width="132" height="4" rx="2" opacity="0.7" />
        <rect x="277" y="208" width="5" height="44" rx="2.5" opacity="0.85" />
        <rect x="390" y="208" width="5" height="44" rx="2.5" opacity="0.85" />
        <rect x="280" y="255" width="5.5" height="34" rx="2.5" />
        <rect x="386" y="255" width="5.5" height="34" rx="2.5" />
      </g>

      {/* him — seated, leaning a little towards her */}
      <g fill="url(#figureFill)">
        <circle cx="307" cy="191" r="12.6" />
        <path d="M297 184C299 176 310 173 316 179C319 183 318 188 316 190C311 185 303 184 298 187Z" />
        <path d="M295 250C294 238 296 227 300 220C303 215 311 214 315 219C319 225 321 236 322 250Z" />
        <path d="M299 249C297 260 294 272 293 282C292 286 289 287 287 284C284 278 288 262 291 250Z" />
        <path d="M315 249C316 260 317 272 318 282C318 286 321 287 323 284C326 278 324 262 322 250Z" />
        <ellipse cx="288" cy="285" rx="6" ry="3" fill="#170C11" />
        <ellipse cx="322" cy="285" rx="6" ry="3" fill="#170C11" />
        <path
          d="M318 222C325 224 331 229 335 235"
          stroke="url(#figureFill)"
          strokeWidth="7.4"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* her — seated close, hair falling softly over her shoulders */}
      <g fill="url(#figureFill)">
        <path d="M339 205C337 194 343 186 352 186C361 186 366 194 364 206C368 222 369 238 368 252H336C334 238 336 221 339 205Z" />
        <circle cx="351" cy="194" r="11.2" />
        <path d="M341 199C344 190 358 189 361 197C363 202 362 208 360 211C359 203 355 199 351 199C347 199 343 202 342 207C340 205 340 202 341 199Z" opacity="0.85" />
        <path d="M349 243C347 254 344 267 343 280C342 284 345 285 347 282C350 275 352 262 353 250Z" />
        <path d="M362 243C363 254 365 267 366 280C366 284 363 285 361 282C358 275 357 262 356 250Z" />
        <ellipse cx="344" cy="283" rx="5" ry="2.8" fill="#170C11" />
        <ellipse cx="365" cy="283" rx="5" ry="2.8" fill="#170C11" />
        <path
          d="M339 226C334 230 330 234 328 238"
          stroke="url(#figureFill)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* their hands meet on the seat */}
      <circle cx="328" cy="238" r="4.2" fill="#170C11" />
      <path
        d="M298 184C304 180 311 181 314 186M341 187C347 185 353 187 356 192"
        fill="none"
        stroke="rgba(250,232,214,0.38)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* foreground grass */}
      <Tuft x={38} y={318} scale={1.5} />
      <Tuft x={76} y={320} scale={1.1} />
      <Tuft x={112} y={316} scale={0.9} />
      <Tuft x={604} y={318} scale={1.4} />
      <Tuft x={568} y={320} scale={1} />
      <Tuft x={632} y={314} scale={0.85} />

      <Firefly x={196} y={214} delay={0.4} />
      <Firefly x={241} y={266} delay={2.1} />
      <Firefly x={436} y={244} delay={1.2} />
      <Firefly x={522} y={196} delay={3.4} />
      <Firefly x={158} y={286} delay={2.8} />
    </svg>
  );
}

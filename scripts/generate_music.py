#!/usr/bin/env python3
"""
Generates the original background score for "For Samiya".

The piece — "A Quiet Promise" — is written and synthesized here from scratch,
so the site ships with music that is fully licensed for this project (no third
party track, no attribution requirements). Re-run with:

    python3 scripts/generate_music.py

Requires: numpy, lameenc  (pip install numpy lameenc)
"""

from __future__ import annotations

import math
import os

import lameenc
import numpy as np

SR = 44_100
SEED = 20071114
rng = np.random.default_rng(SEED)

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "audio")

# ---------------------------------------------------------------------------
# Note helpers
# ---------------------------------------------------------------------------
NOTE_BASE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def midi(name: str) -> float:
    """'F3' -> midi number, 'Bb2' -> 46, 'C#4' -> 61."""
    letter = name[0].upper()
    rest = name[1:]
    accidental = 0
    if rest[:1] in ("b", "#"):
        accidental = -1 if rest[0] == "b" else 1
        rest = rest[1:]
    octave = int(rest)
    return 12 * (octave + 1) + NOTE_BASE[letter] + accidental


def hz(m: float) -> float:
    return 440.0 * (2.0 ** ((m - 69) / 12.0))


# ---------------------------------------------------------------------------
# Piano voice
# ---------------------------------------------------------------------------
def piano_note(freq: float, dur: float, velocity: float, pan: float, detune_cents: float = 0.0):
    """Additive piano-like tone rendered into a stereo pair."""
    length = int((dur + 2.6) * SR)
    t = np.arange(length) / SR
    freq = freq * (2.0 ** (detune_cents / 1200.0))

    brightness = 0.55 + 0.45 * velocity
    release_tau = 1.15 + 2.4 * math.exp(-(freq - 60.0) / 420.0)

    tone = np.zeros(length)
    for n in range(1, 15):
        f = freq * n * (1.0 + 0.00035 * n * n)  # slight inharmonicity
        if f > 16_000:
            break
        amp = (1.0 / (n ** 1.62)) * math.exp(-n * (1.15 - 0.35 * brightness))
        if n > 1:
            amp *= 0.92 ** (n - 1)
        # Higher partials die faster, as on a real string.
        tau = release_tau / (1.0 + 0.30 * (n - 1))
        env = np.exp(-t / tau)
        # tiny chorus between two string detunings
        det = 0.0006 * n
        wave = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * (1 + det) * t + 0.7 * n)
        tone += amp * wave * env

    # Hammer / felt noise at the attack
    attack_noise = rng.normal(0, 1, min(length, int(0.035 * SR)))
    n_attack = len(attack_noise)
    attack_noise *= np.exp(-np.arange(n_attack) / (0.0045 * SR))
    attack_noise *= 0.055 * velocity
    tone[:n_attack] += attack_noise

    # Amplitude envelope: fast soft attack, natural decay, damper on release
    attack = np.clip(t / 0.012, 0, 1) ** 1.6
    env = attack * np.exp(-t / release_tau)
    body_end = min(length, int(dur * SR))
    if body_end < length:
        fade = np.ones(length)
        rel_len = min(int(0.9 * SR), length - body_end)
        if rel_len > 0:
            fade[body_end:body_end + rel_len] = np.linspace(1, 0, rel_len) ** 2.2
            fade[body_end + rel_len:] = 0.0
        env *= fade
    tone *= env * velocity * 0.17

    # Gentle low pass to keep it warm
    kernel_len = 24
    kernel = np.hanning(kernel_len)
    kernel /= kernel.sum()
    tone = np.convolve(tone, kernel, mode="same")

    left = tone * math.sqrt(min(1.0, 1.0 - pan))
    right = tone * math.sqrt(min(1.0, 1.0 + pan))
    return left, right


def render_events(events, total_seconds: float):
    total = int(total_seconds * SR)
    dry = np.zeros((2, total))
    for ev in events:
        start = int(ev["start"] * SR)
        left, right = piano_note(
            ev["freq"], ev["dur"], ev["velocity"], ev["pan"], ev.get("detune", 0.0)
        )
        end = min(total, start + len(left))
        if end <= start:
            continue
        dry[0, start:end] += left[: end - start]
        dry[1, start:end] += right[: end - start]
    return dry


# ---------------------------------------------------------------------------
# Reverb (overlap-add FFT convolution with a synthetic hall impulse)
# ---------------------------------------------------------------------------
def make_impulse(seconds: float = 3.1, decay: float = 1.55):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n))
    for ch in range(2):
        noise = rng.normal(0, 1, n)
        env = np.exp(-t / (seconds / decay))
        # soften early highs
        ir[ch] = noise * env
        ir[ch] *= np.clip(t / 0.012, 0, 1)  # pre-delay-ish fade in
    # a couple of early reflections
    for delay, gain in ((0.019, 0.4), (0.031, 0.3), (0.047, 0.22), (0.071, 0.16)):
        idx = int(delay * SR)
        ir[0, idx] += gain
        ir[1, idx] += gain * 0.92
    ir *= 0.09
    return ir


def convolve_stereo(signal: np.ndarray, ir: np.ndarray, block: int = 1 << 15):
    n = signal.shape[1]
    ir_len = ir.shape[1]
    fft_size = 1 << int(math.ceil(math.log2(block + ir_len)))
    ir_fft = np.fft.rfft(ir, fft_size, axis=1)
    out = np.zeros((2, n + ir_len))
    for ch in range(2):
        for start in range(0, n, block):
            seg = signal[ch, start:start + block]
            if len(seg) == 0:
                continue
            seg_fft = np.fft.rfft(seg, fft_size)
            conv = np.fft.irfft(seg_fft * ir_fft[ch], fft_size)
            out[ch, start:start + len(conv)] += conv[: len(out[ch]) - start]
    return out[:, :n]


# ---------------------------------------------------------------------------
# The score
# ---------------------------------------------------------------------------
BPM = 57
BEAT = 60.0 / BPM
BAR = 4 * BEAT

# (root, upper voicing) — F major, warm and simple.
CHORDS = {
    "Fmaj9": ("F2", ["A3", "C4", "E4", "G4"]),
    "Am7": ("A2", ["C4", "E4", "G4", "B4"]),
    "Bbmaj7": ("Bb2", ["D4", "F4", "A4", "C5"]),
    "C": ("C3", ["E4", "G4", "B4", "D5"]),
    "Csus": ("C3", ["F4", "G4", "C5", "E5"]),
    "Dm7": ("D3", ["F4", "A4", "C5", "E5"]),
    "F/A": ("A2", ["C4", "F4", "A4", "C5"]),
    "C/E": ("E2", ["G3", "C4", "E4", "G4"]),
    "Bbadd9": ("Bb2", ["D4", "F4", "G4", "C5"]),
}

# 40 bars: two verses, a lift, and a quiet close.
PROGRESSION = [
    # intro — space and light
    ("Fmaj9", 1), ("Fmaj9", 1), ("Am7", 1), ("Bbmaj7", 1),
    ("Fmaj9", 1), ("Csus", 1), ("C", 1), ("Fmaj9", 1),
    # verse
    ("Fmaj9", 2), ("Am7", 2), ("Bbmaj7", 2), ("C", 2),
    ("Dm7", 1), ("Bbmaj7", 1), ("F/A", 1), ("C/E", 1),
    # lift
    ("Bbmaj7", 2), ("C", 2), ("Am7", 2), ("Dm7", 2),
    ("Bbmaj7", 1), ("C", 1), ("Fmaj9", 2),
    # second verse, a little more movement
    ("Fmaj9", 2), ("Am7", 2), ("Bbmaj7", 2), ("C", 2),
    ("Dm7", 2), ("Bbmaj7", 1), ("C", 1), ("Fmaj9", 2),
    # outro — thinning out
    ("Fmaj9", 1), ("Bbmaj7", 1), ("F/A", 1), ("Csus", 1),
    ("Fmaj9", 1), ("Fmaj9", 1),
]

MELODY_INDEX = {  # bar -> list of (beat_offset, note)
    8: [(0, "C5"), (2.5, "D5")],
    9: [(0, "E5"), (2.5, "C5")],
    10: [(0, "D5"), (2, "F5")],
    11: [(0, "E5"), (3, "G5")],
    12: [(0, "F5"), (2, "E5")],
    13: [(0, "D5"), (2.5, "C5")],
    14: [(0, "A4"), (2.5, "C5")],
    15: [(0, "G4"), (2.5, "E4")],
    16: [(0, "F5"), (2, "G5")],
    17: [(0, "A5"), (2.5, "G5")],
    18: [(0, "E5"), (2, "C5")],
    19: [(0, "D5"), (2, "F5")],
    21: [(0, "G5"), (2.5, "E5")],
    23: [(0, "A4"), (2.5, "C5")],
    24: [(0, "F5"), (2, "A5")],
    25: [(0, "G5"), (2.5, "F5")],
    26: [(0, "E5"), (2, "D5")],
    27: [(0, "C5"), (2.5, "A4")],
    29: [(0, "A4"), (3, "F4")],
    32: [(0, "C5"), (2.5, "A4")],
    33: [(0, "G4")],
    34: [(0, "F4")],
}


def build_events():
    events = []
    bar_cursor = 0
    total_bars = len(PROGRESSION)
    for bar_index, (chord_name, weight) in enumerate(PROGRESSION):
        root_name, voicing = CHORDS[chord_name]
        bar_start = bar_index * BAR
        root = hz(midi(root_name))
        notes = [hz(midi(n)) for n in voicing]
        intensity = 0.0
        if 8 <= bar_index < 16:
            intensity = 0.25
        elif 16 <= bar_index < 23:
            intensity = 0.5
        elif 23 <= bar_index < 31:
            intensity = 0.35
        elif bar_index >= 31:
            intensity = 0.1
        base_velocity = 0.5 + 0.18 * intensity
        human = lambda: rng.normal(0, 0.045)

        # --- left hand: root (and fifth) with pedal-like sustain
        events.append(dict(start=bar_start + human(), freq=root, dur=BAR * 0.98,
                           velocity=base_velocity * 0.95, pan=-0.28, detune=human() * 3))
        if bar_index >= 8:
            fifth = hz(midi(root_name)) * 2
            events.append(dict(start=bar_start + 2 * BEAT + human() * 0.5, freq=fifth,
                               dur=BAR * 0.55, velocity=base_velocity * 0.62, pan=-0.2))

        # --- right hand: broken chord, gentle and uneven
        pattern = [0, 1, 2, 3, 2, 1, 0, 2] if bar_index >= 8 else [0, 2, 1, 3]
        step = (BAR / len(pattern))
        for i, note_i in enumerate(pattern):
            if bar_index >= 31 and i % 2 == 1:
                continue
            offset = i * step + rng.normal(0, 0.014)
            vel = base_velocity * (0.78 + 0.22 * math.sin(i * 1.1)) + human() * 0.7
            events.append(dict(
                start=bar_start + offset,
                freq=notes[note_i % len(notes)] * (2 if note_i >= len(notes) else 1),
                dur=step * (2.4 if i % 2 == 0 else 1.5),
                velocity=min(0.92, max(0.18, vel)),
                pan=0.05 + 0.25 * (note_i / max(1, len(notes) - 1)) - 0.12,
                detune=human() * 4,
            ))

        # --- melody
        for beat_offset, note_name in MELODY_INDEX.get(bar_index, []):
            events.append(dict(
                start=bar_start + beat_offset * BEAT + human(),
                freq=hz(midi(note_name)),
                dur=BEAT * 2.6,
                velocity=min(0.95, base_velocity * 1.16),
                pan=0.16,
                detune=human() * 3,
            ))
        bar_cursor += 1

    # final resolving chord, held
    end = total_bars * BAR
    for note_name, vel, pan in (("F2", 0.55, -0.3), ("C4", 0.42, -0.05),
                                ("F4", 0.4, 0.08), ("A4", 0.34, 0.18),
                                ("G4", 0.22, 0.24)):
        events.append(dict(start=end + 0.02, freq=hz(midi(note_name)), dur=7.5,
                           velocity=vel, pan=pan, detune=0.0))
    return events, end + 10.5


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("composing…")
    events, total_seconds = build_events()
    dry = render_events(events, total_seconds)
    print(f"  {len(events)} notes, {total_seconds:.1f}s")

    print("reverb…")
    ir = make_impulse()
    wet = convolve_stereo(dry, ir)
    mix = 0.72 * dry + 0.42 * wet

    # master: remove DC, gentle tilt, soft clip, normalise
    mix -= mix.mean(axis=1, keepdims=True)
    kernel = np.hanning(9)
    kernel /= kernel.sum()
    for ch in range(2):
        mix[ch] = np.convolve(mix[ch], kernel, mode="same")
    peak = np.max(np.abs(mix))
    mix = np.tanh(mix / max(peak, 1e-9) * 1.15) * 0.72
    mix *= 10 ** (-3.0 / 20)

    # subtle fade in / out so looping is gentle
    fade_in = int(1.6 * SR)
    fade_out = int(4.0 * SR)
    mix[:, :fade_in] *= np.linspace(0, 1, fade_in) ** 1.5
    mix[:, -fade_out:] *= np.linspace(1, 0, fade_out) ** 1.4

    pcm = np.clip(mix.T, -1, 1)
    pcm16 = (pcm * 32767).astype(np.int16)

    print("encoding…")
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(112)
    encoder.set_in_sample_rate(SR)
    encoder.set_channels(2)
    encoder.set_quality(2)
    mp3 = encoder.encode(pcm16.tobytes())
    mp3 += encoder.flush()

    path = os.path.join(OUT_DIR, "a-quiet-promise.mp3")
    with open(path, "wb") as fh:
        fh.write(bytearray(mp3))
    print(f"  wrote {path} ({len(mp3) / 1_048_576:.2f} MB)")

    # A small, soft chime for the unlocked lock.
    chime_len = 3.6
    chime_events = []
    for i, note in enumerate(("F4", "A4", "C5", "F5")):
        chime_events.append(dict(start=0.16 * i, freq=hz(midi(note)), dur=2.4,
                                 velocity=0.34 - 0.03 * i, pan=-0.1 + 0.07 * i))
    chime = render_events(chime_events, chime_len)
    chime_wet = convolve_stereo(chime, make_impulse(2.4, 1.3))
    chime_mix = chime * 0.55 + chime_wet * 0.5
    chime_mix /= max(1e-9, np.max(np.abs(chime_mix)))
    chime_mix *= 0.5
    fade = int(2.2 * SR)
    chime_mix[:, -fade:] *= np.linspace(1, 0, fade) ** 1.4
    chime_pcm = np.clip(chime_mix.T, -1, 1)
    enc2 = lameenc.Encoder()
    enc2.set_bit_rate(96)
    enc2.set_in_sample_rate(SR)
    enc2.set_channels(2)
    enc2.set_quality(2)
    out = enc2.encode((chime_pcm * 32767).astype(np.int16).tobytes()) + enc2.flush()
    chime_path = os.path.join(OUT_DIR, "unlock-chime.mp3")
    with open(chime_path, "wb") as fh:
        fh.write(bytearray(out))
    print(f"  wrote {chime_path} ({len(out) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()

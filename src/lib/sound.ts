/**
 * Minimal, dependency-free call/notification sounds using the Web Audio API.
 * No external audio files are required — tones are synthesized at runtime.
 * Gracefully degrades (silent) if the browser blocks the audio context.
 */

let audioCtx: AudioContext | null = null;
let ringtoneTimer: ReturnType<typeof setInterval> | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio API not supported');
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', volume = 0.08): void {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + durationMs / 1000);
  } catch {
    // Audio blocked or unavailable — silent degradation is acceptable.
  }
}

/** Classic two-tone incoming-call ringtone. Loops until stopRingtone() is called. */
export function playRingtone(): void {
  stopRingtone();
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const tick = (): void => {
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      playTone(440, 320); // A4
      setTimeout(() => playTone(523, 320), 400); // C5
    };
    tick();
    ringtoneTimer = setInterval(tick, 1000);
  } catch {
    // Silent on failure.
  }
}

export function stopRingtone(): void {
  if (ringtoneTimer !== null) {
    clearInterval(ringtoneTimer);
    ringtoneTimer = null;
  }
}

/** Short connecting beep played once when the call room connects. */
export function playCallConnectTone(): void {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    playTone(880, 180); // A5
  } catch {
    // Silent on failure.
  }
}

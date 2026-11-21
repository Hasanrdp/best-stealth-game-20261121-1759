// All sound is synthesised with WebAudio — no audio files, no network.
// Footsteps, guard steps, pickup chimes, alarm stings and the win fanfare
// are short oscillator and noise bursts shaped by envelopes.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let ambient = null;

  function ensure() {
    if (!ctx) {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, volume, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, volume, lowpass) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime;
    const length = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    source.start(t0);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopAmbient();
      return muted;
    },
    isMuted() {
      return muted;
    },
    footstep(sneak) {
      if (sneak) noiseBurst(0.05, 0.03, 500);
      else noiseBurst(0.07, 0.09, 900);
    },
    guardStep() {
      noiseBurst(0.06, 0.05, 420);
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.12);
      tone(1318, 0.18, 'sine', 0.1, 0.07);
    },
    opal() {
      tone(523, 0.2, 'triangle', 0.14);
      tone(659, 0.2, 'triangle', 0.14, 0.09);
      tone(784, 0.3, 'triangle', 0.14, 0.18);
      tone(1046, 0.45, 'sine', 0.12, 0.27);
    },
    suspicious() {
      tone(392, 0.16, 'square', 0.05, 0, 466);
    },
    alarm() {
      tone(220, 0.5, 'sawtooth', 0.09, 0, 440);
      tone(220, 0.5, 'sawtooth', 0.07, 0.28, 440);
    },
    lost() {
      tone(330, 0.25, 'triangle', 0.06, 0, 262);
    },
    caught() {
      tone(160, 0.7, 'sawtooth', 0.14, 0, 55);
      noiseBurst(0.25, 0.12, 300);
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((freq, i) => tone(freq, 0.35, 'triangle', 0.12, i * 0.1));
    },
    click() {
      tone(660, 0.06, 'sine', 0.08);
    },
    startAmbient() {
      if (muted) return;
      const ac = ensure();
      if (!ac || ambient) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = 55;
      gain.gain.value = 0.018;
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = 0.008;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      lfo.start();
      ambient = { osc, lfo, gain };
    },
    stopAmbient() {
      if (!ambient) return;
      try {
        ambient.osc.stop();
        ambient.lfo.stop();
      } catch {
        // Already stopped.
      }
      ambient = null;
    },
  };
}

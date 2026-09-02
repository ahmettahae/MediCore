// MediCore Profesyonel Klinik Ses & Alarm Motoru (Web Audio API)
// Harici dosya indirme veya internet bağlantısı gerektirmez, %100 yerel ve kesintisiz çalışır.

class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Kritik Klinik Alarmı Çalar (Hospital Monitor Alarm - Nabız / Tansiyon / Ateş Uyarısı)
   */
  playCriticalAlarm() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 3 Aşamalı Acil Tıbbi Uyarı Tonu (Beep-Beep-Beep)
      const frequencies = [880, 784, 880]; // A5, G5, A5
      const times = [0, 0.15, 0.3];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + times[idx]);

        gain.gain.setValueAtTime(0.001, now + times[idx]);
        gain.gain.exponentialRampToValueAtTime(0.3, now + times[idx] + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + times[idx] + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + times[idx]);
        osc.stop(now + times[idx] + 0.13);
      });
    } catch (e) {
      console.warn("Kritik alarm sesi üretilemedi:", e);
    }
  }

  /**
   * Standart Bilgilendirme / Bildirim Çanı
   */
  playNotificationChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // İki tonlu yumuşak hastane anons çanı (C6 -> G6)
      const freqs = [1046.5, 1567.98];
      const starts = [0, 0.12];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + starts[idx]);

        gain.gain.setValueAtTime(0.001, now + starts[idx]);
        gain.gain.exponentialRampToValueAtTime(0.2, now + starts[idx] + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + starts[idx] + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + starts[idx]);
        osc.stop(now + starts[idx] + 0.36);
      });
    } catch (e) {
      console.warn("Bildirim sesi üretilemedi:", e);
    }
  }

  /**
   * Başarılı İşlem Sesi
   */
  playSuccessSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 major arpeggio
      const starts = [0, 0.08, 0.16];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + starts[idx]);

        gain.gain.setValueAtTime(0.001, now + starts[idx]);
        gain.gain.exponentialRampToValueAtTime(0.18, now + starts[idx] + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + starts[idx] + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + starts[idx]);
        osc.stop(now + starts[idx] + 0.26);
      });
    } catch (e) {
      console.warn("Başarı sesi üretilemedi:", e);
    }
  }

  /**
   * Genel Ses Tetikleyici
   * @param {'alert'|'error'|'warning'|'success'|'info'} tip 
   */
  play(tip = 'info') {
    if (tip === 'alert' || tip === 'error' || tip === 'critical') {
      this.playCriticalAlarm();
    } else if (tip === 'success') {
      this.playSuccessSound();
    } else {
      this.playNotificationChime();
    }
  }
}

export const soundEngine = new SoundEngine();
export const playAlarmSound = (tip) => soundEngine.play(tip);
export default soundEngine;

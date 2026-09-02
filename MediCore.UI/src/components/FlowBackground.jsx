import React, { useEffect, useRef } from 'react';

const FlowBackground = ({ kartUzerinde = false }) => {
  const canvasRef = useRef(null);
  const kartUzerindeRef = useRef(kartUzerinde);

  useEffect(() => {
    kartUzerindeRef.current = kartUzerinde;
  }, [kartUzerinde]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // ── FARE VE STATE ──
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    let isMouseActive = false;
    let sensorPulse = 0;
    let isMouseDown = false;

    const mouseTrail = [];

    // ── 🔬 3. SEÇENEK: HÜCRESEL MİTOZ BÖLÜNME & İLAÇ DAĞITIMI STATE ──
    const mitosisEvents = [];

    const handleMouseMove = (e) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      isMouseActive = true;

      mouseTrail.push({
        x: e.clientX,
        y: e.clientY,
        alpha: 0.35,
        radius: 2.0
      });
      if (mouseTrail.length > 14) mouseTrail.shift();
    };

    const handleMouseDown = () => {
      isMouseDown = true;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleMouseLeave = () => {
      isMouseActive = false;
    };

    // 🔬 TIKLANDIĞINDA HÜCRESEL MİTOZ & İLAÇ DAĞITIMI TETİKLENİR
    const handleClick = (e) => {
      const clickX = e.clientX;
      const clickY = e.clientY;
      const divAngle = Math.random() * Math.PI;

      // 4 Yöne fırlayacak mikro pastil/kapsüller
      const pills = [];
      for (let i = 0; i < 4; i++) {
        const pAngle = divAngle + (Math.PI / 2) * i + (Math.random() - 0.5) * 0.2;
        const speed = Math.random() * 2.2 + 2.0;
        pills.push({
          x: 0,
          y: 0,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.1,
          size: Math.random() * 3 + 5,
          type: i % 2 === 0 ? 'capsule' : 'round'
        });
      }

      // 6 İnce sinaptik lif
      const filaments = [];
      for (let i = 0; i < 6; i++) {
        const fAngle = (Math.PI * 2 / 6) * i + (Math.random() - 0.5) * 0.4;
        const length = Math.random() * 45 + 50;
        filaments.push({
          angle: fAngle,
          targetLen: length,
          currentLen: 0
        });
      }

      mitosisEvents.push({
        x: clickX,
        y: clickY,
        progress: 0,
        speed: 0.022,
        divAngle,
        cellRadius: 12,
        shockRadius: 6,
        maxShockRadius: 180,
        pills,
        filaments,
        alpha: 1.0
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    // ── SÜZÜLEN MONOKROM İLAÇ ELEMANLARI ──
    const itemTypes = ['capsuleTwoTone', 'roundPill', 'blisterPill', 'serumBottle', 'ampoule', 'cross'];
    const itemCount = Math.min(Math.floor((width * height) / 28000), 38);

    const floatingMeds = Array.from({ length: itemCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 12,
      type: itemTypes[i % itemTypes.length],
      vx: (Math.random() - 0.5) * 0.12,
      vy: Math.random() * 0.08 + 0.04,
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.0015,
      alpha: Math.random() * 0.25 + 0.15,
      scale: Math.random() * 0.4 + 0.8
    }));

    // ── HÜCRESEL AĞ DÜĞÜMLERİ ──
    const nodeCount = Math.min(Math.floor((width * height) / 38000), 26);
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1.2,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      pulsePhase: Math.random() * Math.PI * 2
    }));

    // ── SAKİN DALGA PARAMETRELERİ ──
    let step = 0;

    const render = () => {
      step += 0.0035;
      sensorPulse += 0.04;

      mouseX += (targetMouseX - mouseX) * 0.35;
      mouseY += (targetMouseY - mouseY) * 0.35;

      // ── 1. FERAH AÇIK MEDİKAL ZEMİN ──
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.5, '#F8FAFC');
      bgGrad.addColorStop(1, '#F1F5F9');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // ── 2. MİNİMALİST MEDİKAL GRID MATRİSİ ──
      const gridSize = 45;
      ctx.fillStyle = 'rgba(11, 25, 44, 0.035)';
      for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
          ctx.fillRect(x - 0.5, y - 0.5, 1.5, 1.5);
        }
      }

      // ── 3. GERÇEKÇİ & SIK EKG KALP RİTMİ SİNYALLERİ (ÜST VE ALT BANTLAR) ──
      const waveBands = [
        { ratio: 0.11, amp: 14, opacity: 0.10, speedMult: 0.7, ekgAmp: 1.15 },
        { ratio: 0.20, amp: 20, opacity: 0.07, speedMult: 0.9, ekgAmp: 0.95 },
        { ratio: 0.80, amp: 18, opacity: 0.07, speedMult: 0.8, ekgAmp: 0.95 },
        { ratio: 0.89, amp: 14, opacity: 0.10, speedMult: 1.0, ekgAmp: 1.15 },
      ];

      waveBands.forEach((band, w) => {
        ctx.beginPath();
        const baseY = height * band.ratio;
        const waveSpeed = step * band.speedMult;

        ctx.strokeStyle = `rgba(11, 25, 44, ${band.opacity * 2.2})`;
        ctx.lineWidth = 1.35;

        const beatPeriod = 250;

        for (let x = 0; x <= width; x += 4) {
          const sin1 = Math.sin(x * 0.0022 + waveSpeed) * band.amp;
          const sin2 = Math.cos(x * 0.0045 - waveSpeed * 0.5) * 8;

          const pos = (x + step * 38 + w * 68) % beatPeriod;
          let ekgOffset = 0;

          if (pos >= 35 && pos < 58) {
            ekgOffset = -Math.sin((pos - 35) / 23 * Math.PI) * (6.5 * band.ekgAmp);
          } else if (pos >= 68 && pos < 76) {
            ekgOffset = Math.sin((pos - 68) / 8 * Math.PI) * (4.8 * band.ekgAmp);
          } else if (pos >= 76 && pos < 88) {
            ekgOffset = -Math.sin((pos - 76) / 12 * Math.PI) * (34.0 * band.ekgAmp);
          } else if (pos >= 88 && pos < 98) {
            ekgOffset = Math.sin((pos - 88) / 10 * Math.PI) * (9.5 * band.ekgAmp);
          } else if (pos >= 112 && pos < 148) {
            ekgOffset = -Math.sin((pos - 112) / 36 * Math.PI) * (9.0 * band.ekgAmp);
          } else if (pos >= 155 && pos < 172) {
            ekgOffset = -Math.sin((pos - 155) / 17 * Math.PI) * (2.2 * band.ekgAmp);
          }

          const mouseDistX = Math.abs(x - mouseX);
          const mouseDistY = Math.abs(mouseY - baseY);
          let mouseFactor = 0;

          if (mouseDistY < 120 && mouseDistX < 200) {
            const ratioX = 1 - mouseDistX / 200;
            const ratioY = 1 - mouseDistY / 120;
            mouseFactor = (mouseY - baseY) * 0.35 * Math.sin(ratioX * Math.PI) * ratioY;
          }

          const y = baseY + sin1 + sin2 + ekgOffset + mouseFactor;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // ── 4. YAVAŞ HÜCRESEL AĞ ÇİZGİLERİ ──
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.08;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(11, 25, 44, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < -10) node.x = width + 10;
        if (node.x > width + 10) node.x = -10;
        if (node.y < -10) node.y = height + 10;
        if (node.y > height + 10) node.y = -10;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(11, 25, 44, 0.25)';
        ctx.fill();
      });

      // ── 5. AKIŞKAN SÜZÜLEN İLAÇLAR ──
      floatingMeds.forEach(med => {
        if (isMouseActive) {
          const dx = mouseX - med.x;
          const dy = mouseY - med.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140 && dist > 5) {
            const pushForce = (1 - dist / 140) * 0.35;
            med.vx -= (dx / dist) * pushForce * 0.3;
            med.vy -= (dy / dist) * pushForce * 0.3;
            med.angle += 0.008;
          }
        }

        med.vx *= 0.97;
        med.vy = med.vy * 0.97 + 0.0018;

        med.x += med.vx;
        med.y += med.vy;
        med.angle += med.vAngle;

        if (med.y > height + 40) {
          med.y = -40;
          med.x = Math.random() * width;
          med.vy = Math.random() * 0.08 + 0.04;
        }
        if (med.x < -40) med.x = width + 40;
        if (med.x > width + 40) med.x = -40;

        ctx.save();
        ctx.translate(med.x, med.y);
        ctx.rotate(med.angle);
        ctx.scale(med.scale, med.scale);

        const s = med.size;

        if (med.type === 'capsuleTwoTone') {
          const w = s * 1.7;
          const h = s * 0.75;
          const r = h / 2;

          ctx.strokeStyle = `rgba(11, 25, 44, ${med.alpha})`;
          ctx.lineWidth = 1.2;

          ctx.fillStyle = `rgba(11, 25, 44, ${med.alpha * 0.85})`;
          ctx.beginPath();
          ctx.arc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5);
          ctx.lineTo(0, -r);
          ctx.lineTo(0, r);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = `rgba(255, 255, 255, ${med.alpha * 0.95})`;
          ctx.beginPath();
          ctx.arc(w / 2 - r, 0, r, Math.PI * 1.5, Math.PI / 2);
          ctx.lineTo(0, r);
          ctx.lineTo(0, -r);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(0, r);
          ctx.stroke();
        }
        else if (med.type === 'roundPill') {
          const r = s * 0.65;
          ctx.strokeStyle = `rgba(11, 25, 44, ${med.alpha})`;
          ctx.fillStyle = `rgba(255, 255, 255, ${med.alpha * 0.9})`;
          ctx.lineWidth = 1.2;

          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-r * 0.65, 0);
          ctx.lineTo(r * 0.65, 0);
          ctx.stroke();
        }
        else if (med.type === 'blisterPill') {
          const r = s * 0.6;
          ctx.strokeStyle = `rgba(11, 25, 44, ${med.alpha})`;
          ctx.fillStyle = `rgba(244, 244, 245, ${med.alpha * 0.8})`;
          ctx.lineWidth = 1.2;

          ctx.beginPath();
          ctx.roundRect(-r, -r, r * 2, r * 2, 4);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }
        else if (med.type === 'serumBottle') {
          const w = s * 0.8;
          const h = s * 1.3;
          ctx.strokeStyle = `rgba(11, 25, 44, ${med.alpha})`;
          ctx.fillStyle = `rgba(255, 255, 255, ${med.alpha * 0.85})`;
          ctx.lineWidth = 1.2;

          ctx.beginPath();
          ctx.roundRect(-w / 2, -h / 2 + 4, w, h - 4, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = `rgba(11, 25, 44, ${med.alpha * 0.8})`;
          ctx.fillRect(-w * 0.3, -h / 2, w * 0.6, 4);

          ctx.beginPath();
          ctx.moveTo(-w / 2 + 2, 0);
          ctx.lineTo(w / 2 - 2, 0);
          ctx.stroke();
        }
        else if (med.type === 'ampoule') {
          const r = s * 0.4;
          const h = s * 1.2;
          ctx.strokeStyle = `rgba(11, 25, 44, ${med.alpha})`;
          ctx.fillStyle = `rgba(255, 255, 255, ${med.alpha * 0.9})`;
          ctx.lineWidth = 1.2;

          ctx.beginPath();
          ctx.moveTo(-r, h / 2);
          ctx.lineTo(r, h / 2);
          ctx.lineTo(r, -h * 0.2);
          ctx.lineTo(r * 0.4, -h * 0.35);
          ctx.lineTo(r * 0.4, -h / 2);
          ctx.lineTo(-r * 0.4, -h / 2);
          ctx.lineTo(-r * 0.4, -h * 0.35);
          ctx.lineTo(-r, -h * 0.2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-r * 0.4, -h * 0.35);
          ctx.lineTo(r * 0.4, -h * 0.35);
          ctx.stroke();
        }
        else if (med.type === 'cross') {
          const arm = s * 0.45;
          const th = s * 0.18;
          ctx.fillStyle = `rgba(11, 25, 44, ${med.alpha * 0.7})`;
          ctx.beginPath();
          ctx.fillRect(-th / 2, -arm, th, arm * 2);
          ctx.fillRect(-arm, -th / 2, arm * 2, th);
        }

        ctx.restore();
      });

      // ── 6. 🔬 3. SEÇENEK: HÜCRESEL MİTOZ & İLAÇ DAĞITIMI ANİMASYONU ──
      for (let i = mitosisEvents.length - 1; i >= 0; i--) {
        const ev = mitosisEvents[i];
        ev.progress += ev.speed;

        if (ev.progress >= 1.0) {
          mitosisEvents.splice(i, 1);
          continue;
        }

        const p = ev.progress;
        const currentAlpha = (1 - p) * 0.85;

        ctx.save();
        ctx.translate(ev.x, ev.y);

        // a) Genişleyen Şok Halkası
        const shockR = ev.shockRadius + (ev.maxShockRadius - ev.shockRadius) * p;
        ctx.beginPath();
        ctx.arc(0, 0, shockR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(11, 25, 44, ${currentAlpha * 0.35})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // b) 6 Adet Sinaptik Sinir Lifi Uzantısı
        ev.filaments.forEach(fil => {
          fil.currentLen = fil.targetLen * Math.sin(p * Math.PI);
          const fx = Math.cos(fil.angle) * fil.currentLen;
          const fy = Math.sin(fil.angle) * fil.currentLen;

          ctx.beginPath();
          ctx.moveTo(0, 0);
          const midX = (fx / 2) + Math.cos(fil.angle + Math.PI / 2) * 6;
          const midY = (fy / 2) + Math.sin(fil.angle + Math.PI / 2) * 6;
          ctx.quadraticCurveTo(midX, midY, fx, fy);
          ctx.strokeStyle = `rgba(11, 25, 44, ${currentAlpha * 0.4})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(fx, fy, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(11, 25, 44, ${currentAlpha * 0.6})`;
          ctx.fill();
        });

        // c) Hücre Bölünmesi (Mitoz İki Kardeş Hücre)
        const separationDist = p < 0.5 ? p * 28 : 14 + (p - 0.5) * 35;
        const cellR = ev.cellRadius * (1 - p * 0.3);

        const dx = Math.cos(ev.divAngle) * (separationDist / 2);
        const dy = Math.sin(ev.divAngle) * (separationDist / 2);

        // Sol Kardeş Hücre
        ctx.beginPath();
        ctx.arc(-dx, -dy, cellR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.9})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(11, 25, 44, ${currentAlpha * 0.75})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Sol Çekirdek
        ctx.beginPath();
        ctx.arc(-dx, -dy, cellR * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(11, 25, 44, ${currentAlpha * 0.8})`;
        ctx.fill();

        // Sağ Kardeş Hücre
        ctx.beginPath();
        ctx.arc(dx, dy, cellR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.9})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(11, 25, 44, ${currentAlpha * 0.75})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Sağ Çekirdek
        ctx.beginPath();
        ctx.arc(dx, dy, cellR * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(11, 25, 44, ${currentAlpha * 0.8})`;
        ctx.fill();

        // d) 4 Yöne Saçılan Mikro Pastil / İlaçlar
        if (p > 0.15) {
          ev.pills.forEach(pill => {
            pill.x += pill.vx;
            pill.y += pill.vy;
            pill.vx *= 0.95;
            pill.vy *= 0.95;
            pill.rotation += pill.vRot;

            ctx.save();
            ctx.translate(pill.x, pill.y);
            ctx.rotate(pill.rotation);

            if (pill.type === 'capsule') {
              const pw = pill.size * 1.8;
              const ph = pill.size * 0.8;
              const pr = ph / 2;

              ctx.fillStyle = `rgba(11, 25, 44, ${currentAlpha})`;
              ctx.beginPath();
              ctx.arc(-pw / 2 + pr, 0, pr, Math.PI / 2, Math.PI * 1.5);
              ctx.lineTo(0, -pr);
              ctx.lineTo(0, pr);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
              ctx.beginPath();
              ctx.arc(pw / 2 - pr, 0, pr, Math.PI * 1.5, Math.PI / 2);
              ctx.lineTo(0, pr);
              ctx.lineTo(0, -pr);
              ctx.closePath();
              ctx.fill();

              ctx.strokeStyle = `rgba(11, 25, 44, ${currentAlpha})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.roundRect(-pw / 2, -ph / 2, pw, ph, pr);
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, pill.size * 0.6, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
              ctx.fill();
              ctx.strokeStyle = `rgba(11, 25, 44, ${currentAlpha})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }

            ctx.restore();
          });
        }

        ctx.restore();
      }

      // ── 7. 🩺 ÖZEL MEDİKAL SENSÖR & CROSSHAIR İMLECİ ──
      if (isMouseActive && !kartUzerindeRef.current) {
        if (mouseTrail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(mouseTrail[0].x, mouseTrail[0].y);
          for (let i = 1; i < mouseTrail.length; i++) {
            ctx.lineTo(mouseTrail[i].x, mouseTrail[i].y);
          }
          ctx.strokeStyle = 'rgba(11, 25, 44, 0.09)';
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }

        ctx.save();
        ctx.translate(targetMouseX, targetMouseY);

        // 1. Nefes alan şık, saydam medikal halka (Nişangah çizgileri yok)
        const baseR = isMouseDown ? 7 : 11;
        const ringR = baseR + Math.sin(sensorPulse) * 1.5;

        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = isMouseDown ? 'rgba(11, 25, 44, 0.45)' : 'rgba(11, 25, 44, 0.22)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // 2. Merkezdeki net, minimalist koyu medikal nokta
        ctx.beginPath();
        ctx.arc(0, 0, isMouseDown ? 3.0 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--primary)';
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-auto z-0 cursor-none"
    />
  );
};

export default FlowBackground;

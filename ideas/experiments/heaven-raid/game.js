/* Heaven Raid — Bobiverse-skinned Atari shmup (v0)
   Galaga formations + 1942 vertical free-move. Geometric draw only. */

(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const hud = document.getElementById('hud');
  const W = canvas.width;
  const H = canvas.height;

  const AMBER = '#ffb000';
  const PHOS = '#39ff14';
  const DANGER = '#ff4a3a';
  const ASH = '#6a5a45';

  const keys = new Set();
  addEventListener('keydown', e => {
    keys.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.code === 'Enter') onEnter();
  });
  addEventListener('keyup', e => keys.delete(e.code));

  // Touch: left half move toward touch, right half fire
  let touch = null;
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    touch = { x: e.offsetX, y: e.offsetY };
    if (state.mode === 'title' || state.mode === 'over') onEnter();
  });
  canvas.addEventListener('pointermove', e => {
    if (touch) touch = { x: e.offsetX, y: e.offsetY };
  });
  canvas.addEventListener('pointerup', () => { touch = null; });

  const state = {
    mode: 'title', // title | play | over
    score: 0,
    lives: 3,
    wave: 0,
    t: 0,
    cool: 0,
    invuln: 0,
    player: { x: W / 2, y: H - 56, w: 18, h: 22 },
    bullets: [],
    enemies: [],
    eBullets: [],
    particles: [],
    stars: [],
    scroll: 0,
  };

  function resetStars() {
    state.stars = Array.from({ length: 48 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      s: 0.4 + Math.random() * 1.6,
      a: 0.25 + Math.random() * 0.6,
    }));
  }
  resetStars();

  function resetPlay() {
    state.score = 0;
    state.lives = 3;
    state.wave = 0;
    state.cool = 0;
    state.invuln = 90;
    state.player.x = W / 2;
    state.player.y = H - 56;
    state.bullets = [];
    state.enemies = [];
    state.eBullets = [];
    state.particles = [];
    state.mode = 'play';
    spawnWave();
  }

  function onEnter() {
    if (state.mode === 'title' || state.mode === 'over') resetPlay();
  }

  function spawnWave() {
    state.wave++;
    const n = Math.min(5 + state.wave, 12);
    const rowY = 70;
    const gap = Math.min(36, (W - 40) / n);
    const startX = (W - (n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) {
      const tx = startX + i * gap;
      state.enemies.push({
        x: tx + (i % 2 ? -80 : W + 80),
        y: -20 - i * 8,
        tx, ty: rowY + (i % 3) * 28,
        phase: 'enter', // enter | hold | dive
        hold: 90 + i * 12,
        diveT: 0,
        w: 16, h: 14,
        hp: 1,
        kind: i % 5 === 0 ? 'serra' : 'probe', // serra = tougher
        shoot: 40 + Math.random() * 80,
      });
      if (state.enemies[state.enemies.length - 1].kind === 'serra') {
        state.enemies[state.enemies.length - 1].hp = 3;
        state.enemies[state.enemies.length - 1].w = 20;
        state.enemies[state.enemies.length - 1].h = 16;
      }
    }
  }

  function burst(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.5 + Math.random() * 2.2;
      state.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 18 + Math.random() * 16, color,
      });
    }
  }

  function hit(a, b) {
    return Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
           Math.abs(a.y - b.y) < (a.h + b.h) / 2;
  }

  function update() {
    state.t++;
    state.scroll += 1.2;

    // stars
    for (const s of state.stars) {
      s.y += s.s;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }

    if (state.mode !== 'play') return;

    const p = state.player;
    const spd = 3.2;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) p.x -= spd;
    if (keys.has('ArrowRight') || keys.has('KeyD')) p.x += spd;
    if (keys.has('ArrowUp') || keys.has('KeyW')) p.y -= spd;
    if (keys.has('ArrowDown') || keys.has('KeyS')) p.y += spd;
    if (touch) {
      p.x += (touch.x - p.x) * 0.12;
      p.y += (touch.y - p.y) * 0.12;
    }
    p.x = Math.max(14, Math.min(W - 14, p.x));
    p.y = Math.max(H * 0.35, Math.min(H - 20, p.y));

    if (state.cool > 0) state.cool--;
    if (state.invuln > 0) state.invuln--;
    const firing = keys.has('Space') || keys.has('KeyZ') || (touch && touch.x > W * 0.55);
    if (firing && state.cool === 0) {
      state.bullets.push({ x: p.x, y: p.y - 14, w: 3, h: 8, vy: -7 });
      state.cool = 11;
    }

    for (const b of state.bullets) b.y += b.vy;
    state.bullets = state.bullets.filter(b => b.y > -10);

    for (const e of state.enemies) {
      if (e.phase === 'enter') {
        e.x += (e.tx - e.x) * 0.08;
        e.y += (e.ty - e.y) * 0.08;
        if (Math.hypot(e.x - e.tx, e.y - e.ty) < 2) {
          e.x = e.tx; e.y = e.ty; e.phase = 'hold';
        }
      } else if (e.phase === 'hold') {
        e.hold--;
        e.x = e.tx + Math.sin((state.t + e.tx) * 0.04) * 6;
        if (e.hold <= 0) {
          e.phase = 'dive';
          e.diveT = 0;
          e.vx = (p.x - e.x) * 0.015;
          e.vy = 1.4 + Math.random() * 1.2;
        }
      } else {
        e.diveT++;
        e.x += e.vx;
        e.y += e.vy;
        e.vy += 0.012;
        if (e.y > H + 30) {
          e.y = -20;
          e.x = 30 + Math.random() * (W - 60);
          e.phase = 'hold';
          e.hold = 40 + Math.random() * 60;
          e.tx = e.x;
          e.ty = 60 + Math.random() * 80;
          e.vy = 0;
        }
      }

      e.shoot--;
      if (e.shoot <= 0 && e.y > 0 && e.y < H * 0.7) {
        state.eBullets.push({
          x: e.x, y: e.y + 8, w: 3, h: 6,
          vy: 2.2 + Math.random(),
          vx: (Math.random() - 0.5) * (e.kind === 'serra' ? 1.6 : 0.6),
        });
        e.shoot = e.kind === 'serra' ? 50 + Math.random() * 40 : 70 + Math.random() * 90;
      }
    }

    for (const b of state.eBullets) {
      b.x += b.vx || 0;
      b.y += b.vy;
    }
    state.eBullets = state.eBullets.filter(b => b.y < H + 10 && b.x > -10 && b.x < W + 10);

    // collisions: player bullets vs enemies
    for (const b of state.bullets) {
      for (const e of state.enemies) {
        if (e.hp <= 0) continue;
        if (hit(b, e)) {
          b.y = -99;
          e.hp--;
          burst(e.x, e.y, e.kind === 'serra' ? DANGER : AMBER, 5);
          if (e.hp <= 0) {
            state.score += e.kind === 'serra' ? 150 : 50;
            burst(e.x, e.y, PHOS, 14);
          }
        }
      }
    }
    state.enemies = state.enemies.filter(e => e.hp > 0);
    state.bullets = state.bullets.filter(b => b.y > -10);

    // enemy bullets / body vs player
    if (state.invuln === 0) {
      let dead = false;
      for (const b of state.eBullets) {
        if (hit(b, { ...p, w: 12, h: 14 })) { dead = true; b.y = H + 99; }
      }
      for (const e of state.enemies) {
        if (hit(e, { ...p, w: 14, h: 16 })) dead = true;
      }
      if (dead) {
        burst(p.x, p.y, PHOS, 20);
        state.lives--;
        state.invuln = 100;
        state.eBullets = [];
        if (state.lives < 0) {
          state.mode = 'over';
          state.lives = 0;
        } else {
          p.x = W / 2;
          p.y = H - 56;
        }
      }
    }

    for (const q of state.particles) {
      q.x += q.vx; q.y += q.vy; q.life--;
    }
    state.particles = state.particles.filter(q => q.life > 0);

    if (state.enemies.length === 0) spawnWave();

    hud.innerHTML = `SCORE <b>${state.score}</b> · WAVE <b>${state.wave}</b> · LIVES <b>${state.lives}</b>`;
  }

  function drawHeaven(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = PHOS;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(9, 10);
    ctx.lineTo(0, 6);
    ctx.lineTo(-9, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = AMBER;
    ctx.fillRect(-2, 2, 4, 6);
    ctx.restore();
  }

  function drawProbe(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.kind === 'serra') {
      ctx.fillStyle = DANGER;
      ctx.fillRect(-10, -6, 20, 12);
      ctx.fillStyle = AMBER;
      ctx.fillRect(-6, -10, 12, 5);
      ctx.fillRect(-3, 6, 6, 5);
    } else {
      ctx.fillStyle = AMBER;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(8, -6);
      ctx.lineTo(0, -3);
      ctx.lineTo(-8, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = DANGER;
      ctx.fillRect(-2, -2, 4, 4);
    }
    ctx.restore();
  }

  function draw() {
    ctx.fillStyle = '#050302';
    ctx.fillRect(0, 0, W, H);

    for (const s of state.stars) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = ASH;
      ctx.fillRect(s.x, s.y, s.s > 1.2 ? 2 : 1, s.s > 1.2 ? 2 : 1);
    }
    ctx.globalAlpha = 1;

    // faint scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let y = (state.scroll | 0) % 4; y < H; y += 4) ctx.fillRect(0, y, W, 1);

    if (state.mode === 'title') {
      ctx.fillStyle = PHOS;
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HEAVEN RAID', W / 2, H * 0.36);
      ctx.fillStyle = AMBER;
      ctx.font = '11px monospace';
      ctx.fillText('HEAVEN-1  vs  EMPIRE PROBES', W / 2, H * 0.42);
      ctx.fillStyle = ASH;
      ctx.fillText('ENTER / TAP TO LAUNCH', W / 2, H * 0.55);
      ctx.font = '10px monospace';
      ctx.fillText('GALAGA FORMATIONS · 1942 SCROLL', W / 2, H * 0.62);
      drawHeaven(W / 2, H * 0.72);
      return;
    }

    for (const b of state.bullets) {
      ctx.fillStyle = PHOS;
      ctx.fillRect(b.x - 1, b.y - 4, 3, 8);
    }
    for (const b of state.eBullets) {
      ctx.fillStyle = DANGER;
      ctx.fillRect(b.x - 1, b.y - 3, 3, 6);
    }
    for (const e of state.enemies) drawProbe(e);
    for (const q of state.particles) {
      ctx.globalAlpha = Math.max(0, q.life / 30);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, 2, 2);
    }
    ctx.globalAlpha = 1;

    if (state.mode === 'play') {
      if (state.invuln === 0 || (state.t % 4 < 2)) drawHeaven(state.player.x, state.player.y);
    }

    if (state.mode === 'over') {
      ctx.fillStyle = 'rgba(5,3,2,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = DANGER;
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MATRIX SCRAMBLED', W / 2, H * 0.42);
      ctx.fillStyle = AMBER;
      ctx.font = '12px monospace';
      ctx.fillText(`SCORE ${state.score}`, W / 2, H * 0.48);
      ctx.fillStyle = ASH;
      ctx.fillText('ENTER / TAP TO REBUILD', W / 2, H * 0.56);
      hud.innerHTML = `FINAL <b>${state.score}</b> · WAVE <b>${state.wave}</b> · ENTER TO RETRY`;
    }
  }

  function frame() {
    update();
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

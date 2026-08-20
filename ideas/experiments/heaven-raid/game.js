/* Heaven Raid — Bobiverse-skinned Atari shmup (v1)
   Galaga formations + 1942 scroll.
   Structure: waves 1–4 probes → wave 5 Serra boss → harder loop.
   Buster pickups upgrade fire. Geometric draw only. */

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
  const WAVES_PER_LOOP = 5; // 1–4 normal, 5 = boss

  const keys = new Set();
  addEventListener('keydown', e => {
    keys.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.code === 'Enter') onEnter();
  });
  addEventListener('keyup', e => keys.delete(e.code));

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
    mode: 'title', // title | play | over | banner
    score: 0,
    lives: 3,
    loop: 1,
    wave: 0,       // 1..5 within loop
    totalWaves: 0, // forever counter for HUD flavour
    t: 0,
    cool: 0,
    invuln: 0,
    buster: 0,     // 0..3 weapon tier
    banner: '',
    bannerT: 0,
    player: { x: W / 2, y: H - 56, w: 18, h: 22 },
    bullets: [],
    enemies: [],
    eBullets: [],
    powerups: [],
    particles: [],
    stars: [],
    scroll: 0,
    bossIntro: 0,
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

  function showBanner(msg, frames = 90) {
    state.banner = msg;
    state.bannerT = frames;
  }

  function resetPlay() {
    state.score = 0;
    state.lives = 3;
    state.loop = 1;
    state.wave = 0;
    state.totalWaves = 0;
    state.cool = 0;
    state.invuln = 90;
    state.buster = 0;
    state.player.x = W / 2;
    state.player.y = H - 56;
    state.bullets = [];
    state.enemies = [];
    state.eBullets = [];
    state.powerups = [];
    state.particles = [];
    state.mode = 'play';
    state.bossIntro = 0;
    nextWave();
  }

  function onEnter() {
    if (state.mode === 'title' || state.mode === 'over') resetPlay();
  }

  function diff() {
    return 1 + (state.loop - 1) * 0.35;
  }

  function nextWave() {
    state.wave++;
    if (state.wave > WAVES_PER_LOOP) {
      state.wave = 1;
      state.loop++;
      showBanner(`LOOP ${state.loop} · HARDER`, 100);
    }
    state.totalWaves++;
    state.enemies = [];
    state.eBullets = [];
    if (state.wave === WAVES_PER_LOOP) spawnBoss();
    else spawnProbeWave();
  }

  function spawnProbeWave() {
    const d = diff();
    const n = Math.min(4 + state.wave + state.loop, 14);
    const rowY = 64;
    const gap = Math.min(34, (W - 40) / Math.max(n, 1));
    const startX = (W - (n - 1) * gap) / 2;
    showBanner(`WAVE ${state.wave}/${WAVES_PER_LOOP}`, 70);
    for (let i = 0; i < n; i++) {
      const tx = startX + i * gap;
      const heavy = i % 4 === 0 && state.wave >= 2;
      state.enemies.push({
        x: tx + (i % 2 ? -90 : W + 90),
        y: -24 - i * 10,
        tx, ty: rowY + (i % 3) * 26,
        phase: 'enter',
        hold: Math.max(40, 100 - state.wave * 8) + i * 10,
        w: heavy ? 18 : 16,
        h: heavy ? 15 : 14,
        hp: heavy ? 2 + Math.floor(state.loop / 2) : 1,
        maxHp: heavy ? 2 + Math.floor(state.loop / 2) : 1,
        kind: heavy ? 'heavy' : 'probe',
        shoot: 50 + Math.random() * 70,
        boss: false,
      });
    }
  }

  function spawnBoss() {
    showBanner('SERRA DO MAR', 110);
    state.bossIntro = 60;
    const hp = Math.floor(28 * diff());
    state.enemies.push({
      x: W / 2, y: -40,
      tx: W / 2, ty: 88,
      phase: 'enter',
      hold: 99999,
      w: 52, h: 28,
      hp, maxHp: hp,
      kind: 'boss',
      boss: true,
      shoot: 30,
      pattern: 0,
      patternT: 0,
      dir: 1,
    });
  }

  function dropBuster(x, y, force = false) {
    // ~22% from normals, always sometimes from heavy/boss chunks
    if (!force && Math.random() > 0.22) return;
    state.powerups.push({
      x, y, w: 14, h: 14, vy: 1.4, kind: 'buster', life: 420,
    });
  }

  function burst(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.5 + Math.random() * 2.4;
      state.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 16 + Math.random() * 18, color,
      });
    }
  }

  function hit(a, b) {
    return Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
           Math.abs(a.y - b.y) < (a.h + b.h) / 2;
  }

  function firePlayer() {
    const p = state.player;
    const tier = state.buster;
    const mk = (ox, oy, vx, vy, dmg = 1) => {
      state.bullets.push({
        x: p.x + ox, y: p.y + oy, w: tier >= 2 ? 4 : 3, h: 9,
        vx, vy, dmg, buster: tier >= 1,
      });
    };
    // tier 0: single · 1: dual · 2: triple · 3: triple + side busters
    if (tier === 0) mk(0, -14, 0, -7.2);
    else if (tier === 1) { mk(-5, -10, 0, -7.2); mk(5, -10, 0, -7.2); }
    else if (tier === 2) { mk(0, -14, 0, -7.5); mk(-7, -10, -0.4, -7); mk(7, -10, 0.4, -7); }
    else {
      mk(0, -14, 0, -7.8);
      mk(-8, -10, -0.5, -7.2);
      mk(8, -10, 0.5, -7.2);
      mk(-11, -4, -2.2, -5.5, 2); // buster missiles
      mk(11, -4, 2.2, -5.5, 2);
    }
    state.cool = tier >= 3 ? 9 : tier >= 1 ? 10 : 12;
  }

  function updateBoss(e, p) {
    e.patternT++;
    // drift side to side
    e.x += e.dir * (1.1 + state.loop * 0.15);
    if (e.x < 40) e.dir = 1;
    if (e.x > W - 40) e.dir = -1;
    e.y = e.ty + Math.sin(state.t * 0.03) * 8;

    e.shoot--;
    if (e.shoot > 0) return;
    const phase = Math.floor(e.patternT / 90) % 3;
    if (phase === 0) {
      // fan
      for (let i = -2; i <= 2; i++) {
        state.eBullets.push({
          x: e.x, y: e.y + 14, w: 3, h: 6,
          vx: i * 0.9, vy: 2.4, bossShot: true,
        });
      }
      e.shoot = Math.max(18, 28 - state.loop * 2);
    } else if (phase === 1) {
      // aimed
      const dx = p.x - e.x, dy = p.y - e.y;
      const len = Math.hypot(dx, dy) || 1;
      state.eBullets.push({
        x: e.x, y: e.y + 14, w: 4, h: 7,
        vx: (dx / len) * 2.8, vy: (dy / len) * 2.8, bossShot: true,
      });
      e.shoot = Math.max(12, 20 - state.loop);
    } else {
      // side pods
      for (const sx of [-18, 18]) {
        state.eBullets.push({
          x: e.x + sx, y: e.y + 10, w: 3, h: 6,
          vx: sx * 0.04, vy: 3.2, bossShot: true,
        });
      }
      e.shoot = Math.max(10, 16 - state.loop);
    }
  }

  function update() {
    state.t++;
    state.scroll += 1.2;
    if (state.bannerT > 0) state.bannerT--;
    if (state.bossIntro > 0) state.bossIntro--;

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
    if (firing && state.cool === 0 && state.bossIntro === 0) firePlayer();

    for (const b of state.bullets) {
      b.x += b.vx || 0;
      b.y += b.vy;
    }
    state.bullets = state.bullets.filter(b => b.y > -16 && b.x > -20 && b.x < W + 20);

    for (const e of state.enemies) {
      if (e.boss) {
        if (e.phase === 'enter') {
          e.y += (e.ty - e.y) * 0.06;
          if (Math.abs(e.y - e.ty) < 2) { e.y = e.ty; e.phase = 'hold'; }
        } else if (state.bossIntro === 0) {
          updateBoss(e, p);
        }
        continue;
      }

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
          e.vx = (p.x - e.x) * 0.015 * diff();
          e.vy = 1.3 + Math.random() * 1.1 + state.loop * 0.1;
        }
      } else {
        e.x += e.vx;
        e.y += e.vy;
        e.vy += 0.012;
        if (e.y > H + 30) {
          e.y = -20;
          e.x = 30 + Math.random() * (W - 60);
          e.phase = 'hold';
          e.hold = 36 + Math.random() * 50;
          e.tx = e.x;
          e.ty = 55 + Math.random() * 70;
          e.vy = 0;
        }
      }

      e.shoot--;
      if (e.shoot <= 0 && e.y > 0 && e.y < H * 0.7) {
        state.eBullets.push({
          x: e.x, y: e.y + 8, w: 3, h: 6,
          vy: 2.1 + Math.random() + state.loop * 0.08,
          vx: (Math.random() - 0.5) * (e.kind === 'heavy' ? 1.4 : 0.5),
        });
        e.shoot = e.kind === 'heavy'
          ? 45 + Math.random() * 35
          : 65 + Math.random() * 80;
      }
    }

    for (const b of state.eBullets) {
      b.x += b.vx || 0;
      b.y += b.vy;
    }
    state.eBullets = state.eBullets.filter(b => b.y < H + 12 && b.x > -12 && b.x < W + 12);

    // player shots vs enemies
    for (const b of state.bullets) {
      for (const e of state.enemies) {
        if (e.hp <= 0) continue;
        if (hit(b, e)) {
          b.y = -99;
          e.hp -= b.dmg || 1;
          burst(e.x, e.y, e.boss ? DANGER : AMBER, e.boss ? 3 : 5);
          if (e.hp <= 0) {
            const boss = e.boss;
            state.score += boss ? 2000 : e.kind === 'heavy' ? 120 : 50;
            burst(e.x, e.y, PHOS, boss ? 28 : 14);
            if (boss) {
              dropBuster(e.x, e.y, true);
              dropBuster(e.x - 20, e.y + 10, true);
              state.score += 500 * state.loop;
              showBanner('SERRA DESTROYED', 100);
            } else if (e.kind === 'heavy' || Math.random() < 0.18) {
              dropBuster(e.x, e.y);
            }
          }
        }
      }
    }
    state.enemies = state.enemies.filter(e => e.hp > 0);
    state.bullets = state.bullets.filter(b => b.y > -16);

    // powerups
    for (const u of state.powerups) {
      u.y += u.vy;
      u.life--;
      if (hit(u, { ...p, w: 16, h: 18 })) {
        u.life = 0;
        if (state.buster < 3) {
          state.buster++;
          showBanner(state.buster === 1 ? 'BUSTER ONLINE' :
            state.buster === 2 ? 'BUSTER ×2' : 'BUSTER MAX', 70);
        } else {
          state.score += 300;
          showBanner('BUSTER BANK +300', 50);
        }
        burst(p.x, p.y, PHOS, 10);
      }
    }
    state.powerups = state.powerups.filter(u => u.life > 0 && u.y < H + 20);

    // damage to player
    if (state.invuln === 0 && state.bossIntro === 0) {
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
        state.invuln = 110;
        state.eBullets = [];
        // lose one buster tier on hit (not all)
        if (state.buster > 0) state.buster--;
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

    if (state.enemies.length === 0 && state.mode === 'play') nextWave();

    const bLabel = state.buster === 0 ? 'NONE' : `×${state.buster}`;
    hud.innerHTML =
      `SCORE <b>${state.score}</b> · LOOP <b>${state.loop}</b> · ` +
      `WAVE <b>${state.wave}/${WAVES_PER_LOOP}</b> · ` +
      `LIVES <b>${state.lives}</b> · BUSTER <b>${bLabel}</b>`;
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
    if (state.buster >= 1) {
      ctx.fillStyle = PHOS;
      ctx.fillRect(-11, 2, 3, 5);
      ctx.fillRect(8, 2, 3, 5);
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.boss) {
      ctx.fillStyle = DANGER;
      ctx.fillRect(-26, -10, 52, 22);
      ctx.fillStyle = AMBER;
      ctx.fillRect(-18, -16, 36, 8);
      ctx.fillRect(-8, 10, 16, 8);
      ctx.fillStyle = ASH;
      ctx.fillRect(-22, -4, 8, 8);
      ctx.fillRect(14, -4, 8, 8);
      // HP bar
      const pct = e.hp / e.maxHp;
      ctx.fillStyle = '#222';
      ctx.fillRect(-30, -24, 60, 4);
      ctx.fillStyle = pct > 0.3 ? DANGER : AMBER;
      ctx.fillRect(-30, -24, 60 * pct, 4);
    } else if (e.kind === 'heavy') {
      ctx.fillStyle = DANGER;
      ctx.fillRect(-9, -6, 18, 12);
      ctx.fillStyle = AMBER;
      ctx.fillRect(-5, -9, 10, 4);
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

  function drawPowerup(u) {
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.strokeStyle = PHOS;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.fillStyle = PHOS;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('B', 0, 3);
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

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let y = (state.scroll | 0) % 4; y < H; y += 4) ctx.fillRect(0, y, W, 1);

    if (state.mode === 'title') {
      ctx.fillStyle = PHOS;
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HEAVEN RAID', W / 2, H * 0.32);
      ctx.fillStyle = AMBER;
      ctx.font = '11px monospace';
      ctx.fillText('HEAVEN-1  vs  EMPIRE PROBES', W / 2, H * 0.38);
      ctx.fillStyle = ASH;
      ctx.font = '10px monospace';
      ctx.fillText('5 WAVES → SERRA BOSS → LOOP', W / 2, H * 0.48);
      ctx.fillText('PICK UP BUSTERS TO UPGRADE FIRE', W / 2, H * 0.53);
      ctx.fillText('ENTER / TAP TO LAUNCH', W / 2, H * 0.62);
      drawHeaven(W / 2, H * 0.74);
      return;
    }

    for (const b of state.bullets) {
      ctx.fillStyle = b.buster ? PHOS : AMBER;
      ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
    }
    for (const b of state.eBullets) {
      ctx.fillStyle = DANGER;
      ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
    }
    for (const u of state.powerups) drawPowerup(u);
    for (const e of state.enemies) drawEnemy(e);
    for (const q of state.particles) {
      ctx.globalAlpha = Math.max(0, q.life / 30);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, 2, 2);
    }
    ctx.globalAlpha = 1;

    if (state.mode === 'play') {
      if (state.invuln === 0 || (state.t % 4 < 2)) drawHeaven(state.player.x, state.player.y);
    }

    if (state.bannerT > 0 && state.banner) {
      ctx.fillStyle = 'rgba(5,3,2,0.45)';
      ctx.fillRect(0, H * 0.38, W, 36);
      ctx.fillStyle = PHOS;
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.banner, W / 2, H * 0.38 + 24);
    }

    if (state.mode === 'over') {
      ctx.fillStyle = 'rgba(5,3,2,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = DANGER;
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MATRIX SCRAMBLED', W / 2, H * 0.40);
      ctx.fillStyle = AMBER;
      ctx.font = '12px monospace';
      ctx.fillText(`SCORE ${state.score}  ·  LOOP ${state.loop}`, W / 2, H * 0.47);
      ctx.fillStyle = ASH;
      ctx.fillText('ENTER / TAP TO REBUILD', W / 2, H * 0.55);
    }
  }

  function frame() {
    update();
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

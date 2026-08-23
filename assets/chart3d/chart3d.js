/* BobNet Chart — Three.js environment (Phase C.1)
   Loaded on demand after HOLO3D. Speaks through BobChart3D.create(ctx).
   Spatial honesty: Euclidean / Sol-origin only. No wormhole geometry. */
(function (root) {
  'use strict';

  function hexToRgb(hex) {
    const h = String(hex || '#fff4ea').replace('#', '');
    const n = h.length === 3
      ? h.split('').map(c => c + c).join('')
      : h;
    return {
      r: parseInt(n.slice(0, 2), 16) / 255,
      g: parseInt(n.slice(2, 4), 16) / 255,
      b: parseInt(n.slice(4, 6), 16) / 255,
    };
  }

  /* systems.json xyz → Three Y-up: (x, z, y). */
  function lyToWorld(THREE, p, out) {
    const v = out || new THREE.Vector3();
    return v.set(p[0], p[2], p[1]);
  }

  function create(ctx) {
    const THREE = ctx.THREE;
    if (!THREE) throw new Error('BobChart3D needs THREE');

    const state = {
      renderer: null,
      scene: null,
      camera: null,
      sky: null,
      systems: new Map(), // id -> { mesh, sys }
      rings: [],
      sol: null,
      raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(),
      canvas: null,
      stage: null,
      raf: 0,
      live: false,
      w: 0,
      h: 0,
      focus: null, // { t0, dur, yaw0, yaw1, pitch0, pitch1, zoom0, zoom1, panx0, panx1, pany0, pany1 }
      hoverId: null,
      _tmp: new THREE.Vector3(),
      _right: new THREE.Vector3(),
      _up: new THREE.Vector3(),
      _fwd: new THREE.Vector3(),
    };

    const chart = () => ctx.getChart();
    const farthest = () => Math.max(1, ctx.getFarthest());

    function buildSky() {
      ctx.styleSky && ctx.styleSky();
      const sky = ctx.getSky() || [];
      const n = sky.length;
      const positions = new Float32Array(n * 3);
      const colors = new Float32Array(n * 3);
      // Backdrop sits well outside the local systems so fog/perspective don't
      // wash it — still the same unit vectors as the 2D chart.
      const R = Math.max(180, farthest() * 8);
      for (let i = 0; i < n; i++) {
        const st = sky[i];
        const v = st.v;
        positions[i * 3] = v[0] * R;
        positions[i * 3 + 1] = v[2] * R;
        positions[i * 3 + 2] = v[1] * R;
        const fill = st.fill || 'rgba(255,244,234,0.5)';
        const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(fill);
        // Lift the floor so the field reads on first open (was too dim × fog).
        const a = st.m != null
          ? Math.max(0.55, Math.min(1, (7.2 - st.m) / 4.8))
          : 0.75;
        if (m) {
          colors[i * 3] = Math.min(1, (+m[1] / 255) * a * 1.25);
          colors[i * 3 + 1] = Math.min(1, (+m[2] / 255) * a * 1.25);
          colors[i * 3 + 2] = Math.min(1, (+m[3] / 255) * a * 1.25);
        } else {
          colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = 0.75 * a;
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: 3.4,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      });
      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      return points;
    }

    function buildSystems() {
      const group = new THREE.Group();
      state.systems.clear();
      const placed = ctx.getPlaced() || [];
      for (const sys of placed) {
        if (!sys.xyz_ly) continue;
        const col = hexToRgb(ctx.starColour(sys));
        // Markers in ly — must stay << separations (Alpha Cen is 4.4 ly).
        // Old radii ~1–3 ly fused the whole neighbourhood into one glob.
        const r = Math.max(0.12, (ctx.starRadius(sys) || 3) * 0.055);
        const geo = new THREE.SphereGeometry(r, 16, 12);
        // BasicMaterial = self-lit spectral dots (stars shouldn't need key lights).
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(col.r, col.g, col.b),
          transparent: true,
          opacity: 1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        lyToWorld(THREE, sys.xyz_ly, mesh.position);
        mesh.userData.sysId = sys.id;
        // Soft glow — kept smaller than nearest-neighbour gaps.
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(r * 2.8, 12, 10),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(col.r, col.g, col.b),
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
          })
        );
        glow.userData.isGlow = true;
        mesh.add(glow);
        // Invisible pick halo — fat target for touch / hover.
        const hit = new THREE.Mesh(
          new THREE.SphereGeometry(Math.max(r * 8, 0.55), 8, 8),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hit.userData.sysId = sys.id;
        mesh.add(hit);
        group.add(mesh);
        state.systems.set(sys.id, { mesh, hit, glow, sys, mat });
      }
      return group;
    }

    function buildRings() {
      const group = new THREE.Group();
      const f = farthest();
      for (const r of [10, 20, 30, 40, 50]) {
        if (r > f + 6) continue;
        const pts = [];
        for (let i = 0; i <= 96; i++) {
          const a = (i / 96) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({ color: 0xc29358, transparent: true, opacity: 0.55 })
        );
        group.add(line);
      }
      return group;
    }

    function buildSol() {
      const g = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 20, 16),
        new THREE.MeshBasicMaterial({ color: 0xffe3b8 })
      );
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.48, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0xffb454,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        })
      );
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.62, 0.78, 48),
        new THREE.MeshBasicMaterial({
          color: 0xffb454,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      g.add(glow);
      g.add(core);
      g.add(ring);
      return g;
    }

    function syncCamera() {
      const c = chart();
      const cam = state.camera;
      if (!cam) return;
      // Slightly closer default framing so local systems fill the tank.
      const dist = (farthest() * 2.15) / Math.max(c.zoom, 0.35);
      const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
      const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
      // Camera in systems.json ly-space.
      const lx = dist * sy * cp;
      const ly = dist * cy * cp;
      const lz = dist * sp;
      const panScale = farthest() / Math.max(220, Math.min(state.w, state.h) || 400);
      // Pan in the view plane (ly-space right / up).
      const right = state._right.set(cy, 0, -sy);
      const up = state._up.set(-sy * sp, cp, -cy * sp);
      const tx = right.x * (-c.panx * panScale) + up.x * (c.pany * panScale);
      const ty = right.y * (-c.panx * panScale) + up.y * (c.pany * panScale);
      const tz = right.z * (-c.panx * panScale) + up.z * (c.pany * panScale);
      // Remap ly-space (x,y,z) → Three Y-up (x,z,y).
      cam.position.set(lx + tx, lz + tz, ly + ty);
      cam.lookAt(tx, tz, ty);
      cam.near = 0.05;
      cam.far = Math.max(500, farthest() * 40);
      cam.updateProjectionMatrix();
    }

    function syncYearAndSelection() {
      const c = chart();
      for (const [, entry] of state.systems) {
        const reached = entry.sys.first_year != null && entry.sys.first_year <= c.year;
        entry.mesh.visible = true;
        entry.mat.opacity = reached ? 1 : 0.32;
        entry.mat.transparent = true;
        if (entry.glow) entry.glow.material.opacity = reached ? 0.4 : 0.1;
        entry.hit.visible = reached; // future systems not pickable (same as dimmed legacy)
        const sel = c.sel === entry.sys.id;
        const col = hexToRgb(ctx.starColour(entry.sys));
        if (sel) {
          entry.mat.color.set(0x7ce8a4);
          if (entry.glow) entry.glow.material.color.set(0x7ce8a4);
          entry.mesh.scale.setScalar(1.8);
        } else {
          entry.mat.color.setRGB(col.r, col.g, col.b);
          if (entry.glow) entry.glow.material.color.setRGB(col.r, col.g, col.b);
          entry.mesh.scale.setScalar(1);
        }
      }
    }

    function stepFocus(now) {
      const f = state.focus;
      if (!f) return;
      const t = Math.min(1, (now - f.t0) / f.dur);
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out
      const c = chart();
      c.yaw = f.yaw0 + (f.yaw1 - f.yaw0) * e;
      c.pitch = f.pitch0 + (f.pitch1 - f.pitch0) * e;
      c.zoom = f.zoom0 + (f.zoom1 - f.zoom0) * e;
      c.panx = f.panx0 + (f.panx1 - f.panx0) * e;
      c.pany = f.pany0 + (f.pany1 - f.pany0) * e;
      if (t >= 1) state.focus = null;
    }

    function projectLabels() {
      const layer = ctx.getLabelLayer && ctx.getLabelLayer();
      if (!layer || !state.camera || !state.canvas) return;
      const c = chart();
      const rect = state.canvas.getBoundingClientRect();
      const w = rect.width || state.w;
      const h = rect.height || state.h;
      const bits = [];
      // Priority: selected, then scene-heavy, then near/bright — cap so the
      // field stays readable.
      const ranked = [...state.systems.values()]
        .filter(e => e.sys.first_year != null && e.sys.first_year <= c.year)
        .sort((a, b) =>
          (c.sel === b.sys.id) - (c.sel === a.sys.id) ||
          ((b.sys.scenes || 0) - (a.sys.scenes || 0)) ||
          ((a.sys.abs_mag ?? 99) - (b.sys.abs_mag ?? 99)));
      const shown = ranked.slice(0, 12);
      const v = state._tmp;
      for (const entry of shown) {
        v.copy(entry.mesh.position);
        v.project(state.camera);
        if (v.z < -1 || v.z > 1) continue;
        const x = (v.x * 0.5 + 0.5) * w;
        const y = (-v.y * 0.5 + 0.5) * h;
        if (x < -40 || x > w + 40 || y < -20 || y > h + 20) continue;
        const sel = c.sel === entry.sys.id;
        const cls = sel ? 'chart-label sel' : 'chart-label';
        const name = String(entry.sys.name || entry.sys.id)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        bits.push(
          `<span class="${cls}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${name}</span>`
        );
      }
      layer.innerHTML = bits.join('');
    }

    function tick(now) {
      if (!state.live) return;
      stepFocus(now || performance.now());
      syncCamera();
      syncYearAndSelection();
      state.renderer.render(state.scene, state.camera);
      projectLabels();
      state.raf = requestAnimationFrame(tick);
    }

    function mount(canvas, stage) {
      if (state.renderer) dispose();
      state.canvas = canvas;
      state.stage = stage || canvas.parentElement;
      const w = canvas.clientWidth || stage.clientWidth || 800;
      const h = canvas.clientHeight || stage.clientHeight || 520;
      state.w = w;
      state.h = h;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        });
      } catch (e) {
        return false;
      }
      renderer.setPixelRatio(Math.min(2, (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1) || 1));
      renderer.setSize(w, h, false);
      renderer.setClearColor(0x0a0704, 1);
      if (renderer.outputColorSpace !== undefined)
        renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      // Soft far fog only — density 0.012 was eating the whole local chart.
      scene.fog = new THREE.Fog(0x0a0704, farthest() * 3.5, farthest() * 14);

      const camera = new THREE.PerspectiveCamera(55, w / Math.max(h, 1), 0.05, 4000);

      scene.add(new THREE.AmbientLight(0xffe3b8, 1.05));
      const key = new THREE.DirectionalLight(0xffb454, 0.55);
      key.position.set(40, 60, 20);
      scene.add(key);

      state.sky = buildSky();
      scene.add(state.sky);
      state.rings = buildRings();
      scene.add(state.rings);
      state.sol = buildSol();
      scene.add(state.sol);
      scene.add(buildSystems());

      state.renderer = renderer;
      state.scene = scene;
      state.camera = camera;
      state.live = true;
      canvas.hidden = false;
      syncCamera();
      syncYearAndSelection();
      cancelAnimationFrame(state.raf);
      state.raf = requestAnimationFrame(tick);
      return true;
    }

    function paint() {
      if (!state.live || !state.renderer) return;
      const canvas = state.canvas;
      const stage = state.stage;
      if (!canvas) return;
      const w = canvas.clientWidth || (stage && stage.clientWidth) || state.w;
      const h = canvas.clientHeight || (stage && stage.clientHeight) || state.h;
      if (w !== state.w || h !== state.h) {
        state.w = w;
        state.h = h;
        state.camera.aspect = w / Math.max(h, 1);
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(w, h, false);
      }
      syncCamera();
      syncYearAndSelection();
    }

    function stop() {
      state.live = false;
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    }

    function start() {
      if (!state.renderer) return;
      if (state.live) return;
      state.live = true;
      state.raf = requestAnimationFrame(tick);
    }

    function dispose() {
      stop();
      if (state.scene) {
        state.scene.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(m => m.dispose && m.dispose());
          }
        });
      }
      if (state.renderer) {
        state.renderer.dispose();
        const gl = state.renderer.getContext && state.renderer.getContext();
        const lose = gl && gl.getExtension && gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
      state.renderer = null;
      state.scene = null;
      state.camera = null;
      state.systems.clear();
      state.canvas = null;
    }

    function ndcFromClient(clientX, clientY) {
      const rect = state.canvas.getBoundingClientRect();
      state.pointer.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      state.pointer.y = -((clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
    }

    function pick(clientX, clientY) {
      if (!state.live || !state.camera) return null;
      ndcFromClient(clientX, clientY);
      state.raycaster.setFromCamera(state.pointer, state.camera);
      const hits = [];
      for (const [, entry] of state.systems) {
        if (!entry.hit.visible) continue;
        hits.push(entry.hit);
      }
      const found = state.raycaster.intersectObjects(hits, false);
      return found.length ? found[0].object.userData.sysId : null;
    }

    function focusSystem(id) {
      const entry = state.systems.get(id);
      if (!entry) return;
      const c = chart();
      const p = entry.sys.xyz_ly;
      // Aim yaw/pitch roughly at the system; pull zoom in a bit; clear pan.
      const dist = Math.hypot(p[0], p[1], p[2]) || 1;
      const yaw1 = Math.atan2(p[0], p[1]);
      const pitch1 = Math.asin(Math.max(-1.4, Math.min(1.4, p[2] / dist)));
      // Pull in close enough that neighbours separate (Alpha Cen ≈ 4.4 ly).
      const zoom1 = Math.max(2.5, Math.min(55, (farthest() * 2.15) / Math.max(dist * 0.35, 1.2)));
      state.focus = {
        t0: performance.now(),
        dur: 420,
        yaw0: c.yaw, yaw1,
        pitch0: c.pitch, pitch1,
        zoom0: c.zoom, zoom1,
        panx0: c.panx, panx1: 0,
        pany0: c.pany, pany1: 0,
      };
    }

    function cancelFocus() {
      state.focus = null;
    }

    return {
      mount, paint, start, stop, dispose, pick, focusSystem, cancelFocus,
      isLive: () => state.live,
      getHoverId: () => state.hoverId,
      setHoverId: id => { state.hoverId = id; },
    };
  }

  root.BobChart3D = { create };
})(typeof globalThis !== 'undefined' ? globalThis : this);

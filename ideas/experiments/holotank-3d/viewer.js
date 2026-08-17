/**
 * Throwaway holotank 3D spike — not the production console.
 * Orbit / zoom a GLB. No network after npm install (local three/).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const statusEl = document.getElementById('status');
const canvas = document.getElementById('tank');

const setStatus = (t, ok) => {
  if (!statusEl) return;
  statusEl.textContent = t;
  statusEl.dataset.ok = ok ? '1' : '0';
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x0a0704, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 500);
camera.position.set(2.2, 1.1, 2.8);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffe3b8, 0.45));
const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(4, 6, 3);
scene.add(key);
const fill = new THREE.DirectionalLight(0x7ce8a4, 0.25);
fill.position.set(-3, 1, -2);
scene.add(fill);

const grid = new THREE.GridHelper(6, 12, 0x5e4b2b, 0x3a2e1a);
grid.position.y = -0.75;
scene.add(grid);

let root = null;
const loader = new GLTFLoader();

function frameObject(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  obj.scale.setScalar(1.6 / maxDim);
  const box2 = new THREE.Box3().setFromObject(obj);
  obj.position.y -= box2.min.y + 0.02;
  controls.target.set(0, 0.35, 0);
  camera.position.set(2.2, 1.1, 2.8);
  controls.update();
}

function clearModel() {
  if (!root) return;
  scene.remove(root);
  root.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    }
  });
  root = null;
}

export function loadModel(url) {
  clearModel();
  setStatus(`Loading ${url}…`, false);
  loader.load(
    url,
    gltf => {
      root = gltf.scene;
      scene.add(root);
      frameObject(root);
      setStatus(`Loaded — drag orbit · scroll zoom · right-drag pan · drop another .glb anytime`, true);
    },
    xhr => {
      if (xhr.total) {
        setStatus(`Loading… ${Math.round((xhr.loaded / xhr.total) * 100)}%`, false);
      }
    },
    err => {
      console.error(err);
      setStatus(
        `Failed to load model. Need a .glb in models/ (see README) or drop one on the tank. ` +
          `${err && err.message ? err.message : err}`,
        false
      );
    }
  );
}

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w < 2 || h < 2) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

(function tick() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
})();

setStatus('No GLB yet — generate one (README) or drop a .glb onto the tank', false);

canvas.addEventListener('dragover', e => {
  e.preventDefault();
  canvas.classList.add('drop');
});
canvas.addEventListener('dragleave', () => canvas.classList.remove('drop'));
canvas.addEventListener('drop', e => {
  e.preventDefault();
  canvas.classList.remove('drop');
  const file = [...(e.dataTransfer.files || [])].find(
    f => /\.glb$/i.test(f.name) || f.type === 'model/gltf-binary'
  );
  if (!file) {
    setStatus('Drop a .glb file', false);
    return;
  }
  const url = URL.createObjectURL(file);
  loadModel(url);
  setStatus(`Previewing ${file.name} (${(file.size / 1024).toFixed(0)} KB)`, true);
});

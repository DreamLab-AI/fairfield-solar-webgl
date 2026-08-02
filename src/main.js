import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './styles.css';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

document.querySelector('#app').innerHTML = `
  <header class="topbar" data-od-id="site-header">
    <div class="brand"><span class="brand-mark">FS</span><span>Fairfield Solar</span></div>
    <div class="status"><i></i> Design simulation · revision 2026-07-21</div>
    <button id="info-toggle" class="icon-button" aria-label="About this simulation">i</button>
  </header>
  <main data-od-id="simulation-workspace">
    <section class="viewport" aria-label="Interactive three-dimensional site model">
      <canvas id="scene"></canvas>
      <div class="loading" id="loading"><span></span><p>Loading georeferenced site model</p></div>
      <div class="scene-label"><span>54.3887° N · 3.3246° W</span><strong>Eskdale Green, Cumbria</strong></div>
      <div class="tools" aria-label="Camera views">
        <button data-view="site" class="active">Site</button><button data-view="array">Array</button><button data-view="house">House</button>
      </div>
      <div class="hint">Drag to orbit · scroll to zoom · select a panel</div>
    </section>
    <aside class="panel" aria-label="Simulation controls and data">
      <section class="overview">
        <p class="eyebrow">Ground-mount photovoltaic design</p>
        <h1>12.10 <small>kWp</small></h1>
        <div class="metrics">
          <div><strong>20</strong><span>605 W modules</span></div>
          <div><strong>10,764</strong><span>kWh / year</span></div>
          <div><strong>2.30%</strong><span>shading loss</span></div>
        </div>
      </section>
      <section class="time-control">
        <div class="section-head"><h2>Solar year</h2><output id="date-output">21 June · 12:00</output></div>
        <label>Month<input id="month" type="range" min="1" max="12" value="6" step="1" /></label>
        <div class="month-labels"><span>Jan</span><span>Jun</span><span>Dec</span></div>
        <label>Time<input id="hour" type="range" min="5" max="21" value="12" step="0.25" /></label>
        <div class="month-labels"><span>05:00</span><span>13:00</span><span>21:00</span></div>
      </section>
      <section class="yield-section">
        <div class="section-head"><h2>Monthly yield</h2><output id="yield-value">1,441 kWh</output></div>
        <div class="chart" id="yield-chart" role="img" aria-label="Monthly photovoltaic generation"></div>
        <p id="loss-note">June shading loss · 0.97%</p>
      </section>
      <section class="selection" id="selection">
        <p class="eyebrow">Selected object</p><h2>Site model</h2>
        <p>Select any photovoltaic module to inspect its coordinates and modelled shading.</p>
      </section>
      <footer>EPSG:27700 · Origin 314083.66 E, 500058.46 N · Elevations are metres ASL</footer>
    </aside>
  </main>
  <dialog id="about"><button id="about-close" aria-label="Close">×</button><p class="eyebrow">About the model</p><h2>A planning tool grounded in the design of record.</h2><p>This browser scene is exported from <strong>fairfield-scene-v5.blend</strong>. Terrain comes from EA LiDAR, vegetation from canopy-height detection, and panel shading from a twelve-month Blender ray-cast study. The original proposed-solar polygon is an initial siting guide; the accepted v5 array extends downhill beyond it.</p><dl><div><dt>Coordinate system</dt><dd>British National Grid, EPSG:27700</dd></div><div><dt>Array</dt><dd>20 × JA Solar 605 W, 25° tilt</dd></div><div><dt>Model status</dt><dd>Planning simulation, not construction survey</dd></div></dl></dialog>
`;

const data = await fetch(assetUrl('data/simulation.json')).then((r) => {
  if (!r.ok) throw new Error('Simulation data is missing. Run npm run prepare:data.');
  return r.json();
});

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcad3c3);
scene.fog = new THREE.FogExp2(0xcad3c3, 0.00018);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 12000);
// glTF is Y-up; source Blender (x, y, z) positions map to (x, z, -y).
camera.position.set(105, 88, 125);
const controls = new OrbitControls(camera, canvas);
controls.target.set(15, 0, -5);
controls.enableDamping = true;
controls.maxDistance = 1800;
controls.minDistance = 8;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0xdce6ef, 0x6b654c, 1.7));
const sun = new THREE.DirectionalLight(0xfff3d2, 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -130;
sun.shadow.camera.right = sun.shadow.camera.top = 130;
sun.shadow.camera.far = 500;
scene.add(sun);

let siteModel;
const selectable = [];
const modelLoader = new GLTFLoader();
modelLoader.setMeshoptDecoder(MeshoptDecoder);
function loadSiteModel() {
  const loading = document.querySelector('#loading');
  loading.classList.remove('done', 'failed');
  loading.innerHTML = '<span></span><p>Loading georeferenced site model</p>';
  modelLoader.load(assetUrl('assets/fairfield-site.glb'), (gltf) => {
  siteModel = gltf.scene;
  scene.add(siteModel);
  siteModel.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = object.name.startsWith('panel-') || object.userData.category === 'energy_building';
    object.receiveShadow = true;
  });
  siteModel.traverse((object) => {
    if (!/^panel-\d+$/.test(object.name) && object.userData.category !== 'solar_panel') return;
    object.traverse((child) => {
      if (!child.isMesh) return;
      child.userData.panelId = object.name;
      child.userData.panelMetadata = object.userData;
      child.castShadow = true;
      selectable.push(child);
    });
  });
    loading.classList.add('done');
  }, (event) => {
    if (!event.total) return;
    const percentage = Math.min(100, Math.round(event.loaded / event.total * 100));
    const message = loading.querySelector('p');
    if (message) message.textContent = `Loading georeferenced site model · ${percentage}%`;
  }, (error) => {
    loading.classList.add('failed');
    loading.innerHTML = '<strong>Scene could not be loaded</strong><p>The model request failed or this browser could not decode it.</p><button type="button" id="retry-model">Retry model</button>';
    document.querySelector('#retry-model').addEventListener('click', loadSiteModel, { once: true });
    console.error('Fairfield site model load failed:', error);
  });
}
loadSiteModel();

function resize() {
  const { clientWidth, clientHeight } = canvas;
  if (canvas.width !== clientWidth * renderer.getPixelRatio() || canvas.height !== clientHeight * renderer.getPixelRatio()) {
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }
}

function sunPosition(month, hour) {
  const declination = 23.44 * Math.sin(((360 / 365) * (284 + (month - 1) * 30 + 21)) * Math.PI / 180);
  const lat = data.site.location.latitude * Math.PI / 180;
  const dec = declination * Math.PI / 180;
  const angle = (hour - 12) * 15 * Math.PI / 180;
  const altitude = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(angle));
  const azimuth = Math.atan2(Math.sin(angle), Math.cos(angle) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
  const radius = 180;
  sun.position.set(-Math.sin(azimuth) * Math.cos(altitude) * radius, Math.sin(altitude) * radius, Math.cos(azimuth) * Math.cos(altitude) * radius);
  sun.intensity = Math.max(0, Math.sin(altitude)) * 4;
  scene.background.set(altitude > 0 ? 0xcad3c3 : 0x273443);
}

function renderChart(selectedMonth) {
  const max = Math.max(...data.monthly.map((m) => m.generationKwh));
  document.querySelector('#yield-chart').innerHTML = data.monthly.map((m, i) => `<button class="bar ${i + 1 === selectedMonth ? 'selected' : ''}" style="--height:${m.generationKwh / max * 100}%" data-month="${i + 1}" aria-label="${months[i]}: ${m.generationKwh} kWh"><i></i><span>${months[i][0]}</span></button>`).join('');
}

const monthInput = document.querySelector('#month');
const hourInput = document.querySelector('#hour');
function updateTime() {
  const month = Number(monthInput.value), hour = Number(hourInput.value);
  const entry = data.monthly[month - 1];
  const minutes = Math.round(hour % 1 * 60).toString().padStart(2, '0');
  document.querySelector('#date-output').value = `21 ${months[month - 1]} · ${Math.floor(hour).toString().padStart(2, '0')}:${minutes}`;
  document.querySelector('#yield-value').value = `${entry.generationKwh.toLocaleString()} kWh`;
  document.querySelector('#loss-note').textContent = `${months[month - 1]} shading loss · ${entry.shadingLossPct.toFixed(2)}%`;
  sunPosition(month, hour);
  renderChart(month);
}
monthInput.addEventListener('input', updateTime);
hourInput.addEventListener('input', updateTime);
document.querySelector('#yield-chart').addEventListener('click', (event) => {
  const button = event.target.closest('[data-month]');
  if (button) { monthInput.value = button.dataset.month; updateTime(); }
});

const views = { site: [[105, 88, 125], [15, 0, -5]], array: [[32, 18, 34], [12, 2, -3]], house: [[115, 36, 88], [68, 3, -28]] };
document.querySelector('.tools').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  document.querySelectorAll('.tools button').forEach((b) => b.classList.toggle('active', b === button));
  const [position, target] = views[button.dataset.view];
  camera.position.fromArray(position); controls.target.fromArray(target); controls.update();
});

const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(selectable, false)[0];
  if (!hit) return;
  const object = hit.object;
  const panelId = object.userData.panelId || object.name;
  const metadata = object.userData.panelMetadata || object.userData;
  const panel = data.panels[panelId];
  document.querySelector('#selection').innerHTML = `<p class="eyebrow">Selected module</p><h2>${metadata.label || panelId}</h2><div class="selection-grid"><span>Rated output<strong>${metadata.rated_power_w || 605} W</strong></span><span>Annual shading<strong>${(panel?.annualShadingLossPct ?? metadata.annual_shading_loss_pct).toFixed(2)}%</strong></span><span>BNG easting<strong>${metadata.bng_easting?.toFixed(2) ?? '—'}</strong></span><span>BNG northing<strong>${metadata.bng_northing?.toFixed(2) ?? '—'}</strong></span></div>`;
});

const about = document.querySelector('#about');
document.querySelector('#info-toggle').addEventListener('click', () => about.showModal());
document.querySelector('#about-close').addEventListener('click', () => about.close());
updateTime();
renderer.setAnimationLoop(() => { resize(); controls.update(); renderer.render(scene, camera); });

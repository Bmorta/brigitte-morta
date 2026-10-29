/**
 * Version 2 administrative mascot: GLB-based prototype.
 * Separate from the programmer robot; no procedural fallback to rejected mascot.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const mount = document.querySelector(".hub-mascot-assistant.hub-mascot-3d");
if (mount && "WebGLRenderingContext" in window) {
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    start().catch((error) => {
      console.warn("Admin GLB unavailable. Check models/admin-assistant-3d.glb.", error);
      mount.classList.add("mascot-load-error");
    });
  }, { rootMargin: "180px" });
  observer.observe(mount);
}

async function start() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8e715f, 2.6));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-3, 6, 8);
  scene.add(light);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(4.2, 2.8, 7.5);

  const gltf = await new GLTFLoader().loadAsync("models/admin-assistant-3d.glb");
  const model = gltf.scene;
  // trimesh exports Z-up GLB geometry; Three.js expects Y-up.
  // Rotate the complete asset so its head points upward and the desk stays level.
  model.rotation.x = -Math.PI / 2;
  scene.add(model);
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  camera.lookAt(0, 0, 0);
  const height = bounds.getSize(new THREE.Vector3()).y;
  const distance = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.45;
  camera.position.set(distance * 0.38, distance * 0.23, distance);
  camera.lookAt(0, 0, 0);

  const find = (name) => model.getObjectByName(name);
  const left = find("hand_left");
  const right = find("hand_right");
  const bun = find("bun");
  const folder = find("folder_2");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const initial = new Map([left, right, bun, folder].filter(Boolean).map(obj => [obj, obj.position.clone()]));
  let visible = true;
  const visibility = new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting ?? false; });
  visibility.observe(mount);
  const resize = () => {
    const w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();
  const clock = new THREE.Clock();
  let frame = 0;
  function animate() {
    if (!mount.isConnected) {
      visibility.disconnect();
      resizeObserver.disconnect();
      renderer.dispose();
      return;
    }
    if (visible && !document.hidden) {
      const t = clock.getElapsedTime();
      const move = !reduced.matches;
      if (left) left.position.y = initial.get(left).y + (move ? Math.sin(t * 11) * 0.035 : 0);
      if (right) right.position.y = initial.get(right).y + (move ? Math.sin(t * 11 + Math.PI) * 0.035 : 0);
      if (bun) bun.position.y = initial.get(bun).y + (move ? Math.sin(t * 1.5) * 0.015 : 0);
      if (folder) folder.rotation.z = move ? Math.sin(t * 0.9) * 0.025 : 0;
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
  }
  frame = requestAnimationFrame(animate);
}

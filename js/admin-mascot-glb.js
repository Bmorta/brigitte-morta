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
  scene.add(new THREE.HemisphereLight(0xfff5e7, 0x927c79, 2.9));
  const light = new THREE.DirectionalLight(0xffedda, 2.5);
  light.position.set(-3, 6, 8);
  scene.add(light);
  const fill = new THREE.DirectionalLight(0xd6efff, 1.25);
  fill.position.set(4, 2, 3);
  scene.add(fill);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(4.2, 2.8, 7.5);

  const gltf = await new GLTFLoader().loadAsync("models/admin-assistant-3d.glb");
  const model = gltf.scene;
  // trimesh exports Z-up GLB geometry; Three.js expects Y-up.
  // Rotate the complete asset so its head points upward and the desk stays level.
  model.rotation.x = -Math.PI / 2;
  scene.add(model);

  // Warm, colorful palette applied at runtime: no GLB download or Python rerun.
  // Preserve the original asset and assign colors by named mesh.
  const palette = {
    hair_back: 0x794331, hair_cap: 0x794331, side_fringe: 0x874936,
    bun: 0x96533c, bun_highlight: 0xc27b52,
    face: 0xffcfae, neck: 0xffc9a7, nose: 0xf3a58d,
    hand_left: 0xffc9a7, hand_right: 0xffc9a7,
    torso: 0xfff8e9, sleeve_left: 0xfff8e9, sleeve_right: 0xfff8e9,
    skirt: 0x617da2, shoe_left: 0x66535b, shoe_right: 0x66535b,
    laptop_keyboard: 0x76c9c5, laptop_screen: 0x57b6b6,
    laptop_display: 0x203f59, laptop_icon: 0x9df5e7,
    folder_0: 0xffa98c, folder_1: 0xffd46e, folder_2: 0x82d8c0,
    checklist_board: 0xfff8e8
  };
  model.traverse((part) => {
    if (!part.isMesh) return;
    // The GLB carries vertex colors. Neutralize those per-vertex tints
    // before applying our palette so they cannot multiply colors to black.
    const attribute = part.geometry.getAttribute("color");
    if (attribute) {
      const neutral = attribute.clone();
      for (let i = 0; i < neutral.count; i++) {
        neutral.setXYZ(i, 1, 1, 1);
        if (neutral.itemSize === 4) neutral.setW(i, 1);
      }
      part.geometry = part.geometry.clone();
      part.geometry.setAttribute("color", neutral);
    }
    const name = part.name.replace(/_\\d+$/, "");
    const namedColor = palette[part.name] ?? palette[name];
    // Keep unlisted details visible instead of inheriting a broken dark material.
    const fallback = part.name.startsWith("glasses") ? 0x65433c
      : part.name.startsWith("eye") ? 0x343445
      : part.name.startsWith("checklist_line") ? 0x75b4c4
      : part.name.startsWith("folder_tab") ? 0xfff8e9
      : part.name === "desk_top" ? 0xc9986a : 0xf4d8bd;
    const color = namedColor ?? fallback;
    part.material = new THREE.MeshStandardMaterial({
      color,
      vertexColors: false,
      emissive: color,
      emissiveIntensity: 0.12,
      roughness: 0.7,
      metalness: part.name.startsWith("laptop") ? 0.1 : 0
    });
    part.material.needsUpdate = true;
  });

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  camera.lookAt(0, 0, 0);
  const height = bounds.getSize(new THREE.Vector3()).y;
  const distance = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.45;
  // Bring the character closer within the existing robot-sized canvas.
  camera.position.set(distance * 0.30, distance * 0.19, distance * 0.80);
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
      if (left) left.position.y = initial.get(left).y + (move ? Math.sin(t * 8) * 0.025 : 0);
      if (right) right.position.y = initial.get(right).y + (move ? Math.sin(t * 8 + Math.PI) * 0.025 : 0);
      if (bun) bun.position.y = initial.get(bun).y + (move ? Math.sin(t * 1.5) * 0.015 : 0);
      if (folder) folder.rotation.z = move ? Math.sin(t * 0.9) * 0.025 : 0;
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
  }
  frame = requestAnimationFrame(animate);
}

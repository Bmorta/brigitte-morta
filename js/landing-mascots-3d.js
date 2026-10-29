/**
 * Version 2: lightweight procedural 3D mascots.
 * Three.js is loaded only when the mascots are near the viewport.
 * Geometry is generated in code; no external model downloads are required.
 */
const robotMount = document.querySelector(".hub-mascot-robot");
const assistantMount = document.querySelector(".hub-mascot-assistant");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mounts = [robotMount, assistantMount].filter(Boolean);

if (mounts.length && "WebGLRenderingContext" in window) {
  const observer = new IntersectionObserver(async (entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    try {
      const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
      mounts.forEach((mount) => initializeMascot(THREE, mount));
    } catch (error) {
      console.warn("3D mascots could not load; portfolio navigation remains available.", error);
    }
  }, { rootMargin: "180px" });
  mounts.forEach((mount) => observer.observe(mount));
}

function initializeMascot(T, mount) {
  const robot = mount.classList.contains("hub-mascot-robot");
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 1.2, 9.5);
  camera.lookAt(0, 0.35, 0);
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  mount.appendChild(renderer.domElement);

  scene.add(new T.HemisphereLight(0xffffff, robot ? 0x1a4e8c : 0x8d5b36, 2.4));
  const key = new T.DirectionalLight(0xffffff, 3);
  key.position.set(-3, 6, 7);
  scene.add(key);
  const rim = new T.PointLight(robot ? 0x59e6ff : 0xffd38c, 18, 10);
  rim.position.set(3, 2, -1);
  scene.add(rim);

  const root = new T.Group();
  scene.add(root);
  const mat = (color, metalness = 0.05, roughness = 0.45) =>
    new T.MeshStandardMaterial({ color, metalness, roughness });
  const blue = mat(0x50baf2, 0.35);
  const blueLight = mat(0xb9f1ff, 0.2);
  const navy = mat(0x12294c, 0.2);
  const glow = new T.MeshBasicMaterial({ color: 0x86f7ff });
  const gold = mat(0xd5a06a, 0.25);
  const cream = mat(0xffe0b2);
  const skin = mat(0xeab48f);
  const hair = mat(0x392837);
  const laptop = mat(0xb9a2a0, 0.6);
  const sparkMat = new T.MeshBasicMaterial({ color: 0xffe382 });

  function box(parent, w, h, d, material, x, y, z, radius = 0) {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  function ball(parent, r, material, x, y, z, sx = 1, sy = 1, sz = 1) {
    const mesh = new T.Mesh(new T.SphereGeometry(r, 12, 9), material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  }
  function rod(parent, a, b, r, material) {
    const start = new T.Vector3(...a);
    const end = new T.Vector3(...b);
    const delta = end.clone().sub(start);
    const mesh = new T.Mesh(new T.CylinderGeometry(r, r, delta.length(), 10), material);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    parent.add(mesh);
    return mesh;
  }

  let hammer, leftHand, rightHand, head, sparks = [], icons = [];
  if (robot) {
    // Side-profile repair robot, facing RIGHT toward the Programmer card edge.
    // Rounded white shell, blue joints and visor inspired by the supplied reference.
    const shell = mat(0xe9f1ff, 0.25, 0.26);
    const trim = mat(0x26354e, 0.35, 0.32);
    const cyan = new T.MeshBasicMaterial({ color: 0x19c9ff });
    const steel = mat(0x8895a9, 0.8, 0.28);
    root.position.set(-0.18, -0.05, 0);
    root.rotation.y = -0.28;
    // Feet stand on the card's upper border; torso leans toward the strike.
    ball(root, 0.3, shell, -0.62, -1.14, 0.22, 1.5, 0.42, 0.8);
    ball(root, 0.3, shell, 0.18, -1.14, 0.18, 1.5, 0.42, 0.8);
    rod(root, [-0.55, -0.95, 0], [-0.46, -0.54, 0], 0.2, trim);
    rod(root, [0.16, -0.95, 0], [0.12, -0.55, 0], 0.2, trim);
    ball(root, 0.48, shell, -0.22, -0.36, 0, 1.08, 1.1, 0.8);
    ball(root, 0.26, trim, -0.76, -0.35, 0.06);
    ball(root, 0.14, cyan, -0.76, -0.35, 0.29);
    // Helmet and dark face visor, shifted toward the right for side silhouette.
    ball(root, 0.77, shell, -0.04, 0.62, 0.05, 1.04, 0.95, 0.86);
    ball(root, 0.55, navy, 0.32, 0.55, 0.41, 0.98, 0.78, 0.42);
    ball(root, 0.23, cyan, 0.57, 0.54, 0.62, 0.45, 0.17, 0.12);
    ball(root, 0.3, trim, -0.48, 0.7, 0.52);
    ball(root, 0.22, cyan, -0.48, 0.7, 0.7);
    rod(root, [-0.38, 1.27, 0], [-0.55, 1.57, 0], 0.08, shell);
    ball(root, 0.1, cyan, -0.55, 1.57, 0);
    // Shoulder and articulated forearm reach toward the card corner.
    ball(root, 0.27, trim, 0.1, -0.1, 0.52);
    rod(root, [0.1, -0.1, 0.52], [0.62, -0.38, 0.54], 0.19, shell);
    ball(root, 0.19, trim, 0.62, -0.38, 0.54);
    rod(root, [0.62, -0.38, 0.54], [0.92, -0.56, 0.58], 0.16, shell);
    ball(root, 0.2, shell, 0.92, -0.56, 0.58);
    // Pivot is the gripping hand; hammer head strikes downward to the right.
    hammer = new T.Group();
    hammer.position.set(0.92, -0.56, 0.58);
    root.add(hammer);
    rod(hammer, [0, 0, 0], [0.65, 0.54, 0], 0.075, gold);
    const headMesh = box(hammer, 0.36, 0.6, 0.38, steel, 0.65, 0.54, 0);
    headMesh.rotation.z = -0.1;
    // Sparks originate at the real contact side, not near the robot's torso.
    sparks = Array.from({ length: 7 }, (_, i) => {
      const spark = ball(root, 0.055, sparkMat, 1.48, -1.06, 0.64);
      spark.userData.angle = (i / 7) * Math.PI * 2;
      spark.visible = false;
      return spark;
    });
  } else {
    box(root, 1.5, 0.92, 0.7, gold, 0, -0.65, -0.12);
    ball(root, 0.39, skin, 0, 0.55, 0.12, 1, 1.15, 0.83);
    head = new T.Group();
    head.position.set(0, 0.55, 0.12);
    root.add(head);
    ball(head, 0.42, hair, 0, 0.12, -0.12, 1.06, 1.1, 0.8);
    ball(head, 0.34, skin, 0, -0.04, 0.19, 1, 1.05, 0.68);
    ball(head, 0.035, hair, -0.13, -0.02, 0.42);
    ball(head, 0.035, hair, 0.13, -0.02, 0.42);
    rod(root, [-0.7, -0.45, 0.05], [-0.48, -0.91, 0.6], 0.13, skin);
    rod(root, [0.7, -0.45, 0.05], [0.48, -0.91, 0.6], 0.13, skin);
    leftHand = ball(root, 0.14, skin, -0.48, -0.9, 0.6, 1, 0.6, 1);
    rightHand = ball(root, 0.14, skin, 0.48, -0.9, 0.6, 1, 0.6, 1);
    box(root, 1.4, 0.84, 0.09, laptop, 0, -0.62, 0.94).rotation.x = -0.17;
    box(root, 1.65, 0.08, 0.66, laptop, 0, -1.12, 1.2);
    const iconMat = new T.MeshBasicMaterial({ color: 0xfff3d9, transparent: true, opacity: 0.95 });
    for (let i = 0; i < 2; i++) {
      const icon = new T.Group();
      const paper = box(icon, 0.42, 0.56, 0.035, iconMat, 0, 0, 0);
      box(icon, 0.23, 0.035, 0.04, gold, 0, 0.08, 0.04);
      box(icon, 0.23, 0.035, 0.04, gold, 0, -0.04, 0.04);
      icon.position.set(i ? 1.38 : -1.38, 0.9, 0);
      root.add(icon);
      icons.push(icon);
    }
  }

  const resize = () => {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();

  let visible = true;
  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
  });
  visibilityObserver.observe(mount);

  const clock = new T.Clock();
  let frame = 0;
  function render() {
    frame = 0;
    if (!mount.isConnected) {
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      renderer.dispose();
      return;
    }
    if (visible) {
      const t = clock.getElapsedTime();
      if (!reducedMotion.matches) {
        if (robot) {
          const phase = (t % 2.8) / 2.8;
          const swing = phase < 0.21 ? 0.45 :
            phase < 0.29 ? 0.45 - (phase - 0.21) / 0.08 * 1.22 :
            phase < 0.41 ? -0.77 + (phase - 0.29) / 0.12 * 1.22 : 0.45;
          hammer.rotation.z = swing;
          const impact = phase >= 0.285 && phase < 0.36;
          root.position.y = -0.05 + (impact ? Math.sin(t * 100) * 0.022 : 0);
          sparks.forEach((spark) => {
            spark.visible = impact;
            const angle = spark.userData.angle;
            const distance = (phase - 0.285) * 4;
            spark.position.set(1.48 + Math.cos(angle) * distance,
              -1.06 + Math.sin(angle) * distance, 0.64);
          });
        } else {
          leftHand.position.y = -0.9 + Math.sin(t * 17) * 0.07;
          rightHand.position.y = -0.9 + Math.sin(t * 17 + Math.PI) * 0.07;
          head.rotation.z = Math.sin(t * 1.2) * 0.08;
          icons.forEach((icon, i) => {
            const phase = ((t + i * 3) % 6) / 6;
            icon.visible = phase > 0.16 && phase < 0.63;
            icon.position.y = 0.75 + phase * 0.7;
            icon.rotation.z = Math.sin(t * 1.7 + i) * 0.13;
          });
        }
      } else {
        if (robot) {
          hammer.rotation.z = -0.45;
          sparks.forEach((spark) => { spark.visible = false; });
        } else {
          icons.forEach((icon) => { icon.visible = true; });
        }
      }
      renderer.render(scene, camera);
    } else {
      clock.getDelta();
    }
    frame = requestAnimationFrame(render);
  }
  frame = requestAnimationFrame(render);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!frame) {
      frame = requestAnimationFrame(render);
    }
  });
}

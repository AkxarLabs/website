import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Real mesh rendering. The inline SVG remains the no-WebGL/no-JS fallback. */
export async function mountHandsScene(element: HTMLElement) {
  const host = element.querySelector<HTMLElement>('[data-hands-webgl]');
  const hero = element.closest<HTMLElement>('.hero');
  const label = element.querySelector<HTMLElement>('[data-connection-label]');
  const fallback = element.querySelector<SVGElement>('.hands-fallback');
  if (!host || !element.dataset.model) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch {
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const world = new THREE.Group();
  scene.add(world);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentMap = pmrem.fromScene(environment, 0.04);
  scene.environment = environmentMap.texture;
  scene.environmentIntensity = 0.45;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfff8e9, 0x696b6b, 1.1));
  const key = new THREE.DirectionalLight(0xffedd7, 2.1);
  key.position.set(-5, 8, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -19,
    right: 19,
    top: 9,
    bottom: -9,
    near: 0.5,
    far: 45,
  });
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.0002;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd9e7f2, 1.0);
  fill.position.set(8, -1, 7);
  scene.add(fill);
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.13 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 35), shadowMaterial);
  ground.position.z = -2;
  ground.receiveShadow = true;
  scene.add(ground);

  let disposed = false;
  let model: THREE.Group;
  try {
    model = (await new GLTFLoader().loadAsync(element.dataset.model)).scene;
  } catch {
    renderer.dispose();
    environmentMap.dispose();
    return;
  }
  const human = model.getObjectByName('human');
  const robot = model.getObjectByName('robot');
  if (!human || !robot) {
    renderer.dispose();
    environmentMap.dispose();
    return;
  }
  model.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.polygonOffset = true;
        material.polygonOffsetFactor = 1;
        material.polygonOffsetUnits = 1;
      });
    }
    if (object instanceof THREE.Line) {
      // Surface contours are genuine spatial geometry, with depth occlusion.
      object.renderOrder = 1;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.depthWrite = false;
      });
    }
  });
  human.rotation.order = 'ZYX';
  robot.rotation.order = 'ZYX';
  world.add(model);

  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0x9c8a72,
    transparent: true,
    opacity: 0.19,
  });
  for (const angle of [-0.38, 0.46]) {
    const points = Array.from({ length: 97 }, (_, i) => {
      const t = (i / 96) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(t) * 4.4, Math.sin(t) * 1.7, -0.8);
    });
    const orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), orbitMaterial);
    orbit.rotation.z = angle;
    world.add(orbit);
  }
  const connection = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({
    color: 0xc39858,
    roughness: 0.4,
    metalness: 0.3,
    emissive: 0xd4a86d,
    emissiveIntensity: 0.35,
  });
  connection.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 1), gold));
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 48 }, (_, i) => {
        const t = (i / 48) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(t) * 0.24, Math.sin(t) * 0.24, 0.03);
      }),
    ),
    new THREE.LineBasicMaterial({ color: 0xb88b52, transparent: true, opacity: 0.5 }),
  );
  connection.add(ring);
  world.add(connection);

  let visible = true;
  let contextLost = false;
  let raf = 0;
  let targetClasp = 0;
  let clasp = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let previousTime = 0;
  const schedule = () => {
    if (!raf && visible && !disposed && !contextLost && !document.hidden)
      raf = requestAnimationFrame(render);
  };
  const render = (time: number) => {
    raf = 0;
    // Frame-rate-independent damping; no perpetual idle rendering.
    const dt = Math.min((time - previousTime) / 1000 || 1 / 60, 0.2);
    previousTime = time;
    const smoothing = 1 - Math.exp(-9 * dt);
    clasp = reduced.matches ? 1 : THREE.MathUtils.lerp(clasp, targetClasp, smoothing);
    pointerX = reduced.matches ? 0 : THREE.MathUtils.lerp(pointerX, targetX, smoothing);
    pointerY = reduced.matches ? 0 : THREE.MathUtils.lerp(pointerY, targetY, smoothing);
    const apart = 1 - clasp;
    // Rotations happen around the index fingertips, preserving final contact.
    human.position.set(-0.025 - apart * 1.4, apart * 1.15, apart * 0.55);
    human.rotation.set(0.12 + apart * 0.12, -0.06 - apart * 0.38, -0.27 - apart * 0.08);
    robot.position.set(0.025 + apart * 1.4, -apart * 1.15, -apart * 0.45);
    robot.rotation.set(-0.09 - apart * 0.13, Math.PI + 0.12 + apart * 0.38, -0.27 + apart * 0.06);
    world.rotation.set(0.1 + pointerY * 0.13, pointerX * 0.18, 0);
    connection.visible = clasp > 0.96;
    connection.scale.setScalar(THREE.MathUtils.clamp((clasp - 0.96) / 0.04, 0, 1));
    renderer.render(scene, camera);
    element.style.setProperty('--clasp', clasp.toFixed(4));
    hero?.style.setProperty('--clasp', clasp.toFixed(4));
    const connected = clasp > 0.97;
    element.classList.toggle('is-connected', connected);
    if (label) label.textContent = connected ? 'In connection' : 'Scroll to connect';
    if (!contextLost) {
      element.classList.add('has-webgl');
      host.removeAttribute('aria-hidden');
      fallback?.setAttribute('aria-hidden', 'true');
    }
    if (
      Math.abs(clasp - targetClasp) > 0.0001 ||
      Math.abs(pointerX - targetX) > 0.0005 ||
      Math.abs(pointerY - targetY) > 0.0005
    )
      schedule();
  };
  const onScroll = () => {
    const heroTop = hero ? hero.getBoundingClientRect().top + scrollY : 0;
    const p = THREE.MathUtils.clamp((scrollY - heroTop) / Math.min(innerHeight * 0.36, 280), 0, 1);
    targetClasp = reduced.matches ? 1 : p * p * (3 - 2 * p);
    schedule();
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    const worldWidth = THREE.MathUtils.clamp(width / 50, 16.5, 27);
    camera.position.set(
      0,
      0.2,
      worldWidth / camera.aspect / (2 * Math.tan(THREE.MathUtils.degToRad(16))),
    );
    camera.lookAt(0, -0.12, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    schedule();
  };
  const onPointer = (event: PointerEvent) => {
    if (reduced.matches || !finePointer.matches) return;
    const bounds = host.getBoundingClientRect();
    targetX = THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
    targetY = THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
    schedule();
  };
  const resetPointer = () => {
    targetX = 0;
    targetY = 0;
    schedule();
  };
  const onMotion = () => {
    resetPointer();
    onScroll();
  };
  const theme = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    shadowMaterial.opacity = dark ? 0.26 : 0.13;
    orbitMaterial.color.set(dark ? 0xa99a82 : 0x9c8a72);
    model.traverse((object) => {
      if (object instanceof THREE.Line) {
        const material = object.material as THREE.LineBasicMaterial;
        material.color.set(
          dark
            ? material.name === 'robot-ink'
              ? 0x566c75
              : 0x76604a
            : material.name === 'robot-ink'
              ? 0x425860
              : 0x685346,
        );
      }
    });
    schedule();
  };
  const onVisibility = () => {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else schedule();
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (visible) onScroll();
  });
  const resizeObserver = new ResizeObserver(resize);
  const themeObserver = new MutationObserver(theme);
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    contextLost = true;
    element.classList.remove('has-webgl');
    host.setAttribute('aria-hidden', 'true');
    fallback?.removeAttribute('aria-hidden');
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    schedule();
  });
  host.append(renderer.domElement);
  observer.observe(element);
  resizeObserver.observe(host);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  document.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  hero?.addEventListener('pointermove', onPointer, { passive: true });
  hero?.addEventListener('pointerleave', resetPointer);
  window.addEventListener('blur', resetPointer);
  reduced.addEventListener('change', onMotion);
  onScroll();
  resize();
  theme();

  const dispose = () => {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    observer.disconnect();
    resizeObserver.disconnect();
    themeObserver.disconnect();
    document.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    hero?.removeEventListener('pointermove', onPointer);
    hero?.removeEventListener('pointerleave', resetPointer);
    window.removeEventListener('blur', resetPointer);
    reduced.removeEventListener('change', onMotion);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material])
          materials.add(material);
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    environmentMap.dispose();
    key.shadow.dispose();
    renderer.dispose();
  };
  window.addEventListener(
    'pagehide',
    (event) => {
      if (!event.persisted) dispose();
    },
    { once: true },
  );
}

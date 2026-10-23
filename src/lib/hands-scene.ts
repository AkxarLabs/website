import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Real mesh rendering. A static render remains the no-WebGL/no-JS fallback. */
export async function mountHandsScene(element: HTMLElement) {
  const host = element.querySelector<HTMLElement>('[data-hands-webgl]');
  const hero = element.closest<HTMLElement>('.hero');
  const fallback = element.querySelector<HTMLElement>('.hands-fallback');
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
  key.position.set(-3, 6, 16);
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
  key.shadow.radius = 5;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd9e7f2, 1.0);
  fill.position.set(8, -1, 7);
  scene.add(fill);
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.065 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 35), shadowMaterial);
  ground.position.z = -1.8;
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

  // Paper grain is procedural and follows the geometry, with no texture fetch.
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      material.metalness = 0;
      material.roughness = 0.96;
      material.flatShading = true;
      material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vPaperPosition;')
          .replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\nvPaperPosition = position;',
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            '#include <common>\nvarying vec3 vPaperPosition;\nfloat paperGrain(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }',
          )
          .replace(
            '#include <color_fragment>',
            '#include <color_fragment>\ndiffuseColor.rgb *= 1.0 + (paperGrain(vPaperPosition * 210.0) - 0.5) * 0.065;',
          );
      };
    }
  });

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
    // The hands cup the copy from opposite sides, retaining an open center.
    const compact = host.clientWidth <= 900;
    const copyWidth = hero?.querySelector<HTMLElement>('.hero-copy')?.clientWidth ?? 620;
    const edge = compact ? 2.8 : Math.max(5.7, (copyWidth / host.clientWidth) * 12 + 0.3);
    const scale = compact ? 0.8 : 1;
    human.scale.setScalar(scale);
    robot.scale.setScalar(scale);
    human.position.set(-edge - apart * 0.25, (compact ? 1.0 : 1.6) + apart * 0.2, 0.15);
    human.rotation.set(0.22, -0.08 - apart * 0.08, -0.18 - apart * 0.05);
    robot.position.set(edge + apart * 0.25, (compact ? -0.9 : -1.45) - apart * 0.2, -0.1);
    robot.rotation.set(-0.08, Math.PI + 0.08 + apart * 0.08, -0.18 + apart * 0.05);
    world.rotation.set(0.06 + pointerY * 0.07, pointerX * 0.09, 0);
    renderer.render(scene, camera);
    element.style.setProperty('--clasp', clasp.toFixed(4));
    hero?.style.setProperty('--clasp', clasp.toFixed(4));

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
    const worldWidth = width <= 900 ? 12 : 24;
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
    shadowMaterial.opacity = dark ? 0.16 : 0.065;
    renderer.toneMappingExposure = dark ? 0.72 : 0.9;
    model.traverse((object) => {
      if (object instanceof THREE.Line) {
        const material = object.material as THREE.LineBasicMaterial;
        material.color.set(dark ? 0x9c9181 : 0x827666);
      } else if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!(material instanceof THREE.MeshStandardMaterial)) continue;
          material.color.set(
            dark
              ? material.name === 'graphite'
                ? 0x25231e
                : 0x333028
              : material.name === 'graphite'
                ? 0xb9b0a2
                : 0xc9c2b6,
          );
        }
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

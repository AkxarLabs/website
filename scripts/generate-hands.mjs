// Authored geometry: no downloaded models, textures, or runtime mesh generation.
// Run `npm run generate:hands` after changing the sculpture or its ink contours.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { writeFile } from 'node:fs/promises';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

const v = (p) => new THREE.Vector3(...p);
const root = new THREE.Group();
const human = new THREE.Group();
human.name = 'human';
const robot = new THREE.Group();
robot.name = 'robot';
root.add(human, robot);
const skin = new THREE.MeshStandardMaterial({
  name: 'warm-paper',
  color: '#d6b89a',
  roughness: 0.82,
});
const porcelain = new THREE.MeshStandardMaterial({
  name: 'porcelain',
  color: '#c1cdd0',
  roughness: 0.5,
  metalness: 0.22,
});
const graphite = new THREE.MeshStandardMaterial({
  name: 'graphite',
  color: '#45545b',
  roughness: 0.65,
  metalness: 0.45,
});
const ink = new THREE.LineBasicMaterial({
  name: 'human-ink',
  color: '#685346',
  transparent: true,
  opacity: 0.46,
});
const robotInk = new THREE.LineBasicMaterial({
  name: 'robot-ink',
  color: '#425860',
  transparent: true,
  opacity: 0.5,
});
const faintInk = new THREE.LineBasicMaterial({
  name: 'construction-ink',
  color: '#79644e',
  transparent: true,
  opacity: 0.23,
});

const fingers = [
  {
    name: 'index',
    points: [
      [-2.9, 0, 0],
      [-1.9, 0.08, 0.04],
      [-0.85, 0.04, 0.02],
      [-0.18, 0, 0],
    ],
    radii: [0.27, 0.23, 0.195, 0.18],
  },
  {
    name: 'middle',
    points: [
      [-2.9, -0.64, 0],
      [-2.0, -0.85, -0.06],
      [-1.1, -1.1, -0.23],
      [-0.65, -1.32, -0.35],
    ],
    radii: [0.28, 0.245, 0.21, 0.18],
  },
  {
    name: 'ring',
    points: [
      [-3.1, -1.18, -0.02],
      [-2.32, -1.52, -0.16],
      [-1.6, -1.82, -0.4],
      [-1.28, -1.94, -0.52],
    ],
    radii: [0.25, 0.22, 0.185, 0.16],
  },
  {
    name: 'little',
    points: [
      [-3.55, -1.63, -0.06],
      [-2.9, -2.03, -0.15],
      [-2.37, -2.22, -0.38],
      [-2.1, -2.23, -0.49],
    ],
    radii: [0.22, 0.185, 0.16, 0.14],
  },
  {
    name: 'thumb',
    points: [
      [-4.25, -0.1, 0.05],
      [-3.65, 0.66, 0.13],
      [-3.02, 1.08, 0.02],
      [-2.52, 1.08, -0.12],
    ],
    radii: [0.38, 0.31, 0.245, 0.215],
  },
];
const bones = [];
function bone(a, b, ra, rb) {
  const d = b.map((n, i) => n - a[i]);
  bones.push({ a, d, length2: d.reduce((sum, n) => sum + n * n, 0), ra, rb });
}
for (const finger of fingers)
  for (let i = 0; i < 3; i++)
    bone(finger.points[i], finger.points[i + 1], finger.radii[i], finger.radii[i + 1]);
bone([-26, -0.85, -0.05], [-5.5, -0.83, 0], 0.76, 0.43);
bone([-5.6, -0.83, 0], [-4.5, -0.73, 0], 0.43, 0.55);
const ellipsoids = [
  [-3.9, -0.74, 0, 1.5, 0.94, 0.39],
  [-3.9, 0.05, 0.02, 0.79, 0.5, 0.38],
  [-3.45, -1.25, -0.03, 0.75, 0.65, 0.33],
];
const smoothMin = (a, b, k = 0.16) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
function field(x, y, z) {
  let distance = 100;
  for (const e of ellipsoids) {
    const px = x - e[0],
      py = y - e[1],
      pz = z - e[2];
    const k0 = Math.hypot(px / e[3], py / e[4], pz / e[5]);
    const k1 = Math.hypot(px / e[3] ** 2, py / e[4] ** 2, pz / e[5] ** 2);
    distance = smoothMin(distance, (k0 * (k0 - 1)) / Math.max(k1, 0.00001), 0.22);
  }
  for (const b of bones) {
    const px = x - b.a[0],
      py = y - b.a[1],
      pz = z - b.a[2];
    const t = Math.max(0, Math.min(1, (px * b.d[0] + py * b.d[1] + pz * b.d[2]) / b.length2));
    const d =
      Math.hypot(px - t * b.d[0], py - t * b.d[1], (pz - t * b.d[2]) * 1.15) -
      THREE.MathUtils.lerp(b.ra, b.rb, t);
    distance = smoothMin(distance, d);
  }
  return distance;
}

// Surface nets: one vertex per occupied cell, with smooth normals from the
// implicit skin field. The palm, wrist and fingers form one continuous mesh.
const step = 0.085,
  min = [-27, -3.1, -1.2],
  size = [324, 65, 30];
const [nx, ny, nz] = size,
  stride = nx * ny;
const sample = new Float32Array(nx * ny * nz);
const cells = new Int32Array(sample.length).fill(-1);
const offsets = [0, 1, nx, nx + 1, stride, stride + 1, stride + nx, stride + nx + 1];
const corners = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
];
const edges = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [0, 2],
  [1, 3],
  [4, 6],
  [5, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];
for (let z = 0; z < nz; z++)
  for (let y = 0; y < ny; y++)
    for (let x = 0; x < nx; x++)
      sample[x + y * nx + z * stride] = field(
        min[0] + x * step,
        min[1] + y * step,
        min[2] + z * step,
      );
const positions = [],
  normals = [],
  indices = [];
for (let z = 0; z < nz - 1; z++)
  for (let y = 0; y < ny - 1; y++)
    for (let x = 0; x < nx - 1; x++) {
      const i = x + y * nx + z * stride;
      const values = offsets.map((o) => sample[i + o]);
      if (values.every((n) => n >= 0) || values.every((n) => n < 0)) continue;
      const p = [0, 0, 0];
      let count = 0;
      for (const [a, b] of edges)
        if (values[a] < 0 !== values[b] < 0) {
          const t = values[a] / (values[a] - values[b]);
          for (let d = 0; d < 3; d++) p[d] += corners[a][d] + t * (corners[b][d] - corners[a][d]);
          count++;
        }
      for (let d = 0; d < 3; d++) p[d] = min[d] + ([x, y, z][d] + p[d] / count) * step;
      cells[i] = positions.length / 3;
      positions.push(...p);
      const h = 0.015;
      const normal = new THREE.Vector3(
        field(p[0] + h, p[1], p[2]) - field(p[0] - h, p[1], p[2]),
        field(p[0], p[1] + h, p[2]) - field(p[0], p[1] - h, p[2]),
        field(p[0], p[1], p[2] + h) - field(p[0], p[1], p[2] - h),
      ).normalize();
      normals.push(...normal.toArray());
    }
function quad(a, b, c, d) {
  if ([a, b, c, d].some((i) => i < 0)) return;
  const pa = new THREE.Vector3().fromArray(positions, a * 3),
    pb = new THREE.Vector3().fromArray(positions, b * 3),
    pc = new THREE.Vector3().fromArray(positions, c * 3);
  const normal = new THREE.Vector3().fromArray(normals, a * 3);
  if (pb.sub(pa).cross(pc.sub(pa)).dot(normal) > 0) indices.push(a, b, c, a, c, d);
  else indices.push(a, c, b, a, d, c);
}
for (let z = 1; z < nz - 1; z++)
  for (let y = 1; y < ny - 1; y++)
    for (let x = 1; x < nx - 1; x++) {
      const i = x + y * nx + z * stride;
      if (sample[i] < 0 !== sample[i + 1] < 0)
        quad(cells[i], cells[i - nx], cells[i - nx - stride], cells[i - stride]);
      if (sample[i] < 0 !== sample[i + nx] < 0)
        quad(cells[i], cells[i - stride], cells[i - stride - 1], cells[i - 1]);
      if (sample[i] < 0 !== sample[i + stride] < 0)
        quad(cells[i], cells[i - 1], cells[i - 1 - nx], cells[i - nx]);
    }
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
geometry.setIndex(indices);
const sculpture = new THREE.Mesh(geometry, skin);
sculpture.name = 'continuous-skin';
human.add(sculpture);

function stroke(group, points, material = ink) {
  group.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points.map((p) => (Array.isArray(p) ? v(p) : p))),
      material,
    ),
  );
}
function surfaceRing(x, y, z, seed = 0) {
  const points = [];
  for (let i = 0; i <= 32; i++) {
    const theta = (i / 32) * Math.PI * 2;
    let lo = 0,
      hi = 0.025;
    // Find the first boundary; a long ray can otherwise hit a neighboring finger.
    while (hi < 2.6 && field(x, y + Math.cos(theta) * hi, z + Math.sin(theta) * hi) < 0) {
      lo = hi;
      hi += 0.025;
    }
    for (let j = 0; j < 16; j++) {
      const r = (lo + hi) / 2;
      if (field(x, y + Math.cos(theta) * r, z + Math.sin(theta) * r) > 0) hi = r;
      else lo = r;
    }
    const r = hi + 0.018 + Math.sin(i * 2.7 + seed) * 0.004;
    points.push([x, y + Math.cos(theta) * r, z + Math.sin(theta) * r]);
  }
  return points;
}
// Sparse construction loops and longitudinal contours, rather than a dense
// triangulation. Small deterministic irregularities give the ink a drawn feel.
const armRings = [-13, -10, -7.5, -5.6, -4.9, -4.2, -3.55, -2.95].map((x, i) =>
  surfaceRing(x, -0.8, 0, i),
);
for (const ring of armRings) stroke(human, ring);
for (const k of [3, 7, 11, 15])
  stroke(
    human,
    armRings.map((r) => r[k]),
    faintInk,
  );
for (let r = 4; r < armRings.length - 1; r++)
  for (const k of [4, 8, 12]) stroke(human, [armRings[r][k], armRings[r + 1][k + 3]], faintInk);
for (const finger of fingers) {
  for (let i = 1; i < 4; i++) {
    const p = finger.points[i];
    if (finger.name === 'thumb') {
      const radius = finger.radii[i] + 0.022;
      const loop = Array.from({ length: 25 }, (_, j) => {
        const a = (j / 24) * Math.PI * 2;
        return [p[0], p[1] + Math.cos(a) * radius, p[2] + (Math.sin(a) * radius) / 1.15];
      });
      stroke(human, loop);
    } else stroke(human, surfaceRing(...p, i));
  }
  const top = finger.points.map((p, i) => [p[0], p[1], p[2] + finger.radii[i] / 1.15 + 0.022]);
  stroke(human, top, faintInk);
  const tip = finger.points[3],
    radius = finger.radii[3];
  const nail = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 8),
    new THREE.MeshStandardMaterial({ name: 'nail', color: '#e5d0b9', roughness: 0.8 }),
  );
  nail.scale.set(radius * 0.9, radius * 0.7, 0.025);
  nail.position.set(tip[0] - radius * 0.35, tip[1], tip[2] + radius / 1.15 - 0.005);
  human.add(nail);
}

function mesh(group, geometry, material, position) {
  const item = new THREE.Mesh(geometry, material);
  item.position.copy(v(position));
  group.add(item);
  return item;
}
function outlinedBox(group, w, h, d, position, r = 0.12, material = porcelain) {
  const box = mesh(group, new RoundedBoxGeometry(w, h, d, 3, r), material, position);
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry, 18), robotInk);
  box.add(outline);
  // Sketch the flat face on both sides so the ink survives spatial rotation.
  for (const side of [-1, 1]) {
    const x = Math.max(0.01, w / 2 - r - 0.015);
    const y = Math.max(0.01, h / 2 - r - 0.015);
    const z = side * (d / 2 + 0.012);
    stroke(
      box,
      [
        [-x, -y, z],
        [x, -y, z],
        [x, y, z],
        [-x, y, z],
        [-x, -y, z],
      ],
      robotInk,
    );
    for (const [px, py] of [
      [-x, -y],
      [x, -y],
      [x, y],
      [-x, y],
    ]) {
      stroke(
        box,
        [
          [px - 0.035, py, z],
          [px + 0.035, py, z],
        ],
        robotInk,
      );
      stroke(
        box,
        [
          [px, py - 0.035, z],
          [px, py + 0.035, z],
        ],
        robotInk,
      );
    }
  }
  return box;
}
function link(group, a, b, r, material = porcelain) {
  const delta = v(b).sub(v(a));
  const item = mesh(
    group,
    new THREE.CapsuleGeometry(r, Math.max(0.02, delta.length() - r * 2), 6, 12),
    material,
    v(a).add(v(b)).multiplyScalar(0.5).toArray(),
  );
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  return item;
}
const robotPalm = outlinedBox(robot, 2.25, 1.8, 0.67, [-3.8, -0.72, 0], 0.26);
robotPalm.rotation.z = 0.06;
outlinedBox(robot, 1.1, 0.95, 0.1, [-3.95, -0.7, 0.38], 0.12, graphite);
outlinedBox(robot, 1.1, 0.95, 0.1, [-3.95, -0.7, -0.38], 0.12, graphite);
for (const y of [-0.4, -0.72, -1.04])
  outlinedBox(robot, 0.28, 0.04, 0.03, [-4.06, y, -0.45], 0.01, porcelain);
// Inlaid circuit, exposed knuckles, and seam lines sit in 3D on the shell.
stroke(
  robot,
  [
    [-4.3, -0.35, 0.45],
    [-3.87, -0.35, 0.45],
    [-3.65, -0.55, 0.45],
    [-3.65, -1, 0.45],
  ],
  robotInk,
);
for (const y of [-0.4, -0.72, -1.04])
  outlinedBox(robot, 0.28, 0.04, 0.03, [-4.06, y, 0.45], 0.01, porcelain);
link(robot, [-5.15, -0.8, 0], [-5.15, -0.8, 0.01], 0.51, graphite);
outlinedBox(robot, 22, 1.03, 0.82, [-16.45, -0.8, 0], 0.28);
for (const x of [-6.4, -8, -10, -12]) {
  stroke(
    robot,
    [
      [x, -1.31, 0.2],
      [x, -1.2, 0.42],
      [x, -0.4, 0.42],
      [x, -0.29, 0.2],
    ],
    robotInk,
  );
}
for (const finger of fingers) {
  for (let i = 0; i < 3; i++) {
    const a = finger.points[i],
      b = finger.points[i + 1];
    link(robot, a, b, finger.radii[i] * 0.79);
    const joint = mesh(robot, new THREE.SphereGeometry(finger.radii[i] * 0.88, 12, 8), graphite, a);
    joint.scale.z = 0.9;
    const hinge = mesh(
      robot,
      new THREE.CylinderGeometry(finger.radii[i] * 0.58, finger.radii[i] * 0.58, 0.07, 16),
      porcelain,
      [a[0], a[1], a[2] + finger.radii[i] * 0.82],
    );
    hinge.rotation.x = Math.PI / 2;
    const mid = v(a).lerp(v(b), 0.5);
    const normal = v(b).sub(v(a)).normalize();
    const cross = new THREE.Vector3(-normal.y, normal.x, 0).multiplyScalar(finger.radii[i] * 0.82);
    const top = mid.clone().add(new THREE.Vector3(0, 0, finger.radii[i] * 0.8));
    stroke(robot, [top.clone().sub(cross), top, top.clone().add(cross)], robotInk);
  }
  link(
    robot,
    finger.points[3],
    [finger.points[3][0] + 0.06, ...finger.points[3].slice(1)],
    finger.radii[3],
  );
}
// Discrete vertex dots on the construction lines reinforce the sketch model.
const dotGeometry = new THREE.SphereGeometry(0.024, 6, 4);
const dotMaterial = new THREE.MeshBasicMaterial({ name: 'vertex', color: '#6f6458' });
for (const group of [human, robot])
  for (const p of [
    [-5.6, -0.8, 0.45],
    [-4.2, -0.8, 0.42],
    [-3.55, -0.8, 0.42],
    ...fingers.flatMap((f) =>
      f.points.slice(1).map((p, i) => [p[0], p[1], p[2] + f.radii[i + 1] / 1.15 + 0.03]),
    ),
  ])
    mesh(group, dotGeometry, dotMaterial, p);

// Bake the authored components into a handful of material batches. Individual
// contours retain their depth, while mobile GPUs avoid hundreds of draw calls.
for (const hand of [human, robot]) {
  hand.updateMatrixWorld(true);
  const meshBatches = new Map();
  const lineBatches = new Map();
  hand.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const batch = meshBatches.get(object.material) ?? [];
      const geometry = object.geometry.index
        ? object.geometry.toNonIndexed()
        : object.geometry.clone();
      geometry.applyMatrix4(object.matrixWorld);
      batch.push(geometry);
      meshBatches.set(object.material, batch);
    } else if (object instanceof THREE.Line) {
      const batch = lineBatches.get(object.material) ?? [];
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
      const positions = geometry.getAttribute('position');
      for (let i = 0; i < positions.count - 1; i += object instanceof THREE.LineSegments ? 2 : 1) {
        for (const n of [i, i + 1])
          batch.push(positions.getX(n), positions.getY(n), positions.getZ(n));
      }
      lineBatches.set(object.material, batch);
    }
  });
  hand.clear();
  for (const [material, geometries] of meshBatches) {
    const mesh = new THREE.Mesh(mergeVertices(mergeGeometries(geometries)), material);
    mesh.name = material.name === 'warm-paper' ? 'continuous-skin' : material.name;
    hand.add(mesh);
  }
  for (const [material, positions] of lineBatches) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    hand.add(new THREE.LineSegments(geometry, material));
  }
}

const data = await new GLTFExporter().parseAsync(root, { binary: true });
await writeFile(new URL('../public/models/hands.glb', import.meta.url), Buffer.from(data));
console.log(
  `Wrote ${(data.byteLength / 1024).toFixed(0)} KB; skin ${positions.length / 3} vertices, ${indices.length / 3} triangles.`,
);

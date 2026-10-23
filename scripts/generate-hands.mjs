// Authored folded-sheet geometry. Every visible surface is a paper panel;
// there are no spheres, tubes, skin fields, or rounded solid primitives.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { writeFile } from 'node:fs/promises';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

const paper = new THREE.MeshStandardMaterial({
  name: 'paper',
  color: '#c9c2b6',
  roughness: 0.98,
  metalness: 0,
  flatShading: true,
  side: THREE.DoubleSide,
});
const cut = new THREE.MeshStandardMaterial({
  name: 'paper-edge',
  color: '#bdb3a3',
  roughness: 1,
  metalness: 0,
  flatShading: true,
  side: THREE.DoubleSide,
});
const pencil = new THREE.LineBasicMaterial({
  name: 'crease',
  color: '#827666',
  transparent: true,
  opacity: 0.36,
});
const faintPencil = new THREE.LineBasicMaterial({
  name: 'pencil-echo',
  color: '#827666',
  transparent: true,
  opacity: 0.14,
});
const root = new THREE.Group();
const human = new THREE.Group();
human.name = 'human';
const robot = new THREE.Group();
robot.name = 'robot';
robot.scale.x = -1;
root.add(human, robot);
const v = (p) => new THREE.Vector3(...p);

function stroke(group, points, material = pencil) {
  const vertices = points.map((p) => v(p).add(new THREE.Vector3(0, 0, 0.006)));
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(vertices), material));
}
function panels(group, triangles, material = paper) {
  const positions = triangles.flat(2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  group.add(new THREE.Mesh(geometry, material));
}
function quad(a, b, c, d) {
  return [
    [a, b, c],
    [a, c, d],
  ];
}
function mark(group, p) {
  const s = 0.025;
  stroke(
    group,
    [
      [p[0] - s, p[1], p[2] + 0.008],
      [p[0] + s, p[1], p[2] + 0.008],
    ],
    faintPencil,
  );
  stroke(
    group,
    [
      [p[0], p[1] - s, p[2] + 0.008],
      [p[0], p[1] + s, p[2] + 0.008],
    ],
    faintPencil,
  );
}

// A folded paper strip has two broad pitched faces, an underside, and narrow
// cut edges. Each change in pitch is a physical knuckle fold.
function foldedStrip(group, centers, widths, ridges) {
  const ribs = centers.map((p, i) => {
    const before = v(centers[Math.max(0, i - 1)]),
      after = v(centers[Math.min(centers.length - 1, i + 1)]);
    const tangent = after.sub(before).normalize();
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const left = v(p).addScaledVector(normal, widths[i]).toArray();
    const right = v(p).addScaledVector(normal, -widths[i]).toArray();
    const ridge = [p[0], p[1], p[2] + ridges[i]];
    return [left, ridge, right];
  });
  for (let i = 0; i < ribs.length - 1; i++) {
    let a = ribs[i],
      b = ribs[i + 1];
    panels(group, [...quad(a[0], b[0], b[1], a[1]), ...quad(a[1], b[1], b[2], a[2])]);
    const backA = a.map((p) => [p[0], p[1], p[2] - 0.035]);
    const backB = b.map((p) => [p[0], p[1], p[2] - 0.035]);
    panels(group, [
      ...quad(backA[2], backB[2], backB[1], backA[1]),
      ...quad(backA[1], backB[1], backB[0], backA[0]),
    ]);
    panels(
      group,
      [...quad(a[0], backA[0], backB[0], b[0]), ...quad(b[2], backB[2], backA[2], a[2])],
      cut,
    );
    stroke(group, [a[0], b[0]]);
    stroke(group, [a[2], b[2]]);
    stroke(group, [a[1], b[1]], faintPencil);
    if (i > 0) stroke(group, [a[0], a[1], a[2]]);
  }
  const end = ribs.at(-1);
  stroke(group, end);
  for (const rib of ribs.slice(1, -1)) mark(group, rib[1]);
}

// Robot joints are eight-sided folded-paper hinge housings, with a smaller
// inset axle. Their silhouette is mechanical while every face remains paper.
function paperHinge(group, point, radius) {
  const z = point[2] + 0.14;
  const outer = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return [point[0] + Math.cos(angle) * radius, point[1] + Math.sin(angle) * radius, z];
  });
  const inset = outer.map((p) => [
    point[0] + (p[0] - point[0]) * 0.64,
    point[1] + (p[1] - point[1]) * 0.64,
    z + 0.07,
  ]);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    panels(group, quad(outer[i], outer[j], inset[j], inset[i]));
    panels(group, [[inset[i], inset[j], [point[0], point[1], z + 0.075]]], cut);
  }
  stroke(group, [...outer, outer[0]]);
  stroke(group, [...inset, inset[0]], faintPencil);
  stroke(group, [
    [point[0] - radius * 0.28, point[1], z + 0.085],
    [point[0] + radius * 0.28, point[1], z + 0.085],
  ]);
}

// Separate angular finger shells leave real gaps at the hinge axes. Unlike
// the organic paper strips, these links have broad flat backs and blunt pads.
function roboticFinger(group, finger) {
  const points = finger.points.map((p) => [...p]);
  if (finger.name === 'index') points[2] = [-0.75, 0, 0];
  for (let i = 0; i < points.length - 1; i++) {
    const direction = v(points[i + 1])
      .sub(v(points[i]))
      .normalize();
    const start = v(points[i]).addScaledVector(direction, i === 0 ? 0.12 : 0.11);
    const end = v(points[i + 1]).addScaledVector(direction, i === 2 ? 0 : -0.11);
    const normal = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
    const width = Math.max(0.115, finger.widths[i] * 0.82);
    const rib = (center, w) => [
      center
        .clone()
        .addScaledVector(normal, w)
        .add(new THREE.Vector3(0, 0, 0.03))
        .toArray(),
      center
        .clone()
        .addScaledVector(normal, w * 0.66)
        .add(new THREE.Vector3(0, 0, 0.18))
        .toArray(),
      center
        .clone()
        .addScaledVector(normal, -w * 0.66)
        .add(new THREE.Vector3(0, 0, 0.18))
        .toArray(),
      center
        .clone()
        .addScaledVector(normal, -w)
        .add(new THREE.Vector3(0, 0, 0.03))
        .toArray(),
      center
        .clone()
        .addScaledVector(normal, -w * 0.75)
        .add(new THREE.Vector3(0, 0, -0.035))
        .toArray(),
      center
        .clone()
        .addScaledVector(normal, w * 0.75)
        .add(new THREE.Vector3(0, 0, -0.035))
        .toArray(),
    ];
    const a = rib(start, width),
      b = rib(end, width * (i === 2 ? 0.74 : 0.9));
    for (let k = 0; k < 6; k++) panels(group, quad(a[k], b[k], b[(k + 1) % 6], a[(k + 1) % 6]));
    for (let k = 1; k < 5; k++) {
      panels(group, [[a[0], a[k + 1], a[k]]], cut);
      panels(group, [[b[0], b[k], b[k + 1]]], cut);
    }
    stroke(group, [...a, a[0]]);
    stroke(group, [...b, b[0]]);
    stroke(group, [a[1], b[1]], faintPencil);
    stroke(group, [a[2], b[2]], faintPencil);
    // A folded tab sits over each link, like a paper actuator cover.
    const mid = start.clone().lerp(end, 0.52);
    const flap = [
      mid
        .clone()
        .addScaledVector(normal, width * 0.65)
        .add(new THREE.Vector3(0, 0, 0.185)),
      mid
        .clone()
        .addScaledVector(direction, 0.14)
        .add(new THREE.Vector3(0, 0, 0.23)),
      mid
        .clone()
        .addScaledVector(normal, -width * 0.65)
        .add(new THREE.Vector3(0, 0, 0.185)),
    ];
    panels(group, [flap.map((p) => p.toArray())]);
    stroke(
      group,
      flap.map((p) => p.toArray()),
      faintPencil,
    );
  }
  for (let i = 0; i < 3; i++)
    paperHinge(group, points[i], finger.widths[i] * (i === 0 ? 1.02 : 0.94));
}

function roboticPalm(group) {
  const outline = [
    [-5, -0.12, 0.03],
    [-4.65, 0.24, 0.03],
    [-3.25, 0.24, 0.03],
    [-2.91, -0.1, 0.03],
    [-2.91, -1.15, 0.03],
    [-3.35, -1.63, 0.03],
    [-4.65, -1.63, 0.03],
    [-5, -1.22, 0.03],
  ];
  const center = [-3.99, -0.68, 0.34];
  const inset = outline.map((p) => [
    center[0] + (p[0] - center[0]) * 0.74,
    center[1] + (p[1] - center[1]) * 0.74,
    0.34,
  ]);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    panels(group, quad(outline[i], outline[j], inset[j], inset[i]));
    panels(group, [[inset[i], inset[j], center]]);
    const a = [...outline[i]],
      b = [...outline[j]];
    a[2] -= 0.055;
    b[2] -= 0.055;
    panels(group, quad(outline[i], a, b, outline[j]), cut);
    panels(group, [[b, a, [-3.99, -0.68, -0.04]]]);
  }
  stroke(group, [...outline, outline[0]]);
  stroke(group, [...inset, inset[0]]);
  // Converging folded metacarpal rails make the mechanical construction clear.
  for (const [y, endY] of [
    [-0.22, -0.12],
    [-0.65, -0.6],
    [-1.05, -1.08],
  ]) {
    stroke(
      group,
      [
        [-4.55, y, 0.355],
        [-3.9, y, 0.355],
        [-3.28, endY, 0.355],
      ],
      faintPencil,
    );
  }
  paperHinge(group, [-4.63, -0.14, 0.25], 0.11);
  paperHinge(group, [-4.63, -1.23, 0.25], 0.11);
  foldedStrip(
    group,
    [
      [-7.7, -0.66, -0.08],
      [-6.6, -0.65, -0.04],
      [-5.65, -0.65, 0],
    ],
    [0.91, 0.81, 0.63],
    [0.43, 0.36, 0.27],
  );
  // The cuff is separated from the palm by an exposed, faceted paper gimbal.
  paperHinge(group, [-5.34, -0.66, 0], 0.43);
}

// The palm is an origami fan: large planar triangles meet along a raised fold.
function foldedPalm(group) {
  const outline = [
    [-5.25, -0.07, 0.01],
    [-4.45, 0.25, 0.07],
    [-3.5, 0.35, 0.03],
    [-2.8, 0.24, 0.01],
    [-2.75, -0.6, 0.01],
    [-3.05, -1.25, -0.04],
    [-3.55, -1.8, -0.04],
    [-4.5, -1.57, -0.02],
    [-5.3, -1.22, 0.01],
  ];
  const ridge = [-4.02, -0.65, 0.4];
  const underside = [-4.05, -0.67, -0.09];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i],
      b = outline[(i + 1) % outline.length];
    panels(group, [[a, b, ridge]]);
    const ba = [a[0], a[1], a[2] - 0.04],
      bb = [b[0], b[1], b[2] - 0.04];
    panels(group, [[bb, ba, underside]]);
    panels(group, quad(a, ba, bb, b), cut);
    stroke(group, [a, b]);
    // Only structural folds are traced; the remaining folds read through light.
    if (i % 2 === 0) stroke(group, [a, ridge], faintPencil);
  }
  mark(group, ridge);
  foldedStrip(
    group,
    [
      [-7.7, -0.66, -0.08],
      [-6.8, -0.65, -0.04],
      [-5.25, -0.65, 0],
    ],
    [0.91, 0.82, 0.6],
    [0.43, 0.36, 0.27],
  );
}
const fingers = [
  {
    name: 'index',
    points: [
      [-2.9, 0, 0],
      [-1.87, 0.07, 0.03],
      [-0.75, 0.03, 0.015],
      [0, 0, 0],
    ],
    widths: [0.28, 0.245, 0.19, 0.004],
    folds: [0.18, 0.16, 0.12, 0],
  },
  {
    name: 'middle',
    points: [
      [-2.9, -0.58, 0],
      [-2.02, -0.77, -0.02],
      [-1.3, -0.93, -0.24],
      [-1.08, -0.88, -0.49],
    ],
    widths: [0.28, 0.245, 0.2, 0.025],
    folds: [0.18, 0.16, 0.1, 0.02],
  },
  {
    name: 'ring',
    points: [
      [-3.1, -1.13, -0.02],
      [-2.34, -1.44, -0.1],
      [-1.8, -1.52, -0.4],
      [-1.65, -1.45, -0.63],
    ],
    widths: [0.245, 0.22, 0.18, 0.02],
    folds: [0.16, 0.13, 0.09, 0.01],
  },
  {
    name: 'little',
    points: [
      [-3.55, -1.62, -0.03],
      [-2.96, -1.91, -0.14],
      [-2.52, -1.9, -0.39],
      [-2.4, -1.81, -0.57],
    ],
    widths: [0.205, 0.18, 0.145, 0.02],
    folds: [0.14, 0.12, 0.07, 0.01],
  },
  {
    name: 'thumb',
    points: [
      [-4.43, -0.04, 0.07],
      [-3.82, 0.65, 0.16],
      [-3.18, 1.07, 0.04],
      [-2.68, 0.96, -0.11],
    ],
    widths: [0.36, 0.31, 0.23, 0.025],
    folds: [0.2, 0.17, 0.1, 0.01],
  },
];
for (const [hand, mechanical] of [
  [human, false],
  [robot, true],
]) {
  if (mechanical) {
    roboticPalm(hand);
    for (const finger of fingers) roboticFinger(hand, finger);
  } else {
    foldedPalm(hand);
    for (const finger of fingers) foldedStrip(hand, finger.points, finger.widths, finger.folds);
  }
}

// Batch panels and creases by material. The paper surfaces retain their flat
// normals, while the scene needs only a few draw calls on mobile.
for (const hand of [human, robot]) {
  const meshBatches = new Map(),
    lineBatches = new Map();
  for (const object of [...hand.children]) {
    if (object instanceof THREE.Mesh) {
      const batch = meshBatches.get(object.material) ?? [];
      batch.push(object.geometry);
      meshBatches.set(object.material, batch);
    } else if (object instanceof THREE.Line) {
      const batch = lineBatches.get(object.material) ?? [];
      const p = object.geometry.getAttribute('position');
      for (let i = 0; i < p.count - 1; i++)
        for (const n of [i, i + 1]) batch.push(p.getX(n), p.getY(n), p.getZ(n));
      lineBatches.set(object.material, batch);
    }
  }
  hand.clear();
  for (const [material, geometries] of meshBatches)
    hand.add(new THREE.Mesh(mergeVertices(mergeGeometries(geometries)), material));
  for (const [material, positions] of lineBatches) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    hand.add(new THREE.LineSegments(geometry, material));
  }
}
const data = await new GLTFExporter().parseAsync(root, { binary: true });
await writeFile(new URL('../public/models/hands.glb', import.meta.url), Buffer.from(data));
console.log(`Wrote ${(data.byteLength / 1024).toFixed(0)} KB of folded paper panels and creases.`);

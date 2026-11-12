/**
 * The 3D studio: a procedural set of five fingers wearing the current design.
 * Deliberately built from primitives rather than a downloaded hand model —
 * it stays on-brand, loads instantly and never 404s.
 *
 * Browser-only; imported dynamically from client components.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { NailDesign } from "@/lib/nail-design";
import {
  createNailGroup,
  disposeNailGroup,
  nailHeight,
} from "@/components/nail-3d/nail-geometry";

export type NailStudio = {
  setDesign(design: NailDesign): void;
  setAutoRotate(enabled: boolean): void;
  resize(): void;
  dispose(): void;
};

type FingerSpec = {
  x: number;
  body: number;
  radius: number;
  tilt: number;
  drop: number;
};

const FINGERS: FingerSpec[] = [
  { x: -1.06, body: 1.5, radius: 0.23, tilt: -0.17, drop: 0.16 },
  { x: -0.54, body: 1.76, radius: 0.235, tilt: -0.08, drop: 0.26 },
  { x: 0, body: 1.86, radius: 0.24, tilt: 0, drop: 0.3 },
  { x: 0.54, body: 1.62, radius: 0.225, tilt: 0.09, drop: 0.18 },
  { x: 1.06, body: 1.22, radius: 0.195, tilt: 0.18, drop: -0.02 },
];

const BASE_LINE = -1.25;
const VIEW_HEIGHT = 3.5;
const VIEW_WIDTH = 3.6;

/** Soft radial pool used as a fake contact shadow under the fingers. */
function createShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    4,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(18, 16, 14, 0.34)");
  gradient.addColorStop(0.55, "rgba(18, 16, 14, 0.12)");
  gradient.addColorStop(1, "rgba(18, 16, 14, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createNailStudio(
  canvas: HTMLCanvasElement,
  initialDesign: NailDesign
): NailStudio {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  scene.environment = environment;
  room.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(3.4, 5.2, 4.2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.75);
  fill.position.set(-4.2, 1.6, 2.4);
  scene.add(fill);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfc2, 0.55));

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  const viewDirection = new THREE.Vector3(0, 0.09, 1).normalize();
  camera.position.set(0, 0.7, 7.4);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 2.6;
  controls.maxDistance = 11;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 2.15;
  controls.minAzimuthAngle = -0.75;
  controls.maxAzimuthAngle = 0.75;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.75;
  controls.target.set(0, 0.05, 0);

  const display = new THREE.Group();
  display.position.y = -0.15;
  scene.add(display);

  // Contact shadow.
  const shadowTexture = createShadowTexture();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 4.4),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = BASE_LINE - 0.06;
  shadow.position.z = -0.15;
  display.add(shadow);

  // Fingers.
  const skin = new THREE.MeshPhysicalMaterial({
    color: 0xe9c6b0,
    roughness: 0.62,
    metalness: 0,
    clearcoat: 0.14,
    clearcoatRoughness: 0.6,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xffe6da),
    sheenRoughness: 0.8,
  });

  const fingerGroups: THREE.Group[] = [];

  for (const spec of FINGERS) {
    const group = new THREE.Group();

    const geometry = new THREE.CapsuleGeometry(spec.radius, spec.body, 12, 32);
    const finger = new THREE.Mesh(geometry, skin);
    group.add(finger);

    group.rotation.z = spec.tilt;
    group.position.set(spec.x, BASE_LINE + spec.body / 2 + spec.radius + spec.drop, 0);
    display.add(group);
    fingerGroups.push(group);
  }

  // Nails, one per finger, driven by the current design.
  let nailGroups: THREE.Group[] = [];

  function applyDesign(design: NailDesign) {
    for (const nail of nailGroups) {
      nail.parent?.remove(nail);
      disposeNailGroup(nail);
    }

    nailGroups = fingerGroups.map((fingerGroup, index) => {
      const spec = FINGERS[index];
      const nail = createNailGroup(design);
      const height = nailHeight(design.length);
      const topY = spec.body / 2 + spec.radius;

      nail.position.set(0, topY - height * 0.34, spec.radius * 0.72);
      nail.rotation.x = -0.2;
      nail.rotation.z = spec.tilt * 0.35;

      fingerGroup.add(nail);
      return nail;
    });
  }

  applyDesign(initialDesign);

  function fitCamera() {
    const aspect = camera.aspect || 1;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const distanceForHeight = VIEW_HEIGHT / 2 / Math.tan(vFov / 2);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const distanceForWidth = VIEW_WIDTH / 2 / Math.tan(hFov / 2);
    const distance = Math.max(distanceForHeight, distanceForWidth);

    camera.position
      .copy(controls.target)
      .addScaledVector(viewDirection, distance);
    camera.updateProjectionMatrix();
    controls.update();
  }

  function resize() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    fitCamera();
  }

  let frame = 0;
  function loop() {
    frame = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  }

  resize();
  loop();

  return {
    setDesign(design: NailDesign) {
      applyDesign(design);
    },
    setAutoRotate(enabled: boolean) {
      controls.autoRotate = enabled;
    },
    resize,
    dispose() {
      cancelAnimationFrame(frame);
      controls.dispose();
      for (const nail of nailGroups) disposeNailGroup(nail);
      nailGroups = [];
      display.traverse((child) => {
        if (child instanceof THREE.Mesh) child.geometry.dispose();
      });
      skin.dispose();
      shadowTexture.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

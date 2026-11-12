/**
 * Camera try-on.
 *
 * Hand landmarks come from MediaPipe's HandLandmarker (model + wasm are
 * served from /public, so there is no CDN dependency at runtime). Each
 * fingernail is a Three.js nail mesh from the same geometry pipeline the 3D
 * studio uses, positioned and rotated from the DIP→TIP vector of its finger.
 *
 * Browser-only; imported dynamically from the try-on client component.
 */
import * as THREE from "three";
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { NailDesign } from "@/lib/nail-design";
import {
  createNailGroup,
  disposeNailGroup,
  nailHeight,
} from "@/components/nail-3d/nail-geometry";

export type ArStatus =
  | { state: "requesting-camera" }
  | { state: "loading-model" }
  | { state: "running"; hands: number }
  | { state: "error"; message: string };

export type ArTryOn = {
  setDesign(design: NailDesign): void;
  dispose(): void;
};

/** DIP (knuckle-side) and TIP landmark indices per finger. */
const FINGERS: { dip: number; tip: number; weight: number }[] = [
  { dip: 3, tip: 4, weight: 0.95 }, // thumb  (IP → TIP)
  { dip: 7, tip: 8, weight: 1 }, // index
  { dip: 11, tip: 12, weight: 1 }, // middle
  { dip: 15, tip: 16, weight: 0.96 }, // ring
  { dip: 19, tip: 20, weight: 0.9 }, // pinky
];

const MAX_HANDS = 2;
const SMOOTHING = 0.45;

type Placed = { x: number; y: number; angle: number; scale: number };

export async function createArTryOn(options: {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  design: NailDesign;
  onStatus?: (status: ArStatus) => void;
}): Promise<ArTryOn> {
  const { video, canvas, onStatus } = options;
  let design = options.design;

  const report = (status: ArStatus) => onStatus?.(status);

  /* ------------------------------- camera feed ------------------------------ */
  report({ state: "requesting-camera" });

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === "NotAllowedError"
        ? "Camera permission was blocked. Allow camera access, then try again."
        : error instanceof DOMException && error.name === "NotFoundError"
          ? "No camera was found on this device."
          : "The camera could not be started.";
    report({ state: "error", message });
    throw new Error(message);
  }

  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play().catch(() => undefined);

  /* -------------------------------- hand model ------------------------------ */
  report({ state: "loading-model" });

  let landmarker: HandLandmarker;
  try {
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");

    const create = (delegate: "GPU" | "CPU") =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/hand_landmarker.task",
          delegate,
        },
        runningMode: "VIDEO",
        numHands: MAX_HANDS,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

    try {
      landmarker = await create("GPU");
    } catch {
      // Some machines/drivers have no usable WebGL delegate for the model.
      landmarker = await create("CPU");
    }
  } catch (error) {
    console.error("Hand tracking failed to initialise", error);
    stream.getTracks().forEach((track) => track.stop());
    const message =
      "Hand tracking could not load. Check your connection and try again.";
    report({ state: "error", message });
    throw new Error(message);
  }

  /* ---------------------------------- three --------------------------------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  scene.environment = environment;
  room.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(0.4, 1, 1);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffffff, 0.8);
  rim.position.set(-1, -0.4, 0.6);
  scene.add(rim);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);
  camera.position.z = 5;

  // Two hands × five fingers, created up front and toggled by tracking.
  let nailGroups: THREE.Group[] = [];

  function buildNails(next: NailDesign) {
    for (const group of nailGroups) {
      scene.remove(group);
      disposeNailGroup(group);
    }
    design = next;
    nailGroups = [];

    for (let hand = 0; hand < MAX_HANDS; hand += 1) {
      for (let finger = 0; finger < FINGERS.length; finger += 1) {
        const group = createNailGroup(design);
        // A mirrored selfie view can invert what the renderer considers
        // front-facing, so nails are drawn from both sides in AR.
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            for (const material of materials) {
              material.side = THREE.DoubleSide;
            }
          }
        });
        group.visible = false;
        scene.add(group);
        nailGroups.push(group);
      }
    }
  }

  buildNails(design);

  /* -------------------------------- placement -------------------------------- */
  const previous: (Placed[] | null)[] = [null, null];

  /** Normalised landmark (y down) → world units (y up), mirrored to the preview. */
  function toWorld(nx: number, ny: number, width: number, height: number) {
    return {
      x: (1 - nx) * width - width / 2,
      y: height / 2 - ny * height,
    };
  }

  function placeHand(
    handIndex: number,
    landmarks: { x: number; y: number }[],
    width: number,
    height: number
  ) {
    const target: Placed[] = [];
    let visible = true;

    for (let finger = 0; finger < FINGERS.length; finger += 1) {
      const spec = FINGERS[finger];
      const dip = toWorld(
        landmarks[spec.dip].x,
        landmarks[spec.dip].y,
        width,
        height
      );
      const tip = toWorld(
        landmarks[spec.tip].x,
        landmarks[spec.tip].y,
        width,
        height
      );

      const dx = tip.x - dip.x;
      const dy = tip.y - dip.y;
      const length = Math.hypot(dx, dy);

      // Too short means the finger is edge-on or the landmark is unreliable.
      if (length < 6) {
        visible = false;
        target.push({ x: dip.x, y: dip.y, angle: 0, scale: 0.0001 });
        continue;
      }

      const dirX = dx / length;
      const dirY = dy / length;
      const height_ = nailHeight(design.length);

      target.push({
        x: dip.x + dirX * length * 0.42,
        y: dip.y + dirY * length * 0.42,
        // Rotation about z maps local +Y to (−sin θ, cos θ).
        angle: Math.atan2(-dirX, dirY),
        scale: ((length * 1.7) / height_) * spec.weight,
      });
    }

    const previousHand = previous[handIndex];
    const smoothed: Placed[] = target.map((placed, index) => {
      const before = previousHand?.[index];
      if (!before) return placed;
      return {
        x: before.x + (placed.x - before.x) * SMOOTHING,
        y: before.y + (placed.y - before.y) * SMOOTHING,
        angle: before.angle + (placed.angle - before.angle) * SMOOTHING,
        scale: before.scale + (placed.scale - before.scale) * SMOOTHING,
      };
    });
    previous[handIndex] = smoothed;

    for (let finger = 0; finger < FINGERS.length; finger += 1) {
      const group = nailGroups[handIndex * FINGERS.length + finger];
      const placed = smoothed[finger];
      group.visible = visible;
      group.position.set(placed.x, placed.y, 0);
      group.rotation.z = placed.angle;
      group.scale.setScalar(placed.scale);
    }

    return visible;
  }

  function hideHand(handIndex: number) {
    previous[handIndex] = null;
    for (let finger = 0; finger < FINGERS.length; finger += 1) {
      nailGroups[handIndex * FINGERS.length + finger].visible = false;
    }
  }

  function resize() {
    const width = canvas.clientWidth || video.clientWidth || 1;
    const height = canvas.clientHeight || video.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
  }

  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  /* --------------------------------- tracking -------------------------------- */
  let frame = 0;
  let lastDetect = 0;
  let disposed = false;
  let lastHandCount = -1;

  function tick() {
    if (disposed) return;
    frame = requestAnimationFrame(tick);

    const now = performance.now();
    // Tracking at ~24fps is plenty and leaves the main thread breathing.
    if (video.readyState >= 2 && now - lastDetect > 40) {
      lastDetect = now;
      let result: HandLandmarkerResult | null = null;
      try {
        result = landmarker.detectForVideo(video, now);
      } catch (error) {
        console.error("Hand tracking frame failed", error);
      }

      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      const hands = result?.landmarks ?? [];

      let drawn = 0;
      for (let index = 0; index < MAX_HANDS; index += 1) {
        const landmarks = hands[index];
        if (landmarks && placeHand(index, landmarks, width, height)) {
          drawn += 1;
        } else {
          hideHand(index);
        }
      }

      if (drawn !== lastHandCount) {
        lastHandCount = drawn;
        report({ state: "running", hands: drawn });
      }
    }

    renderer.render(scene, camera);
  }

  report({ state: "running", hands: 0 });
  tick();

  return {
    setDesign(next: NailDesign) {
      buildNails(next);
      previous[0] = null;
      previous[1] = null;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      landmarker.close();
      for (const group of nailGroups) disposeNailGroup(group);
      nailGroups = [];
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

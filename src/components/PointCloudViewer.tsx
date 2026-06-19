import { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// FuelStrat3D 核心查看器:密集森林点云 → 4 垂直燃料层。
// 模式:RGB / Ground truth / Prediction(真实逐层误差)/ Errors(红=错)/ Fire pathway(垂直燃料连通性→树冠火风险)。
// ⚠️ 程序化占位森林;训练出真实瓦片后替换 generatePlaceholder。

type Mode = "rgb" | "gt" | "pred" | "err" | "fire";
type Layer = "surface" | "near" | "elevated" | "canopy";

const LAYER_COLOR: Record<Layer, [number, number, number]> = {
  surface: [0.46, 0.33, 0.20], near: [0.66, 0.78, 0.30],
  elevated: [0.92, 0.56, 0.20], canopy: [0.22, 0.70, 0.38],
};
const LAYER_ERR: Record<Layer, number> = { surface: 0.30, near: 0.32, elevated: 0.46, canopy: 0.10 };
const CONFUSE: Record<Layer, Layer> = { surface: "near", near: "surface", elevated: "canopy", canopy: "elevated" };
const LAYERS: Layer[] = ["surface", "near", "elevated", "canopy"];

function riskColor(r: number): [number, number, number] {
  if (r < 0.5) { const t = r / 0.5; return [0.20 + t * 0.75, 0.26 + t * 0.30, 0.45 - t * 0.30]; }
  const t = (r - 0.5) / 0.5; return [0.95 + t * 0.05, 0.56 - t * 0.42, 0.16 - t * 0.06];
}

// 圆形柔光点贴图(让点变圆 + 边缘发光)
function softCircleTexture() {
  const s = 64, c = document.createElement("canvas"); c.width = c.height = s;
  const g = c.getContext("2d")!; const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.45, "rgba(255,255,255,0.85)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}

function generatePlaceholder() {
  type Pt = { x: number; y: number; z: number; layer: Layer; nat: [number, number, number] };
  const P: Pt[] = [];
  let seed = 11; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const add = (x: number, y: number, z: number, layer: Layer, nat: [number, number, number]) => P.push({ x, y, z, layer, nat });
  const inSphere = (): [number, number, number] => { let x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1); return [x, y, z]; };
  const SPAN = 34;

  // 地表(密)
  for (let i = 0; i < 34000; i++) { const x = (rnd() - 0.5) * SPAN, y = (rnd() - 0.5) * SPAN; add(x, y, rnd() * 0.22, "surface", [0.38 + rnd() * 0.12, 0.29 + rnd() * 0.05, 0.2]); }
  // 散布灌木丛(近地表)
  for (let c = 0; c < 70; c++) { const bx = (rnd() - 0.5) * SPAN, by = (rnd() - 0.5) * SPAN; for (let i = 0; i < 240; i++) { const [dx, dy, dz] = inSphere(); add(bx + dx * 1.6, by + dy * 1.6, 0.2 + Math.abs(dz) * 1.8, "near", [0.5 + rnd() * 0.22, 0.62 + rnd() * 0.1, 0.24]); } }

  // 树
  const NT = 46;
  for (let t = 0; t < NT; t++) {
    const cx = (rnd() - 0.5) * (SPAN - 6), cy = (rnd() - 0.5) * (SPAN - 6), h = 10 + rnd() * 11;
    const ladder = rnd();
    const canopyBase = ladder > 0.5 ? 2 + rnd() * 2.2 : h * 0.5 + rnd() * 2.5;
    // 树干(密)
    for (let i = 0; i < 520; i++) {
      const zz = rnd() * h;
      if (ladder < 0.45 && zz > 2.4 && zz < canopyBase && rnd() > 0.22) continue; // 断层
      add(cx + (rnd() - 0.5) * 0.55, cy + (rnd() - 0.5) * 0.55, zz, "elevated", [0.33 + rnd() * 0.06, 0.23, 0.16]);
    }
    // 连续梯燃料(树干周围灌木填到冠基)
    if (ladder > 0.5) for (let i = 0; i < 340; i++) { const a = rnd() * 6.28, r = rnd() * 1.7; add(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.4 + rnd() * (canopyBase - 1.0), "near", [0.55, 0.64, 0.26]); }
    // 实心椭球冠层(密)
    const crownR = 2.6 + rnd() * 1.4, crownTop = h + 1.2, crownCz = (canopyBase + crownTop) / 2, crownH = (crownTop - canopyBase) / 2;
    const npts = 2600 + Math.floor(rnd() * 1200);
    for (let i = 0; i < npts; i++) { const [vx, vy, vz] = inSphere(); const gnd = 0.42 + rnd() * 0.28; add(cx + vx * crownR, cy + vy * crownR, crownCz + vz * crownH, "canopy", [0.12 + rnd() * 0.1, gnd, 0.18 + rnd() * 0.08]); }
  }

  // 垂直连通性 → 树冠火风险(3m 网格)
  const CELL = 3, BIN = 0.5;
  const cells = new Map<string, { bins: Set<number>; canopy: boolean }>();
  for (const p of P) { const k = `${Math.floor(p.x / CELL)},${Math.floor(p.y / CELL)}`; let c = cells.get(k); if (!c) { c = { bins: new Set(), canopy: false }; cells.set(k, c); } c.bins.add(Math.floor(p.z / BIN)); if (p.layer === "canopy") c.canopy = true; }
  const cellRisk = new Map<string, number>();
  for (const [k, c] of cells) { if (!c.canopy) { cellRisk.set(k, 0.1); continue; } const b = [...c.bins].sort((a, z) => a - z); let g = 0; for (let i = 1; i < b.length; i++) g = Math.max(g, (b[i] - b[i - 1]) * BIN); cellRisk.set(k, Math.max(0.08, Math.min(1, 1 - g / 3.2))); }

  const pos: number[] = [], rgb: number[] = [], gt: number[] = [], pred: number[] = [], err: number[] = [], fire: number[] = [];
  for (const p of P) {
    pos.push(p.x, p.z, p.y); rgb.push(...p.nat); gt.push(...LAYER_COLOR[p.layer]);
    const wrong = rnd() < LAYER_ERR[p.layer]; const plyr = wrong ? (rnd() < 0.75 ? CONFUSE[p.layer] : LAYERS[Math.floor(rnd() * 4)]) : p.layer;
    pred.push(...LAYER_COLOR[plyr]); err.push(...(wrong ? [1.0, 0.18, 0.16] : [0.20, 0.22, 0.26]));
    fire.push(...riskColor(cellRisk.get(`${Math.floor(p.x / CELL)},${Math.floor(p.y / CELL)}`) ?? 0.1));
  }
  return { position: new Float32Array(pos), rgb: new Float32Array(rgb), gt: new Float32Array(gt), pred: new Float32Array(pred), err: new Float32Array(err), fire: new Float32Array(fire), n: P.length };
}

function Cloud({ mode, data, tex }: { mode: Mode; data: ReturnType<typeof generatePlaceholder>; tex: THREE.Texture }) {
  const colors = mode === "rgb" ? data.rgb : mode === "pred" ? data.pred : mode === "err" ? data.err : mode === "fire" ? data.fire : data.gt;
  const geom = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(data.position, 3)); g.setAttribute("color", new THREE.BufferAttribute(colors, 3)); return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, data]);
  return (
    <points geometry={geom}>
      <pointsMaterial size={0.34} map={tex} alphaTest={0.12} transparent depthWrite={false}
        vertexColors sizeAttenuation blending={mode === "fire" || mode === "err" ? THREE.AdditiveBlending : THREE.NormalBlending} />
    </points>
  );
}

// Bloom 辉光;火灾模式让强度像余烬一样脉动呼吸
function Fx({ mode }: { mode: Mode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bloom = useRef<any>(null);
  const base = mode === "fire" ? 1.45 : mode === "err" ? 1.1 : 0.7;
  const amp = mode === "fire" ? 0.6 : 0;
  useFrame(({ clock }) => {
    if (bloom.current) bloom.current.intensity = base + amp * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.4));
  });
  return (
    <EffectComposer>
      <Bloom ref={bloom} mipmapBlur intensity={base} radius={0.75} luminanceSmoothing={0.5}
        luminanceThreshold={mode === "fire" || mode === "err" ? 0.12 : 0.28} />
    </EffectComposer>
  );
}

const LABELS: Record<Mode, string> = { rgb: "RGB", gt: "Ground truth", pred: "Prediction", err: "Errors", fire: "Fire pathway" };
const HINT: Record<Mode, string> = {
  rgb: "raw point cloud · 4 vertical fuel strata · drag to orbit",
  gt: "ground-truth fuel strata · surface · near-surface · elevated/ladder · canopy",
  pred: "model prediction · toggle Errors to see where it struggles",
  err: "red = misclassified — errors concentrate on thin stems & ladder fuel",
  fire: "crown-fire risk from vertical fuel continuity — red = continuous ladder (surface→canopy), fire can climb",
};

export default function PointCloudViewer() {
  const [mode, setMode] = useState<Mode>("fire");
  const data = useMemo(generatePlaceholder, []);
  const tex = useMemo(softCircleTexture, []);
  return (
    <div className="viewer">
      <div className="controls">
        {(["rgb", "gt", "pred", "err", "fire"] as Mode[]).map((m) => (
          <button key={m} className={`btn ${mode === m ? "active" : ""} ${m === "fire" ? "fire-btn" : ""}`} onClick={() => setMode(m)}>{LABELS[m]}</button>
        ))}
      </div>
      <div className="viewer-badge">Illustrative · synthetic point cloud</div>
      <div className="viewer-hint">{HINT[mode]}</div>
      <Canvas camera={{ position: [17, 11, 19], fov: 46 }} dpr={[1, 2]}>
        <color attach="background" args={["#070b10"]} />
        <fogExp2 attach="fog" args={["#070b10", 0.022]} />
        <Cloud mode={mode} data={data} tex={tex} />
        <OrbitControls enableDamping autoRotate autoRotateSpeed={0.45} target={[0, 7, 0]} minDistance={10} maxDistance={60} />
        <Fx mode={mode} />
      </Canvas>
    </div>
  );
}

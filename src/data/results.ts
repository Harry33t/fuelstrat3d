// 实验结果数据契约 —— 训练跑完后把真实数字填进 PLACEHOLDER 处即可。
// ⚠️ 当前为占位值(标注 placeholder),仅用于前端联调;真实结果来自 PTv3 + Point-MAE 实验。

export const CLASS_NAMES = [
  "low_vegetation",
  "terrain",
  "stem",
  "live_branches",
  "woody_branches",
] as const;
export type ClassName = (typeof CLASS_NAMES)[number];

// 燃料层"解读"映射(stretch):把语义类对应到燃料层,用于叙事
export const FUEL_LAYER_LABEL: Record<ClassName, string> = {
  terrain: "Surface",
  low_vegetation: "Near-surface",
  stem: "Elevated / ladder",
  woody_branches: "Elevated / ladder",
  live_branches: "Canopy",
};

/** 标签效率曲线:每个标签比例下,从零训练 vs 自监督预训练的 mIoU */
export interface LabelEffPoint {
  labelFrac: number; // 5 / 10 / 20 / 100 (%)
  scratch: number; // 从零 mIoU(✅ 真实:PTv3 20ep grid0.2)
  pretrained?: number | null; // 自监督预训练 mIoU(待测,下一步)
}

/** ✅ scratch 为真实结果(PTv3 from-scratch);pretrained 待自监督实验 */
export const labelEfficiency: LabelEffPoint[] = [
  { labelFrac: 5, scratch: 0.404, pretrained: null },
  { labelFrac: 10, scratch: 0.468, pretrained: null },
  { labelFrac: 20, scratch: 0.498, pretrained: null },
  { labelFrac: 100, scratch: 0.485, pretrained: null },
];

export const SITES = ["NIBIO", "CULS", "TUWIEN", "RMIT", "SCION"] as const;
export const FIRE_SITES = ["RMIT", "SCION"]; // 火灾相关站点(高亮)

/** Leave-one-site-out:训练其余 4 站点,在 held-out 站点测的 mIoU(✅ 真实 PTv3 全监督)。
 *  与 in-domain 参考(~0.48)的落差 = 跨站点域差距,正是方法要补的 gap。 */
export interface LosoResult {
  site: string;
  miou: number;
  fire: boolean;
}
export const losoLeaveOneOut: LosoResult[] = [
  { site: "CULS", miou: 0.627, fire: false },
  { site: "SCION", miou: 0.445, fire: true },
  { site: "RMIT", miou: 0.339, fire: true },
  { site: "TUWIEN", miou: 0.322, fire: false },
  { site: "NIBIO", miou: 0.310, fire: false },
];
export const inDomainRefMIoU = 0.48; // in-domain 全监督参考(标签效率 20%/100% 量级)

/** 校准曲线:置信度区间 vs 实际准确率(conformal/可靠性) */
export interface CalibPoint {
  confidence: number; // 0..1
  accuracy: number; // 0..1
}
/** ⚠️ PLACEHOLDER */
export const calibration: CalibPoint[] = Array.from({ length: 11 }, (_, i) => {
  const c = i / 10;
  return { confidence: c, accuracy: Math.max(0, Math.min(1, c - 0.04 + 0.03 * Math.sin(c * 6))) };
});

/** 每类 IoU(in-domain baseline) ✅ 真实:PTv3 20ep grid0.2 全监督,val mIoU 0.41 / best 0.43 */
export const perClassIoU: Record<ClassName, number> = {
  low_vegetation: 0.41,
  terrain: 0.37,
  stem: 0.28,
  live_branches: 0.78,
  woody_branches: 0.23,
};
export const baselineMIoU = 0.41; // PTv3 全监督 in-domain baseline(真实)

/** 数据状态标记。标签效率(scratch)/逐层 IoU / LOSO 现已为真实结果;
 *  仅 conformal 校准曲线 + 标签效率的"自监督预训练"线仍待测。 */
export const RESULTS_ARE_PLACEHOLDER = false;
export const CALIBRATION_IS_PLACEHOLDER = true;

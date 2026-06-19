import { losoLeaveOneOut, inDomainRefMIoU } from "../data/results";

// Leave-one-site-out 横向柱状图(浅色主题)。火灾相关站点用 brick 色,其余 forest 绿;in-domain 参考虚线。
const W = 430, ROW = 44, LABEL_W = 78, BAR_MAX = W - LABEL_W - 52, MAX_MIOU = 0.7;
const BRICK = "#b1431d", FOREST = "#2f6b46", INK = "#1b1f24", MUTE = "#5d656d";

export default function LOSOMatrix() {
  const h = losoLeaveOneOut.length * ROW + 44;
  const refX = LABEL_W + (inDomainRefMIoU / MAX_MIOU) * BAR_MAX;
  return (
    <svg viewBox={`0 0 ${W} ${h}`} width="100%" style={{ maxWidth: W }}>
      <line x1={refX} y1={6} x2={refX} y2={h - 26} stroke="#b9c0c7" strokeDasharray="4 4" />
      <text x={refX} y={h - 12} textAnchor="middle" fontSize={10.5} fill={MUTE}>
        in-domain {inDomainRefMIoU.toFixed(2)}
      </text>
      {losoLeaveOneOut.map((d, i) => {
        const y = 12 + i * ROW;
        const bw = (d.miou / MAX_MIOU) * BAR_MAX;
        const col = d.fire ? BRICK : FOREST;
        return (
          <g key={d.site}>
            <text x={LABEL_W - 10} y={y + (ROW - 16) / 2 + 4} textAnchor="end" fontSize={12.5}
              fill={d.fire ? BRICK : INK} fontWeight={d.fire ? 700 : 400}>{d.site}</text>
            <rect x={LABEL_W} y={y} width={bw} height={ROW - 16} rx={3} fill={col} />
            <text x={LABEL_W + bw + 7} y={y + (ROW - 16) / 2 + 4} fontSize={12} fill={INK}
              fontVariant="tabular-nums">{d.miou.toFixed(2)}</text>
          </g>
        );
      })}
    </svg>
  );
}

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { calibration } from "../data/results";

// 校准/可靠性曲线:置信度 vs 实际准确率(对角线=完美校准)。conformal 卖点。
const data = calibration.map((p) => ({ ...p, ideal: p.confidence }));

export default function CalibrationCurve() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 18, left: 0 }}>
        <CartesianGrid stroke="#eceef0" />
        <XAxis dataKey="confidence" stroke="#5d656d" domain={[0, 1]} type="number" tick={{ fontSize: 12 }}
          label={{ value: "Predicted confidence", position: "insideBottom", offset: -8, fill: "#5d656d", fontSize: 12 }} />
        <YAxis stroke="#5d656d" domain={[0, 1]} tick={{ fontSize: 12 }}
          label={{ value: "Empirical accuracy", angle: -90, position: "insideLeft", fill: "#5d656d", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e4e7ea", fontSize: 12 }} />
        <Line type="monotone" dataKey="ideal" name="Perfect calibration" stroke="#b9c0c7"
          strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="accuracy" name="Model" stroke="#2f6b46" strokeWidth={2.2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

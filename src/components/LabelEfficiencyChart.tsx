import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { labelEfficiency } from "../data/results";

// 标签效率曲线:自监督预训练 vs 从零,随标签比例。F1 的头号杀手图。
export default function LabelEfficiencyChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={labelEfficiency} margin={{ top: 10, right: 20, bottom: 18, left: 0 }}>
        <CartesianGrid stroke="#eceef0" />
        <XAxis dataKey="labelFrac" stroke="#5d656d" tick={{ fontSize: 12 }}
          label={{ value: "Labelled points (%)", position: "insideBottom", offset: -8, fill: "#5d656d", fontSize: 12 }} />
        <YAxis stroke="#5d656d" domain={[0, 0.8]} tick={{ fontSize: 12 }}
          label={{ value: "mIoU", angle: -90, position: "insideLeft", fill: "#5d656d", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e4e7ea", fontSize: 12 }} />
        <Line type="monotone" dataKey="scratch" name="PTv3 (from scratch)" stroke="#b1431d"
          strokeWidth={2.2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

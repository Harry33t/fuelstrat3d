import PointCloudViewer from "./components/PointCloudViewer";
import LabelEfficiencyChart from "./components/LabelEfficiencyChart";
import LOSOMatrix from "./components/LOSOMatrix";
import CalibrationCurve from "./components/CalibrationCurve";
import {
  perClassIoU, CLASS_NAMES, FUEL_LAYER_LABEL, labelEfficiency,
  losoLeaveOneOut, inDomainRefMIoU,
} from "./data/results";

const f2 = (x: number) => x.toFixed(2);
const pct = (n: number) => (n === 100 ? "100%" : `${n}%`);

export default function App() {
  return (
    <>
      <header className="masthead">
        <div className="wrap">
          <div className="eyebrow">Method demonstration</div>
          <h1>Label-efficient segmentation of vertical fuel strata from airborne LiDAR point clouds</h1>
          <div className="authors">
            <span className="author-name">Guanxiong Huang</span>
            <span className="author-aff">Northwest A&amp;F University</span>
            <a href="mailto:harry.huang@nwafu.edu.cn">harry.huang@nwafu.edu.cn</a>
          </div>
          <div className="byline">PhD research demonstration · FOR-instance benchmark (Puliti et al., 2023)</div>
          <div className="abstract">
            Airborne LiDAR studies of forest fuel load have largely been limited to the canopy; the surface and
            understorey strata that drive fire propagation remain under-resolved, and labelled training data are
            expensive. We segment a forest point cloud into four vertical fuel strata
            (<b>surface, near-surface, elevated/ladder, canopy</b>) with a Point&nbsp;Transformer&nbsp;v3 model, and
            report label efficiency, per-stratum accuracy, and leave-one-site-out cross-site generalisation on the
            FOR-instance benchmark (5 global sites). At 10–20% of point labels the model already reaches
            full-supervision mIoU; cross-site mIoU drops markedly on unseen sites, quantifying the domain gap that
            data-efficient and domain-adaptive methods aim to close.
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <h2><span className="secnum">1</span>Motivation</h2>
          <p className="lead">
            Two limitations recur across recent airborne-LiDAR fuel work: the understorey is not resolved, and
            methods do not transfer across sites.
          </p>
          <blockquote className="quote">
            “past studies using Airborne Laser Scanning have been limited to canopy fuels, overlooking surface and
            understorey layers that play a key role in wildfire propagation.”
            <cite>Nguyen et al., Science of Remote Sensing, 2025</cite>
          </blockquote>
          <blockquote className="quote">
            “existing methodologies often overfit small datasets and lack comparability, limiting their applicability.”
            <cite>Puliti et al., FOR-instance, 2023</cite>
          </blockquote>
        </div>
      </section>

      <section>
        <div className="wrap">
          <h2><span className="secnum">2</span>Fuel-stratum segmentation</h2>
          <p className="sub">
            Four vertical fuel strata recovered from the 3D point cloud. The <b>Fire pathway</b> view derives a
            crown-fire indicator from vertical fuel continuity: a continuous ladder from surface to canopy (red)
            admits a surface fire into the crowns; a vertical gap (cool) does not.
          </p>
          <figure>
            <PointCloudViewer />
            <figcaption>
              <span className="figlabel">Figure 1.</span>{" "}
              <span className="prov">Illustrative synthetic scene</span> used to convey the task and the four
              fuel strata; orbit, and switch between RGB, ground truth, prediction, per-point errors, and the
              derived fire-pathway indicator. Quantitative results below are measured on real data.
            </figcaption>
          </figure>
          <div className="legend">
            <span><span className="sw" style={{ background: "rgb(117,84,51)" }} />Surface</span>
            <span><span className="sw" style={{ background: "rgb(168,199,77)" }} />Near-surface</span>
            <span><span className="sw" style={{ background: "rgb(235,143,51)" }} />Elevated / ladder</span>
            <span><span className="sw" style={{ background: "rgb(56,179,97)" }} />Canopy</span>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <h2><span className="secnum">3</span>Results</h2>
          <p className="sub">Point Transformer v3, 20-epoch schedule, 0.2&nbsp;m voxel grid, measured on FOR-instance.</p>

          <div className="grid2">
            <figure>
              <LabelEfficiencyChart />
              <figcaption><span className="figlabel">Figure 2.</span> Segmentation mIoU vs. the fraction of
                point labels used in training. 10–20% of labels approaches full supervision.</figcaption>
              <table className="data">
                <thead><tr><th>Labelled points</th><th>mIoU</th></tr></thead>
                <tbody>
                  {labelEfficiency.map((d) => (
                    <tr key={d.labelFrac}><td>{pct(d.labelFrac)}</td><td>{f2(d.scratch)}</td></tr>
                  ))}
                </tbody>
                <caption style={{ captionSide: "bottom", textAlign: "left", fontSize: 12, color: "var(--muted)", paddingTop: 6 }}>
                  Table 1. Label efficiency (measured).
                </caption>
              </table>
            </figure>

            <figure>
              <table className="data">
                <thead><tr><th>Fuel stratum</th><th>Class</th><th>IoU</th></tr></thead>
                <tbody>
                  {CLASS_NAMES.map((c) => (
                    <tr key={c}>
                      <td>{FUEL_LAYER_LABEL[c]}</td>
                      <td className="muted">{c.replace("_", " ")}</td>
                      <td>{f2(perClassIoU[c])}</td>
                    </tr>
                  ))}
                </tbody>
                <caption style={{ captionSide: "bottom", textAlign: "left", fontSize: 12, color: "var(--muted)", paddingTop: 6 }}>
                  Table 2. Per-stratum IoU, in-domain (measured). Thin stems and woody/ladder fuel are hardest.
                </caption>
              </table>
            </figure>
          </div>

          <div className="grid2" style={{ marginTop: 18 }}>
            <figure>
              <LOSOMatrix />
              <figcaption><span className="figlabel">Figure 3.</span> Leave-one-site-out mIoU. Training on the
                remaining four sites and testing on the held-out site; dashed line marks in-domain reference.</figcaption>
            </figure>
            <figure>
              <table className="data">
                <thead><tr><th>Held-out site</th><th>mIoU</th></tr></thead>
                <tbody>
                  {losoLeaveOneOut.map((d) => (
                    <tr key={d.site} className={d.fire ? "fire" : ""}>
                      <td>{d.site}{d.fire ? " †" : ""}</td><td>{f2(d.miou)}</td>
                    </tr>
                  ))}
                  <tr><td className="muted">in-domain ref.</td><td className="muted">{f2(inDomainRefMIoU)}</td></tr>
                </tbody>
                <caption style={{ captionSide: "bottom", textAlign: "left", fontSize: 12, color: "var(--muted)", paddingTop: 6 }}>
                  Table 3. Cross-site generalisation (measured). † eucalypt / radiata sites relevant to wildfire fuel.
                </caption>
              </table>
              <p className="sub" style={{ marginTop: 14 }}>
                Calibrated (conformal) per-point uncertainty: <span className="prov">in preparation</span>.
              </p>
              <CalibrationCurve />
            </figure>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          Benchmark: FOR-instance (UAV laser scanning, 5 sites). Model: Point Transformer v3 (Pointcept).
          Tables 1–3 and Figures 2–3 report measured results; Figure 1 is an illustrative synthetic scene; the
          calibration panel is preliminary.
          <ol className="refs" style={{ marginTop: 14 }}>
            <li>Puliti et al. FOR-instance: a UAV laser scanning benchmark for semantic and instance segmentation of individual trees. arXiv:2309.01279, 2023.</li>
            <li>Nguyen et al. Modelling multi-layer fine fuel loads in temperate eucalypt forests using airborne LiDAR. Science of Remote Sensing, 2025.</li>
            <li>Wu et al. Point Transformer V3. CVPR, 2024.</li>
          </ol>
        </div>
      </footer>
    </>
  );
}

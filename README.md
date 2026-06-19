# FuelStrat3D

Interactive demonstration of label-efficient 3D segmentation of vertical fuel strata
(surface, near-surface, elevated/ladder, canopy) from airborne LiDAR point clouds.

Built with React + TypeScript (Vite), Three.js (`@react-three/fiber`) for the point-cloud
viewer, and Recharts for the result figures. Quantitative results are measured with a
Point Transformer v3 model on the FOR-instance benchmark; the 3D scene in Figure 1 is an
illustrative synthetic point cloud.

## Develop
```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static build to dist/
```

## References
- Puliti et al. *FOR-instance: a UAV laser scanning benchmark dataset for semantic and instance segmentation of individual trees.* arXiv:2309.01279, 2023.
- Nguyen et al. *Modelling multi-layer fine fuel loads in temperate eucalypt forests using airborne LiDAR.* Science of Remote Sensing, 2025.
- Wu et al. *Point Transformer V3.* CVPR, 2024.

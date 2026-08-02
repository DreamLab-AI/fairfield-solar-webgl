# Fairfield Solar WebGL

An interactive, georeferenced browser visualisation of the proposed ground-mount solar array
at Fairfield House, Eskdale Green, Cumbria.

The simulation combines the audited Blender site model with panel-level shading, monthly energy
yield, British National Grid coordinates, terrain, vegetation, buildings, and seasonal solar
lighting. Select an individual photovoltaic module to inspect its rated output, modelled shading,
and site coordinates.

## Run locally

```bash
npm ci
npm run dev
```

Create and inspect a production build with:

```bash
npm run build
npm run preview
```

## Included data

- 20 × JA Solar JAM72D40-605/MB modules
- 12.10 kWp installed DC capacity
- 10,764 kWh modelled annual generation
- 2.30% modelled annual site-shading loss
- EPSG:27700 British National Grid positioning
- Meshopt-compressed glTF site model

The model is a planning visualisation, not a construction survey. The accepted v5 array extends
downhill beyond the initial proposed-solar siting polygon.

## Controls

- Drag to orbit and scroll to zoom.
- Choose **Site**, **Array**, or **House** for preset viewpoints.
- Move the month and time controls to explore seasonal lighting and energy yield.
- Select a solar module to view its panel-level metadata.

## Data provenance

The geometry is derived from `fairfield-scene-v5.blend`. Terrain uses Environment Agency LiDAR;
vegetation derives from canopy-height detection; module shading comes from a twelve-month,
six-point-per-panel Blender ray-cast analysis. The optimised browser asset preserves semantic
glTF extras for every module.

## Licence

Application code is released under the MIT Licence. The site model and compiled planning data
are provided for project visualisation and should not be treated as surveyed or construction-ready
information.

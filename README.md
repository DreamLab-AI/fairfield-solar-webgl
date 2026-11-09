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

Design of record, 31 October 2026:

- 18 × JA Solar JAM72D40-605/MB modules, portrait at 25°, in four stepped rows (2, 3, 8 and 5 modules, front to back) at 3.0 m pitch
- 10.89 kWp installed DC capacity
- 8,928 kWh modelled annual generation; 850 kWh from November to February; 820 kWh/kWp
- Per-module position (EPSG:27700 British National Grid), annual and monthly yield
- Meshopt-compressed glTF site model with the C01 energy store, service path, feature garden and screen planting

The model is a planning visualisation with a reference module, not a construction survey or setting-out.
The array sits inside the owner's chosen 127.5 m² solar area and is the most modules that fit it.

## Controls

- Drag to orbit and scroll to zoom.
- Choose **Site**, **Array**, or **House** for preset viewpoints.
- Move the month and time controls to explore seasonal lighting and energy yield.
- Select a solar module to view its row, coordinates and modelled yield.

## Data provenance

The geometry is exported from the coordinated site scene `fairfield-site.blend` (rebuilt 31 October 2026
from the layout search). Module positions and yields come from an hourly layout search over PVGIS 5.3 SARAH3
weather for 2019–2020, with the horizon from the 2019 Environment Agency surface model, exact row-to-row
shading with a bypass-diode penalty, isotropic diffuse and ground-reflected light, and NOCT cell temperature.
Terrain uses Environment Agency LiDAR (decimated for the browser); vegetation is placed from a canopy-height
catalogue. Every module node in the glTF carries its identifier, row, coordinates and modelled yield as extras.

## Licence

Application code is released under the MIT Licence. The site model and compiled planning data
are provided for project visualisation and should not be treated as surveyed or construction-ready
information.

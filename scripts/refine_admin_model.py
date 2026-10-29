"""Refine the existing admin GLB locally; no ChatGPT file download needed.
Run: py -m pip install trimesh numpy
     py scripts/refine_admin_model.py
"""
from pathlib import Path
import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "models" / "admin-assistant-3d.glb"
BACKUP = ROOT / "models" / "admin-assistant-3d-original.glb"
if not MODEL.is_file():
    raise SystemExit(f"Missing {MODEL}. Put your original GLB in models/ first.")
if BACKUP.exists():
    print(f"Using preserved original: {BACKUP.name}")
else:
    BACKUP.write_bytes(MODEL.read_bytes())
    print(f"Backed up original to {BACKUP.name}")
scene = trimesh.load(BACKUP, force="scene")
for name in ("desk_leg_-1", "desk_leg_1"):
    if name in scene.geometry:
        scene.delete_geometry(name)

def edit(name, new_center, new_extents=None):
    if name not in scene.geometry:
        raise SystemExit(f"Expected mesh not found: {name}")
    mesh = scene.geometry[name]
    old_center = mesh.bounds.mean(axis=0)
    if new_extents is not None:
        scale = np.asarray(new_extents) / mesh.extents
        mesh.vertices = (mesh.vertices - old_center) * scale + np.asarray(new_center)
    else:
        mesh.vertices += np.asarray(new_center) - old_center

edit("hand_left", (-0.32, -0.29, 1.075))
edit("hand_right", (0.32, -0.29, 1.075))
edit("laptop_screen", (0, -0.54, 1.17), (0.74, 0.06, 0.51))
edit("laptop_display", (0, -0.588, 1.18), (0.62, 0.015, 0.39))
edit("laptop_icon", (0, -0.604, 1.20), (0.12, 0.015, 0.085))
# Replace the broad tabletop with a compact floating work surface.
# This keeps the silhouette tidy above the card without changing its CSS.
if "desk_top" in scene.geometry:
    edit("desk_top", (0.0, -0.40, 0.93), (1.65, 0.72, 0.075))
# Turn the entire laptop around its vertical (Z) axis.
# The mascot sits behind the desk (positive Y); the display should face her,
# while the keyboard moves toward her hands. Rotate ALL laptop components together.
pivot = np.array([0.0, -0.55, 0.0])
rotation = np.diag([-1.0, -1.0, 1.0])
rotated = []
for name, mesh in scene.geometry.items():
    if name.startswith("laptop_"):
        mesh.vertices = (mesh.vertices - pivot) @ rotation.T + pivot
        rotated.append(name)
if not rotated:
    raise SystemExit("No laptop meshes found; original GLB was not modified.")
print("Turned laptop toward mascot:", ", ".join(rotated))
scene.export(MODEL)
print(f"Refined model saved: {MODEL}")
print("Compact desk and laptop updated; colors preserved. Refresh Live Server with Ctrl+Shift+R.")

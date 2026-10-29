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

edit("hand_left", (-0.63, -0.69, 1.075))
edit("hand_right", (0.63, -0.69, 1.075))
edit("laptop_screen", (0, -0.54, 1.21), (0.896, 0.07, 0.64))
edit("laptop_display", (0, -0.588, 1.23), (0.748, 0.015, 0.484))
edit("laptop_icon", (0, -0.604, 1.26), (0.157, 0.015, 0.107))
scene.export(MODEL)
print(f"Refined model saved: {MODEL}")
print("Colors unchanged. Refresh Live Server with Ctrl+Shift+R.")

"""Bundle reproducible sources and captured assets, excluding renders and caches."""
from pathlib import Path
import zipfile

root=Path(__file__).resolve().parent
archive=root/'nextcustomer-source.zip'
excluded={'.cache','node_modules','__pycache__'}
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(root.rglob('*')):
        rel=p.relative_to(root)
        if not p.is_file() or p==archive or any(x in excluded for x in rel.parts):continue
        if p.suffix=='.mp4':continue
        z.write(p,Path('nextcustomer-short')/rel)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    print(f'{archive}: {len(z.namelist())} files; {archive.stat().st_size:,} bytes; CRC verification passed')

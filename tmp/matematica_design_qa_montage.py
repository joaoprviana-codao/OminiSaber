from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(r"C:\Users\CLEVERSON\Downloads\OminiSaber-main\OminiSaber-main")
PAIRS = [
    ("01-1o-ano-maquina-de-padroes.png", "matematica-maquina-padroes-implementacao.png", "qa-matematica-maquina-padroes.png"),
    ("02-2o-ano-estudio-de-areas.png", "matematica-estudio-areas-implementacao.png", "qa-matematica-estudio-areas.png"),
    ("03-3o-ano-reta-em-movimento.png", "matematica-reta-movimento-implementacao.png", "qa-matematica-reta-movimento.png"),
]

for source_name, implementation_name, output_name in PAIRS:
    source = Image.open(ROOT / "docs" / "referencias-design" / "matematica" / source_name).convert("RGB")
    implementation = Image.open(ROOT / "docs" / "auditoria-visual" / implementation_name).convert("RGB")
    implementation = implementation.resize(source.size, Image.Resampling.LANCZOS)
    label_height = 44
    montage = Image.new("RGB", (source.width * 2, source.height + label_height), "white")
    montage.paste(source, (0, label_height))
    montage.paste(implementation, (source.width, label_height))
    draw = ImageDraw.Draw(montage)
    draw.text((18, 14), "REFERÊNCIA APROVADA", fill="#11145d")
    draw.text((source.width + 18, 14), "IMPLEMENTAÇÃO", fill="#11145d")
    draw.line((source.width, 0, source.width, montage.height), fill="#d9d9e7", width=2)
    montage.save(ROOT / "docs" / "auditoria-visual" / output_name)

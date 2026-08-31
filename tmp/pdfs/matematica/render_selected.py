from pathlib import Path

import pypdfium2 as pdfium


PAGES = [
    (Path(r"C:\Users\CLEVERSON\Downloads\EM_D_MAT_26_14_04_26.pdf"), 20, "trimestre-1-p20.png"),
    (Path(r"C:\Users\CLEVERSON\Downloads\MAT-OCs-EM-2o-trim-2026-12-06-26.pdf"), 17, "trimestre-2-p17.png"),
    (Path(r"C:\Users\CLEVERSON\Downloads\MAT-OCs-EM-3o-trim-2026-26-08-26.pdf"), 27, "trimestre-3-p27.png"),
]

out_dir = Path(__file__).parent
for source, page_number, filename in PAGES:
    pdf = pdfium.PdfDocument(str(source))
    page = pdf[page_number - 1]
    image = page.render(scale=1.5).to_pil()
    image.save(out_dir / filename)

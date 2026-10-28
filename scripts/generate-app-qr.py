"""Generate reusable App Store QR artwork. Requires qrcode[pil]."""
from pathlib import Path

import qrcode
from qrcode.image.svg import SvgPathFillImage
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import CircleModuleDrawer, SquareModuleDrawer
from PIL import Image

APP_STORE_URL = "https://apps.apple.com/app/id6794435414"
OUTPUT = Path(__file__).resolve().parents[1] / "docs" / "downloads"


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=24,
        border=4,
    )
    qr.add_data(APP_STORE_URL)
    qr.make(fit=True)
    png = qr.make_image(fill_color="black", back_color="white")
    png.save(OUTPUT / "ebp-app-store-qr.png")
    svg = qr.make_image(image_factory=SvgPathFillImage)
    svg.save(OUTPUT / "ebp-app-store-qr.svg")
    qr.box_size = 6
    qr.make_image(fill_color="black", back_color="white").save(
        OUTPUT / "ebp-app-store-qr-preview.png"
    )
    branded_qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=24, border=4
    )
    branded_qr.add_data(APP_STORE_URL)
    branded_qr.make(fit=True)
    branded = branded_qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=CircleModuleDrawer(),
        eye_drawer=SquareModuleDrawer(),
        embedded_image_path=str(OUTPUT / "ebp-app-icon.png"),
        embedded_image_ratio=0.18,
    ).get_image().convert("RGB")
    branded.save(OUTPUT / "ebp-app-store-qr-branded.png")
    branded.resize((288, 288), Image.Resampling.LANCZOS).save(
        OUTPUT / "ebp-app-store-qr-branded-preview.png"
    )
    print(f"Destination: {APP_STORE_URL}")
    print(f"PNG size: {png.size[0]} x {png.size[1]}")
    print(f"Saved PNG and SVG in {OUTPUT}")


if __name__ == "__main__":
    main()

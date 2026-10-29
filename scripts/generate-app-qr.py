"""Generate reusable App Store QR artwork. Requires qrcode[pil]."""
from pathlib import Path

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import CircleModuleDrawer, SquareModuleDrawer

APP_STORE_URL = "https://apps.apple.com/app/id6794435414"
OUTPUT = Path(__file__).resolve().parents[1] / "docs" / "downloads"


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
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
    print(f"Destination: {APP_STORE_URL}")
    print(f"PNG size: {branded.size[0]} x {branded.size[1]}")
    print(f"Saved branded QR in {OUTPUT}")


if __name__ == "__main__":
    main()

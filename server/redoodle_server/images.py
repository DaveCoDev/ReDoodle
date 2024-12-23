import base64
from base64 import b64decode
from io import BytesIO
from pathlib import Path

from PIL import Image


def load_base64_image(image_path: Path) -> str:
    with image_path.open("rb") as image_file:
        return encode_binary_to_base64(image_file.read())


def load_encoded_image(image_path: Path) -> str:
    with image_path.open("rb") as image_file:
        return add_url_encoding(encode_binary_to_base64(image_file.read()))


def encode_binary_to_base64(binary_data: bytes | None) -> str | None:
    """Convert binary data to base64 data URL string.

    Args:
        binary_data: Binary data to encode, or None

    Returns:
        Base64 encoded data URL string (format: "data:image/png;base64,..."),
        or None if input was None
    """
    if binary_data is None:
        return None
    base64_str = base64.b64encode(binary_data).decode()
    return base64_str


def add_url_encoding(base64_str: str) -> str:
    return f"data:image/png;base64,{base64_str}"


def base64_to_pil(base64_image: str) -> Image.Image:
    img_data = b64decode(base64_image)
    return Image.open(BytesIO(img_data))


def save_base64_image(base64_str: str, output_path: Path) -> None:
    """Save a base64 encoded image string to a file.

    Args:
        base64_str: Base64 encoded image string, with or without data URL prefix
        output_path: Path where the file should be saved
    """
    # Decode base64 to binary
    image_data = base64.b64decode(base64_str)

    # Write to file
    with output_path.open("wb") as f:
        f.write(image_data)

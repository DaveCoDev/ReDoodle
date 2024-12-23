from copy import deepcopy
import json
from pathlib import Path
import secrets
import time
from urllib import request

import timm
import torch.nn.functional as f

from redoodle_server.images import base64_to_pil, load_base64_image, save_base64_image

COMFY_UI_INPUT_DIR = Path(__file__).parent.parent / "ComfyUI" / "input"
COMFY_UI_OUTPUT_DIR = Path(__file__).parent.parent / "ComfyUI" / "output"
IMG2IMG_MAX_ATTEMPTS = 300

IMG2IMG_TEMPLATE = {
    "3": {
        "inputs": {
            "seed": "REPLACE ME WITH AN INTEGER",
            "steps": 3,
            "cfg": 1,
            "sampler_name": "euler",
            "scheduler": "sgm_uniform",
            "denoise": 0.81,
            "model": ["14", 0],
            "positive": ["16", 0],
            "negative": ["17", 0],
            "latent_image": ["12", 0],
        },
        "class_type": "KSampler",
        "_meta": {"title": "KSampler"},
    },
    "8": {
        "inputs": {"samples": ["3", 0], "vae": ["14", 2]},
        "class_type": "VAEDecode",
        "_meta": {"title": "VAE Decode"},
    },
    "9": {
        "inputs": {"filename_prefix": "OUTPUT FILE NAME IN /output FOLDER", "images": ["8", 0]},
        "class_type": "SaveImage",
        "_meta": {"title": "Save Image"},
    },
    "10": {
        "inputs": {"image": "INPUT IMAGE FILE NAME IN /input FOLDER", "upload": "image"},
        "class_type": "LoadImage",
        "_meta": {"title": "Load Image"},
    },
    "12": {
        "inputs": {"pixels": ["10", 0], "vae": ["14", 2]},
        "class_type": "VAEEncode",
        "_meta": {"title": "VAE Encode"},
    },
    "14": {
        "inputs": {"ckpt_name": "sd3.5_large_turbo.safetensors"},
        "class_type": "CheckpointLoaderSimple",
        "_meta": {"title": "Load Checkpoint"},
    },
    "16": {
        "inputs": {
            "text": "IMAGE GEN PROMPT HERE",
            "clip": ["18", 0],
        },
        "class_type": "CLIPTextEncode",
        "_meta": {"title": "Positive Prompt"},
    },
    "17": {
        "inputs": {"text": "", "clip": ["18", 0]},
        "class_type": "CLIPTextEncode",
        "_meta": {"title": "Negative Prompt"},
    },
    "18": {
        "inputs": {
            "clip_name1": "clip_l.safetensors",
            "clip_name2": "clip_g.safetensors",
            "clip_name3": "t5xxl_fp8_e4m3fn_scaled.safetensors",
        },
        "class_type": "TripleCLIPLoader",
        "_meta": {"title": "TripleCLIPLoader"},
    },
}


def generate_image(initial_image: str, prompt: str, steps: int = 3) -> str:
    """Using ComfyUI, use img2img to generate a new image using the initial image and the user's prompt."""
    api_template = deepcopy(IMG2IMG_TEMPLATE)

    # Set the random seed
    api_template["3"]["inputs"]["seed"] = secrets.randbits(32)
    # Set the positive image generation prompt
    api_template["16"]["inputs"]["text"] = prompt
    # Set the number of steps
    api_template["3"]["inputs"]["steps"] = steps
    # Set the file name prefix
    api_template["9"]["inputs"]["filename_prefix"] = "img2img_redoodle"
    # Set the initial image
    save_base64_image(initial_image, COMFY_UI_INPUT_DIR / "initial_image.png")
    api_template["10"]["inputs"]["image"] = "initial_image.png"

    data = json.dumps({"prompt": api_template}).encode("utf-8")
    req = request.Request("http://127.0.0.1:8188/prompt", data=data)
    result = request.urlopen(req)
    prompt_id = json.loads(result.read())["prompt_id"]

    # Poll until the image is generated
    attempts = 0
    while attempts < IMG2IMG_MAX_ATTEMPTS:
        req = request.Request(f"http://127.0.0.1:8188/history/{prompt_id}")
        resp = request.urlopen(req)
        history = json.loads(resp.read())

        # Get the filename of the output image
        if history:
            new_image_path = COMFY_UI_OUTPUT_DIR / history[prompt_id]["outputs"]["9"]["images"][0]["filename"]

            # Check if this image exists
            if Path(new_image_path).exists():
                return load_base64_image(COMFY_UI_OUTPUT_DIR / new_image_path)

        time.sleep(0.05)
        attempts += 1

    return ""


def compute_similarity_score(initial_image: str, generated_image: str, model) -> float:
    """Compute the similarity score between two images using a Vision Transformer (ViT) image feature model.
    https://huggingface.co/timm/vit_large_patch14_dinov2.lvd142m

    Returns:
        float: The similarity score between the two images, normalized to 0.00-100.00
    """
    img1 = base64_to_pil(initial_image)
    img2 = base64_to_pil(generated_image)

    # get model specific transforms (normalization, resize)
    data_config = timm.data.resolve_model_data_config(model)
    transforms = timm.data.create_transform(**data_config, is_training=False)

    output_1 = model(transforms(img1).unsqueeze(0))
    output_2 = model(transforms(img2).unsqueeze(0))

    # Compute cosine similarity between the two outputs
    similarity = f.cosine_similarity(output_1, output_2, dim=1)
    # Normalize to 0-1
    similarity = (similarity + 1) / 2
    return round(similarity.item() * 100, 2)


if __name__ == "__main__":
    image = generate_image(
        load_base64_image(Path(__file__).parent.parent / "data" / "start_images" / "1.png"),
        "a happy sun shining water color painting",
        4,
    )

    model = timm.create_model(
        "vit_large_patch14_dinov2.lvd142m",
        pretrained=True,
        num_classes=0,
    )
    model = model.eval()
    img1 = load_base64_image(Path(__file__).parent.parent / "temp_images" / "happytree.png")
    img2 = load_base64_image(Path(__file__).parent.parent / "temp_images" / "robotfallout.png")
    print(compute_similarity_score(img1, img2, model))

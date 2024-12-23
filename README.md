# ReDoodle
ReDoodle is a "daily" web puzzle game where you are given a starting image, and your goal is to transform it into a goal image through a series of prompts.



This repo is meant as a proof of concept and is not production ready nor will it be maintained.


# Installation
The installation instructions here are meant for local development and were primarily tested on a Linux server with a modern NVIDIA GPU.
## Client
The client is built using [Vite](https://vite.dev/guide/#scaffolding-your-first-vite-project) and uses the 'react-swc-ts' template. It also uses [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) for styling.

### Prerequisites
1. [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to install Node.js versions
1. `nvm install 22` install Node.js 22
1. `nvm use 22` to use Node.js 22

### Launch
1. `cd app`
1. `npm install`
1. `npm run dev`


## Server
The server is built using [FastAPI](https://github.com/fastapi/fastapi) in Python. It uses SQLite to persist game state.
For comparing images we use a [Vision Transformer (ViT) image feature model](https://huggingface.co/timm/vit_large_patch14_dinov2.lvd142m) from Hugging Face. 
Installing the Poetry environment will also install PyTorch and the model will be loaded upon server start.

### Prerequisites
1. Install [Python >=3.11](https://www.python.org/downloads/)
1. Install [Poetry](https://python-poetry.org/docs/#installation)
1. `cd server`
1. `poetry install` to install the virtual environment
1. `add-puzzles` to load the puzzles in the data folder into the database

### Launch
1. `cd server`
1. `poetry shell` to make sure the virtual environment is activated
1. `fastapi dev main.py --host 0.0.0.0` to run the server
    - The `--host 0.0.0.0` flag is necessary to allow connections from other devices on the network as needed by the client.


## Image Generation
For generating images we use [ComfyUI](https://github.com/comfyanonymous/ComfyUI). The ComfyUI server is run as a separate process from the main server.

### Prerequisites
1. NVIDIA GPU
1. `cd server/ComfyUI`
1. `python3 -m venv .venv` to create a new virtual environment for image generation
1. `source .venv/bin/activate` to activate the new virtual environment
1. `pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu124`
1. `pip install -r requirements.txt`
1. Download the model files and put them into the correct folders
    - [`sd3.5_large_turbo.safetensors`](https://huggingface.co/stabilityai/stable-diffusion-3.5-large-turbo/tree/main) should be placed in [server/ComfyUI/models/checkpoints](server/ComfyUI/models/checkpoints)
    - [`clip_g.safetensors`](https://huggingface.co/Comfy-Org/stable-diffusion-3.5-fp8/blob/main/text_encoders/clip_g.safetensors) should be placed in [server/ComfyUI/models/clip](server/ComfyUI/models/clip)
    - [`clip_l.safetensors`](https://huggingface.co/Comfy-Org/stable-diffusion-3.5-fp8/blob/main/text_encoders/clip_l.safetensors) should be placed in [server/ComfyUI/models/clip](server/ComfyUI/models/clip)
    - [`t5xxl_fp8_e4m3fn_scaled.safetensors`](https://huggingface.co/Comfy-Org/stable-diffusion-3.5-fp8/blob/main/text_encoders/t5xxl_fp8_e4m3fn_scaled.safetensors) should be placed in [server/ComfyUI/models/clip](server/ComfyUI/models/clip)

### Launch
1. `cd server/ComfyUI`
1. `source .venv/bin/activate` to activate the virtual environment on Linux. ComfyUI does not support Poetry for the environment, so we use the built in Python environment.
1. `python main.py` to start the image generation server.

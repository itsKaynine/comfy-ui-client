# ComfyUI Client

[![npm][badge-version]][npm]
[![license][badge-license]][license]

Node.js [ComfyUI](https://github.com/comfyanonymous/ComfyUI) client based on the [WebSockets API example](https://github.com/comfyanonymous/ComfyUI/blob/master/script_examples/websockets_api_example.py).

See example in [`examples/generate`][examples-generate].

## Install

To install `comfy-ui-client` in an existing project:

```sh
npm install comfy-ui-client
```

## Example Usage

```ts
import { ComfyUIClient } from 'comfy-ui-client';
import type { Prompt } from 'comfy-ui-client';

// Your prompt / workflow
const prompt: Prompt = {
    '3': {
        class_type: 'KSampler',
        inputs: {
            cfg: 8,
            denoise: 1,
            latent_image: ['5', 0],
            model: ['4', 0],
            negative: ['7', 0],
            positive: ['6', 0],
            sampler_name: 'euler',
            scheduler: 'normal',
            seed: 8566257,
            steps: 20,
        },
    },
    '4': {
        class_type: 'CheckpointLoaderSimple',
        inputs: {
            ckpt_name: 'v1-5-pruned-emaonly.cpkt',
        },
    },
    '5': {
        class_type: 'EmptyLatentImage',
        inputs: {
            batch_size: 1,
            height: 512,
            width: 512,
        },
    },
    '6': {
        class_type: 'CLIPTextEncode',
        inputs: {
            clip: ['4', 1],
            text: 'masterpiece best quality girl',
        },
    },
    '7': {
        class_type: 'CLIPTextEncode',
        inputs: {
            clip: ['4', 1],
            text: 'bad hands',
        },
    },
    '8': {
        class_type: 'VAEDecode',
        inputs: {
            samples: ['3', 0],
            vae: ['4', 2],
        },
    },
    '9': {
        class_type: 'SaveImage',
        inputs: {
            filename_prefix: 'ComfyUI',
            images: ['8', 0],
        },
    },
};

// Set the text prompt for our positive CLIPTextEncode
prompt['6'].inputs.text = 'masterpiece best quality man';

// Set the seed for our KSampler node
prompt['3'].inputs.seed = 5;

// Create client
const serverAddress = '127.0.0.1:8188';
const clientId = 'baadbabe-b00b-4206-9420-deadd00d1337';
const client = new ComfyUIClient(serverAddress, clientId);

// Connect to server
await client.connect();

// Generate images
const images = await client.getImages(prompt);

// Save images to file
const outputDir = './tmp/output';
await client.saveImages(images, outputDir);

// Disconnect
await client.disconnect();
```

## License

This project is licensed under the [MIT License][license].

[badge-version]: https://img.shields.io/npm/v/comfy-ui-client.svg
[badge-license]: https://img.shields.io/npm/l/comfy-ui-client.svg

[npm]: https://www.npmjs.com/package/comfy-ui-client
[license]: https://github.com/itsKaynine/comfy-ui-client/blob/main/LICENSE

[examples-generate]: https://github.com/itsKaynine/comfy-ui-client/tree/main/examples/generate

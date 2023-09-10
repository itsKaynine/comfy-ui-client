import { writeFile } from 'fs/promises';
import { join } from 'path';

import pino from 'pino';
import WebSocket from 'ws';

import type {
  EditHistoryRequest,
  FolderName,
  HistoryResult,
  ImageContainer,
  ImageRef,
  ImagesResponse,
  ObjectInfoResponse,
  Prompt,
  PromptQueueResponse,
  QueuePromptResult,
  QueueResponse,
  ResponseError,
  SystemStatsResponse,
  UploadImageResult,
  ViewMetadataResponse,
} from './types.js';

// TODO: Make logger customizable
const logger = pino({
  level: 'info',
});

export class ComfyUIClient {
  public serverAddress: string;
  public clientId: string;

  protected ws?: WebSocket;

  constructor(serverAddress: string, clientId: string) {
    this.serverAddress = serverAddress;
    this.clientId = clientId;
  }

  connect() {
    return new Promise<void>(async (resolve) => {
      if (this.ws) {
        await this.disconnect();
      }

      const url = `ws://${this.serverAddress}/ws?clientId=${this.clientId}`;

      logger.info(`Connecting to url: ${url}`);

      this.ws = new WebSocket(url, {
        perMessageDeflate: false,
      });

      this.ws.on('open', () => {
        logger.info('Connection open');
        resolve();
      });

      this.ws.on('close', () => {
        logger.info('Connection closed');
      });

      this.ws.on('error', (err) => {
        logger.error({ err }, 'WebSockets error');
      });

      this.ws.on('message', (data, isBinary) => {
        if (isBinary) {
          logger.debug('Received binary data');
        } else {
          logger.debug('Received data: %s', data.toString());
        }
      });
    });
  }

  async disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }

  async getEmbeddings(): Promise<string[]> {
    const res = await fetch(`http://${this.serverAddress}/embeddings`);

    const json: string[] | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getExtensions(): Promise<string[]> {
    const res = await fetch(`http://${this.serverAddress}/extensions`);

    const json: string[] | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async queuePrompt(prompt: Prompt): Promise<QueuePromptResult> {
    const res = await fetch(`http://${this.serverAddress}/prompt`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        client_id: this.clientId,
      }),
    });

    const json: QueuePromptResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async interrupt(): Promise<void> {
    const res = await fetch(`http://${this.serverAddress}/interrupt`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const json: QueuePromptResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }
  }

  async editHistory(params: EditHistoryRequest): Promise<void> {
    const res = await fetch(`http://${this.serverAddress}/history`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const json: QueuePromptResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }
  }

  async uploadImage(
    image: Buffer,
    filename: string,
    overwrite?: boolean,
  ): Promise<UploadImageResult> {
    const formData = new FormData();
    formData.append('image', new Blob([image]), filename);

    if (overwrite !== undefined) {
      formData.append('overwrite', overwrite.toString());
    }

    const res = await fetch(`http://${this.serverAddress}/upload/image`, {
      method: 'POST',
      body: formData,
    });

    const json: UploadImageResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async uploadMask(
    image: Buffer,
    filename: string,
    originalRef: ImageRef,
    overwrite?: boolean,
  ): Promise<UploadImageResult> {
    const formData = new FormData();
    formData.append('image', new Blob([image]), filename);
    formData.append('originalRef', JSON.stringify(originalRef));

    if (overwrite !== undefined) {
      formData.append('overwrite', overwrite.toString());
    }

    const res = await fetch(`http://${this.serverAddress}/upload/mask`, {
      method: 'POST',
      body: formData,
    });

    const json: UploadImageResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getImage(
    filename: string,
    subfolder: string,
    type: string,
  ): Promise<Blob> {
    const res = await fetch(
      `http://${this.serverAddress}/view?` +
        new URLSearchParams({
          filename,
          subfolder,
          type,
        }),
    );

    const blob = await res.blob();
    return blob;
  }

  async viewMetadata(
    folderName: FolderName,
    filename: string,
  ): Promise<ViewMetadataResponse> {
    const res = await fetch(
      `http://${this.serverAddress}/view_metadata/${folderName}?filename=${filename}`,
    );

    const json: ViewMetadataResponse | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getSystemStats(): Promise<SystemStatsResponse> {
    const res = await fetch(`http://${this.serverAddress}/system_stats`);

    const json: SystemStatsResponse | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getPrompt(): Promise<PromptQueueResponse> {
    const res = await fetch(`http://${this.serverAddress}/prompt`);

    const json: PromptQueueResponse | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getObjectInfo(nodeClass?: string): Promise<ObjectInfoResponse> {
    const res = await fetch(
      `http://${this.serverAddress}/object_info` +
        (nodeClass ? `/${nodeClass}` : ''),
    );

    const json: ObjectInfoResponse | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getHistory(promptId?: string): Promise<HistoryResult> {
    const res = await fetch(
      `http://${this.serverAddress}/history` + (promptId ? `/${promptId}` : ''),
    );

    const json: HistoryResult | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async getQueue(): Promise<QueueResponse> {
    const res = await fetch(`http://${this.serverAddress}/queue`);

    const json: QueueResponse | ResponseError = await res.json();

    if ('error' in json) {
      throw new Error(JSON.stringify(json));
    }

    return json;
  }

  async saveImages(response: ImagesResponse, outputDir: string) {
    for (const nodeId of Object.keys(response)) {
      for (const img of response[nodeId]) {
        const arrayBuffer = await img.blob.arrayBuffer();

        const outputPath = join(outputDir, img.image.filename);
        await writeFile(outputPath, Buffer.from(arrayBuffer));
      }
    }
  }

  async getImages(prompt: Prompt): Promise<ImagesResponse> {
    if (!this.ws) {
      throw new Error(
        'WebSocket client is not connected. Please call connect() before interacting.',
      );
    }

    const queue = await this.queuePrompt(prompt);
    const promptId = queue.prompt_id;

    return new Promise<ImagesResponse>((resolve, reject) => {
      const outputImages: ImagesResponse = {};

      const onMessage = async (data: WebSocket.RawData, isBinary: boolean) => {
        // Previews are binary data
        if (isBinary) {
          return;
        }

        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'executing') {
            const messageData = message.data;
            if (!messageData.node) {
              const donePromptId = messageData.prompt_id;

              logger.info(`Done executing prompt (ID: ${donePromptId})`);

              // Execution is done
              if (messageData.prompt_id === promptId) {
                // Get history
                const historyRes = await this.getHistory(promptId);
                const history = historyRes[promptId];

                // Populate output images
                for (const nodeId of Object.keys(history.outputs)) {
                  const nodeOutput = history.outputs[nodeId];
                  if (nodeOutput.images) {
                    const imagesOutput: ImageContainer[] = [];
                    for (const image of nodeOutput.images) {
                      const blob = await this.getImage(
                        image.filename,
                        image.subfolder,
                        image.type,
                      );
                      imagesOutput.push({
                        blob,
                        image,
                      });
                    }

                    outputImages[nodeId] = imagesOutput;
                  }
                }

                // Remove listener
                this.ws?.off('message', onMessage);
                return resolve(outputImages);
              }
            }
          }
        } catch (err) {
          return reject(err);
        }
      };

      // Add listener
      this.ws?.on('message', onMessage);
    });
  }
}

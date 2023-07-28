export interface NodeInfo {
  class_type: string;
  inputs: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export interface Prompt {
  [nodeId: string]: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputs: Record<string, any>;
    class_type: string;
  };
}

export interface ComfyUIError {
  type: string;
  message: string;
  details: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra_info: any;
}

export interface QueuePromptResult {
  prompt_id: string;
  number: number;
  node_errors: Record<string, ComfyUIError>;
}

export interface UploadImageResult {
  name: string;
  subfolder: string;
  type: string;
}

export interface PromptHistory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prompt: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputs: Record<string, any>;
}

export interface HistoryResult {
  [clientId: string]: PromptHistory;
}

export interface OutputImage {
  filename: string;
  subfolder: string;
  type: string;
}

export interface ImageContainer {
  blob: Blob;
  image: OutputImage;
}

export interface ImagesResponse {
  [nodeId: string]: ImageContainer[];
}

export interface ResponseError {
  error: string | ComfyUIError;
  node_errors: Record<string, ComfyUIError>;
}

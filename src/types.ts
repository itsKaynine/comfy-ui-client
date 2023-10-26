import type { LoggerOptions, DestinationStream } from 'pino';

export type { LoggerOptions, DestinationStream };

export interface ComfyUIClientConfig {
  serverAddress: string;
  clientId: string;
  logger?: LoggerOptions | DestinationStream;
}

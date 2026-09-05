export type ContentCommand = 'get-status' | 'mark-start' | 'mark-end';

export interface ContentCommandMessage {
  type: 'content-command';
  command: ContentCommand;
}

export interface ContentStatus {
  adapterId: string;
  activeVideo: boolean;
  currentTime: number | null;
  metadataAvailable: boolean;
  timestampStart: number | null;
}

export interface ContentResponse {
  ok: boolean;
  status?: ContentStatus;
  message?: string;
}

export type ContentCommand = 'get-status' | 'mark-start' | 'mark-end';

export interface FrameStatusReport {
  isTopFrame: boolean;
  frameUrl: string;
  videoPresent: boolean;
  videoScore: number | null;
  candidateCount: number;
  bestCandidateType: string | null;
  bestCandidateConfidence: number | null;
}

export interface FrameDiagnostic extends FrameStatusReport {
  tabId: number;
  frameId: number;
}

export interface ContentCommandMessage {
  type: 'content-command';
  command: ContentCommand;
}

export interface FrameStatusMessage {
  type: 'frame-status';
  status: FrameStatusReport;
}

export interface GetFrameDiagnosticsMessage {
  type: 'get-frame-diagnostics';
  tabId: number;
}

export interface ContentStatus {
  adapterId: string;
  activeVideo: boolean;
  currentTime: number | null;
  metadataAvailable: boolean;
  timestampStart: number | null;
  frame: FrameStatusReport;
}

export interface ContentResponse {
  ok: boolean;
  status?: ContentStatus;
  diagnostics?: FrameDiagnostic[];
  message?: string;
}

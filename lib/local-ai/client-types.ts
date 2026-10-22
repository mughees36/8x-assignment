export type LocalAIReadiness = {
  ready: boolean; localOnly: boolean; message: string; deploymentNotice: string;
  checks: Record<string, { ready: boolean; detail: string }>;
};

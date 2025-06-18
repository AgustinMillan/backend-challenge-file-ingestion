interface AppState {
  isProcessing: boolean;
  processingStartTime: Date | null;
  processingEndTime: Date | null;
  totalProcessingTime: number | null;
  totalProcessLines: number | null;
  processedLines: number | null;
}

export const appState: AppState = {
  isProcessing: false,
  processingStartTime: null,
  processingEndTime: null,
  totalProcessingTime: null,
  totalProcessLines: null,
  processedLines: null,
};

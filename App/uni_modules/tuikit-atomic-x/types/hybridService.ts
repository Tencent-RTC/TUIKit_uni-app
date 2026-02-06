interface HybridResponseData<T = unknown> {
  code: number;
  api?: string
  message?: string;
  data?: {
    data?: T;
  };
}

export type { HybridResponseData };


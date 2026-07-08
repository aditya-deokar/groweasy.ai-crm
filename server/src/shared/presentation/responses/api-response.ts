export interface ApiResponseMeta {
  requestId?: string;
}

export interface SuccessApiResponse<TData> {
  success: true;
  message: string;
  data: TData;
  meta: ApiResponseMeta;
  timestamp: string;
}

export interface ErrorApiResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
  meta: ApiResponseMeta;
  timestamp: string;
}

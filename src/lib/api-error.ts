import type { AxiosError } from 'axios';

/** Error envelope returned by the NestJS `AllExceptionsFilter`. */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  path?: string;
  timestamp?: string;
}

/**
 * Normalised API error. `message` is always a single human-readable string so
 * UI can surface the BE message verbatim (business rules require this).
 */
export class ApiError extends Error {
  readonly status: number;
  /** All messages when BE returns an array (validation errors). */
  readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? 'Đã xảy ra lỗi không xác định');
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
  }

  static fromAxios(error: AxiosError<ApiErrorBody>): ApiError {
    if (error.response) {
      const body = error.response.data;
      const raw = body?.message;
      const messages = Array.isArray(raw)
        ? raw
        : [raw ?? defaultMessageFor(error.response.status)];
      return new ApiError(error.response.status, messages);
    }
    // Không có response → lỗi mạng / timeout.
    return new ApiError(0, ['Không thể kết nối tới máy chủ. Vui lòng thử lại.']);
  }
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return 'Dữ liệu không hợp lệ';
    case 401:
      return 'Phiên đăng nhập đã hết hạn';
    case 403:
      return 'Bạn không có quyền thực hiện thao tác này';
    case 404:
      return 'Không tìm thấy dữ liệu';
    default:
      return 'Đã xảy ra lỗi máy chủ';
  }
}

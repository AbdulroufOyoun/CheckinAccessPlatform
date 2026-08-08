export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string | Record<string, string[] | string> | unknown;
  code: number;
  data: T;
}

/** Laravel validation often returns `message` as a field→errors object. */
export function formatApiMessage(message: unknown, fallback = 'Request failed'): string {
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  if (Array.isArray(message)) {
    const parts = message
      .map((item) => formatApiMessage(item, ''))
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.length ? parts.join(' ') : fallback;
  }
  if (message && typeof message === 'object') {
    const parts: string[] = [];
    for (const value of Object.values(message as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const text = String(item ?? '').trim();
          if (text) parts.push(text);
        }
      } else if (typeof value === 'string' && value.trim()) {
        parts.push(value.trim());
      }
    }
    if (parts.length) {
      return parts.join(' ');
    }
  }
  return fallback;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

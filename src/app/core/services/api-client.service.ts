import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, ApiError, formatApiMessage } from '../models/api-envelope';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.unwrap(await this.request<T>('GET', path, undefined, httpParams));
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.unwrap(await this.request<T>('POST', path, body));
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.unwrap(await this.request<T>('PUT', path, body));
  }

  async delete<T>(path: string): Promise<T> {
    return this.unwrap(await this.request<T>('DELETE', path));
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
    params?: HttpParams,
  ): Promise<ApiEnvelope<T>> {
    const url = `${this.baseUrl}/${path.replace(/^\//, '')}`;
    try {
      return await firstValueFrom(
        this.http.request<ApiEnvelope<T>>(method, url, {
          body,
          params,
        }),
      );
    } catch (error) {
      throw this.toApiError(error);
    }
  }

  private unwrap<T>(envelope: ApiEnvelope<T>): T {
    if (!envelope?.success) {
      throw new ApiError(
        formatApiMessage(envelope?.message, 'Request failed'),
        envelope?.code || 400,
        envelope,
      );
    }
    return envelope.data;
  }

  private toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiEnvelope | undefined;
      return new ApiError(
        formatApiMessage(body?.message, error.message || 'HTTP error'),
        error.status,
        body ?? error.error,
      );
    }
    return new ApiError('Unexpected error', 0, error);
  }
}

/**
 * API Client for making HTTP requests to the Next.js backend
 */

import { mcpLogger } from './logger.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  pathParams?: Record<string, string>;
  requestId?: string; // For logging correlation
}

/**
 * Substitutes path parameters in a URL path
 * e.g., '/api/signals/{id}' with { id: '123' } => '/api/signals/123'
 */
function substitutePathParams(path: string, params?: Record<string, string>): string {
  if (!params) return path;

  let result = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key}}`, encodeURIComponent(value));
  }
  return result;
}

/**
 * Makes an HTTP request to the API
 */
export async function apiRequest<T = unknown>(options: RequestOptions): Promise<ApiResponse<T>> {
  const { method, path, body, pathParams, requestId } = options;
  const url = `${API_BASE_URL}${substitutePathParams(path, pathParams)}`;

  // Log API request
  mcpLogger.apiRequest(method, url, requestId);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const status = response.status;

    // Log API response
    mcpLogger.apiResponse(method, url, status, requestId);

    // Handle empty responses (e.g., 204 No Content)
    const text = await response.text();
    const data = text ? JSON.parse(text) : undefined;

    if (!response.ok) {
      return {
        error: data?.error || `Request failed with status ${status}`,
        status,
      };
    }

    return {
      data: data as T,
      status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    mcpLogger.apiResponse(method, url, 500, requestId);
    return {
      error: `API request failed: ${message}`,
      status: 500,
    };
  }
}

/**
 * Format API response for MCP tool output
 */
export function formatResponse<T>(response: ApiResponse<T>): string {
  if (response.error) {
    return JSON.stringify({ error: response.error, status: response.status }, null, 2);
  }
  return JSON.stringify(response.data, null, 2);
}

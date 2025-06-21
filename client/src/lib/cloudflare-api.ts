// Cloudflare Workers API Client for GoReal Platform

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

interface FileUpload {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  bucket: string;
  key: string;
  url: string;
  uploaded_by: string;
  uploaded_at: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

class CloudflareAPI {
  private baseUrl: string;
  private sessionToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_WORKERS_URL || 'http://localhost:8787';
    
    // Load session token from localStorage
    if (typeof window !== 'undefined') {
      this.sessionToken = localStorage.getItem('cf_session_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Cloudflare API request failed:', error);
      return {
        success: false,
        error: 'Network error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<APIResponse<{ user: User; session_id: string }>> {
    const response = await this.request<{ user: User; session_id: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.session_id) {
      this.sessionToken = response.data.session_id;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cf_session_token', response.data.session_id);
      }
    }

    return response;
  }

  async logout(): Promise<APIResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    this.sessionToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cf_session_token');
    }

    return response;
  }

  async validateSession(): Promise<APIResponse<User>> {
    return this.request<User>('/auth/session');
  }

  async refreshSession(): Promise<APIResponse<{ session_id: string; user: User }>> {
    const response = await this.request<{ session_id: string; user: User }>('/auth/refresh', {
      method: 'POST',
    });

    if (response.success && response.data?.session_id) {
      this.sessionToken = response.data.session_id;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cf_session_token', response.data.session_id);
      }
    }

    return response;
  }

  // File management methods
  async uploadFile(
    file: File,
    bucket: 'files' | 'images' | 'videos' = 'files',
    folder?: string,
    isPublic: boolean = false
  ): Promise<APIResponse<FileUpload>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    if (folder) formData.append('folder', folder);
    formData.append('public', isPublic.toString());

    return this.request<FileUpload>('/files/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    });
  }

  async getFileMetadata(fileId: string): Promise<APIResponse<FileUpload>> {
    return this.request<FileUpload>(`/files/${fileId}`);
  }

  async deleteFile(fileId: string): Promise<APIResponse> {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Analytics methods
  async trackEvent(eventType: string, properties: Record<string, any> = {}): Promise<APIResponse> {
    return this.request('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        event_type: eventType,
        properties,
      }),
    });
  }

  async trackPageView(page: string, title?: string, referrer?: string): Promise<APIResponse> {
    return this.request('/analytics/pageview', {
      method: 'POST',
      body: JSON.stringify({
        page,
        title,
        referrer,
      }),
    });
  }

  async trackInteraction(
    element: string,
    action: string,
    page?: string,
    metadata: Record<string, any> = {}
  ): Promise<APIResponse> {
    return this.request('/analytics/interaction', {
      method: 'POST',
      body: JSON.stringify({
        element,
        action,
        page,
        metadata,
      }),
    });
  }

  async trackPerformance(metrics: {
    page: string;
    load_time: number;
    first_contentful_paint?: number;
    largest_contentful_paint?: number;
    cumulative_layout_shift?: number;
    first_input_delay?: number;
  }): Promise<APIResponse> {
    return this.request('/analytics/performance', {
      method: 'POST',
      body: JSON.stringify(metrics),
    });
  }

  async trackError(
    errorType: string,
    message: string,
    stack?: string,
    page?: string,
    line?: number,
    column?: number
  ): Promise<APIResponse> {
    return this.request('/analytics/error', {
      method: 'POST',
      body: JSON.stringify({
        error_type: errorType,
        message,
        stack,
        page,
        line,
        column,
      }),
    });
  }

  // Cache methods (for admin users)
  async getCacheEntry(key: string): Promise<APIResponse<any>> {
    return this.request(`/cache/${key}`);
  }

  async setCacheEntry(key: string, value: any, ttl?: number): Promise<APIResponse> {
    return this.request('/cache', {
      method: 'POST',
      body: JSON.stringify({ key, value, ttl }),
    });
  }

  async deleteCacheEntry(key: string): Promise<APIResponse> {
    return this.request(`/cache/${key}`, {
      method: 'DELETE',
    });
  }

  // Proxy methods (cached backend API calls)
  async getFromCache<T>(endpoint: string, params?: Record<string, string>): Promise<APIResponse<T>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>(`/proxy${endpoint}${queryString}`);
  }

  // WebSocket connection helper
  createWebSocketConnection(
    endpoint: string,
    userId: string,
    username: string,
    avatarUrl?: string
  ): WebSocket {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8787';
    const params = new URLSearchParams({
      user_id: userId,
      username,
    });
    
    if (avatarUrl) {
      params.append('avatar_url', avatarUrl);
    }

    return new WebSocket(`${wsUrl}${endpoint}?${params.toString()}`);
  }

  // Chat room WebSocket
  connectToChatRoom(roomId: string, userId: string, username: string, avatarUrl?: string): WebSocket {
    return this.createWebSocketConnection(`/chat/${roomId}/websocket`, userId, username, avatarUrl);
  }

  // Live challenge WebSocket
  connectToLiveChallenge(challengeId: string, userId: string, username: string, avatarUrl?: string): WebSocket {
    return this.createWebSocketConnection(`/challenge/${challengeId}/websocket`, userId, username, avatarUrl);
  }

  // Utility methods
  setSessionToken(token: string): void {
    this.sessionToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cf_session_token', token);
    }
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  clearSession(): void {
    this.sessionToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cf_session_token');
    }
  }
}

// Create singleton instance
export const cloudflareAPI = new CloudflareAPI();

// Export types for use in components
export type { APIResponse, FileUpload, User };

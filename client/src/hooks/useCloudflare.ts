// React hooks for Cloudflare Workers integration

import { useState, useEffect, useCallback, useRef } from 'react';
import { cloudflareAPI, type APIResponse, type FileUpload, type User } from '@/lib/cloudflare-api';

// Authentication hook
export const useCloudflareAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const validateSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await cloudflareAPI.validateSession();
      if (response.success && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        cloudflareAPI.clearSession();
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      cloudflareAPI.clearSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await cloudflareAPI.login(email, password);
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Network error' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await cloudflareAPI.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const response = await cloudflareAPI.refreshSession();
      if (response.success && response.data) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshSession,
    validateSession,
  };
};

// File upload hook
export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (
    file: File,
    bucket: 'files' | 'images' | 'videos' = 'files',
    folder?: string,
    isPublic: boolean = false
  ): Promise<FileUpload | null> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await cloudflareAPI.uploadFile(file, bucket, folder, isPublic);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Upload failed');
        return null;
      }
    } catch (error) {
      console.error('File upload failed:', error);
      setError('Network error');
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      const response = await cloudflareAPI.deleteFile(fileId);
      if (!response.success) {
        setError(response.error || 'Delete failed');
        return false;
      }
      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      setError('Network error');
      return false;
    }
  }, []);

  return {
    uploadFile,
    deleteFile,
    isUploading,
    uploadProgress,
    error,
    clearError: () => setError(null),
  };
};

// Analytics hook
export const useAnalytics = () => {
  const trackEvent = useCallback((eventType: string, properties: Record<string, any> = {}) => {
    cloudflareAPI.trackEvent(eventType, properties).catch(console.error);
  }, []);

  const trackPageView = useCallback((page: string, title?: string) => {
    cloudflareAPI.trackPageView(page, title, document.referrer).catch(console.error);
  }, []);

  const trackInteraction = useCallback((
    element: string,
    action: string,
    metadata: Record<string, any> = {}
  ) => {
    cloudflareAPI.trackInteraction(element, action, window.location.pathname, metadata).catch(console.error);
  }, []);

  const trackError = useCallback((error: Error, page?: string) => {
    cloudflareAPI.trackError(
      error.name,
      error.message,
      error.stack,
      page || window.location.pathname
    ).catch(console.error);
  }, []);

  // Auto-track page views
  useEffect(() => {
    trackPageView(window.location.pathname, document.title);
  }, [trackPageView]);

  // Auto-track performance metrics
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            cloudflareAPI.trackPerformance({
              page: window.location.pathname,
              load_time: navEntry.loadEventEnd - navEntry.loadEventStart,
              first_contentful_paint: navEntry.loadEventEnd - navEntry.fetchStart,
            }).catch(console.error);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });

      return () => observer.disconnect();
    }
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackInteraction,
    trackError,
  };
};

// WebSocket hook for real-time features
export const useWebSocket = (
  endpoint: string,
  userId: string,
  username: string,
  avatarUrl?: string
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const ws = cloudflareAPI.createWebSocketConnection(endpoint, userId, username, avatarUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, data]);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setSocket(null);
        console.log('WebSocket disconnected');
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
      };

      setSocket(ws);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setError('Failed to connect');
    }
  }, [endpoint, userId, username, avatarUrl]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socket) {
      socket.close();
    }
  }, [socket]);

  const sendMessage = useCallback((message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  }, [socket, isConnected]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    socket,
    isConnected,
    messages,
    error,
    sendMessage,
    connect,
    disconnect,
    clearMessages: () => setMessages([]),
  };
};

// Chat room hook
export const useChatRoom = (roomId: string, userId: string, username: string, avatarUrl?: string) => {
  return useWebSocket(`/chat/${roomId}/websocket`, userId, username, avatarUrl);
};

// Live challenge hook
export const useLiveChallenge = (challengeId: string, userId: string, username: string, avatarUrl?: string) => {
  return useWebSocket(`/challenge/${challengeId}/websocket`, userId, username, avatarUrl);
};

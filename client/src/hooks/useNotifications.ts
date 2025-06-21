'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

export enum NotificationType {
  CHALLENGE_JOINED = 'challenge_joined',
  CHALLENGE_COMPLETED = 'challenge_completed',
  CHALLENGE_REWARD = 'challenge_reward',
  NFT_PURCHASED = 'nft_purchased',
  NFT_SOLD = 'nft_sold',
  NFT_LISTED = 'nft_listed',
  FILM_LIKED = 'film_liked',
  FILM_COMMENTED = 'film_commented',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  SYSTEM_UPDATE = 'system_update',
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createSupabaseClient()

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      const notification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error)
    }
  }

  // Create notification (for testing or admin use)
  const createNotification = async (
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type,
          title,
          message,
          data,
          read: false,
        })

      if (error) throw error

      await fetchNotifications()
    } catch (error: any) {
      console.error('Error creating notification:', error)
    }
  }

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)

          // Show toast notification
          showToastNotification(newNotification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          
          setNotifications(prev =>
            prev.map(n =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchNotifications, supabase])

  // Show toast notification
  const showToastNotification = (notification: Notification) => {
    const toastOptions = {
      duration: 5000,
      style: {
        background: '#363636',
        color: '#fff',
      },
    }

    switch (notification.type) {
      case NotificationType.CHALLENGE_REWARD:
        toast.success(`🏆 ${notification.title}`, toastOptions)
        break
      case NotificationType.NFT_PURCHASED:
        toast.success(`🏠 ${notification.title}`, toastOptions)
        break
      case NotificationType.PAYMENT_RECEIVED:
        toast.success(`💰 ${notification.title}`, toastOptions)
        break
      case NotificationType.PAYMENT_FAILED:
        toast.error(`❌ ${notification.title}`, toastOptions)
        break
      default:
        toast(`📢 ${notification.title}`, toastOptions)
    }
  }

  // Get notification icon
  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.CHALLENGE_JOINED:
      case NotificationType.CHALLENGE_COMPLETED:
      case NotificationType.CHALLENGE_REWARD:
        return '🏆'
      case NotificationType.NFT_PURCHASED:
      case NotificationType.NFT_SOLD:
      case NotificationType.NFT_LISTED:
        return '🏠'
      case NotificationType.FILM_LIKED:
      case NotificationType.FILM_COMMENTED:
        return '🎬'
      case NotificationType.PAYMENT_RECEIVED:
        return '💰'
      case NotificationType.PAYMENT_FAILED:
        return '❌'
      case NotificationType.SYSTEM_UPDATE:
        return '🔔'
      default:
        return '📢'
    }
  }

  // Get notification color
  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.CHALLENGE_REWARD:
      case NotificationType.PAYMENT_RECEIVED:
        return 'text-green-600'
      case NotificationType.PAYMENT_FAILED:
        return 'text-red-600'
      case NotificationType.NFT_PURCHASED:
      case NotificationType.NFT_SOLD:
        return 'text-nft-600'
      case NotificationType.CHALLENGE_JOINED:
      case NotificationType.CHALLENGE_COMPLETED:
        return 'text-challenz-600'
      case NotificationType.FILM_LIKED:
      case NotificationType.FILM_COMMENTED:
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  // Request notification permission
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  // Send browser notification
  const sendBrowserNotification = (notification: Notification) => {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
      })
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getNotificationIcon,
    getNotificationColor,
    requestNotificationPermission,
    sendBrowserNotification,
    refetch: fetchNotifications,
  }
}

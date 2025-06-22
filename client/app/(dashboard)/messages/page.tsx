'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle,
  Send,
  Search,
  Plus,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Image as ImageIcon,
  Mic,
  Users,
  Settings,
  Archive,
  Star,
  Pin,
  Reply,
  Forward,
  Trash2,
  Edit,
  Check,
  CheckCheck,
  Clock,
  Online,
  Camera
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

// Mock data
const mockConversations = [
  {
    id: '1',
    type: 'direct',
    name: 'Sarah Johnson',
    avatar: '/api/placeholder/40/40',
    lastMessage: 'Great work on the challenge! Looking forward to collaborating more.',
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
    unreadCount: 2,
    isOnline: true,
    isTyping: false,
    isPinned: true
  },
  {
    id: '2',
    type: 'group',
    name: 'Film Creators Hub',
    avatar: '/api/placeholder/40/40',
    lastMessage: 'Mike: Just uploaded the final cut! Check it out.',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 5,
    isOnline: false,
    isTyping: false,
    isPinned: false,
    memberCount: 12
  },
  {
    id: '3',
    type: 'direct',
    name: 'Alex Chen',
    avatar: '/api/placeholder/40/40',
    lastMessage: 'Thanks for the feedback on my submission!',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    isPinned: false
  },
  {
    id: '4',
    type: 'group',
    name: 'Real Estate Investors',
    avatar: '/api/placeholder/40/40',
    lastMessage: 'Lisa: New property just listed in downtown!',
    lastMessageTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    unreadCount: 1,
    isOnline: false,
    isTyping: false,
    isPinned: false,
    memberCount: 8
  }
]

const mockMessages = [
  {
    id: '1',
    senderId: '2',
    senderName: 'Sarah Johnson',
    senderAvatar: '/api/placeholder/32/32',
    content: 'Hey! I saw your latest film submission. The cinematography is absolutely stunning!',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    type: 'text',
    status: 'read',
    reactions: [
      { emoji: '👏', count: 2, users: ['user1', 'user2'] },
      { emoji: '🔥', count: 1, users: ['user3'] }
    ]
  },
  {
    id: '2',
    senderId: 'current',
    senderName: 'You',
    senderAvatar: '/api/placeholder/32/32',
    content: 'Thank you so much! I really appreciate the feedback. It took weeks to get those shots right.',
    timestamp: new Date(Date.now() - 55 * 60 * 1000),
    type: 'text',
    status: 'read'
  },
  {
    id: '3',
    senderId: '2',
    senderName: 'Sarah Johnson',
    senderAvatar: '/api/placeholder/32/32',
    content: 'I can tell! The lighting in the sunset scene was perfect. How did you manage to capture that?',
    timestamp: new Date(Date.now() - 50 * 60 * 1000),
    type: 'text',
    status: 'read'
  },
  {
    id: '4',
    senderId: 'current',
    senderName: 'You',
    senderAvatar: '/api/placeholder/32/32',
    content: 'Actually, let me show you the behind-the-scenes setup...',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    type: 'text',
    status: 'read'
  },
  {
    id: '5',
    senderId: 'current',
    senderName: 'You',
    senderAvatar: '/api/placeholder/32/32',
    content: '/api/placeholder/300/200',
    timestamp: new Date(Date.now() - 44 * 60 * 1000),
    type: 'image',
    status: 'read',
    caption: 'Here\'s the camera setup we used for that scene'
  },
  {
    id: '6',
    senderId: '2',
    senderName: 'Sarah Johnson',
    senderAvatar: '/api/placeholder/32/32',
    content: 'Wow, that\'s quite the setup! No wonder it looked so professional. Great work on the challenge! Looking forward to collaborating more.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    type: 'text',
    status: 'delivered'
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'sent': return <Check className="h-3 w-3 text-gray-400" />
    case 'delivered': return <CheckCheck className="h-3 w-3 text-gray-400" />
    case 'read': return <CheckCheck className="h-3 w-3 text-blue-500" />
    default: return <Clock className="h-3 w-3 text-gray-400" />
  }
}

export default function MessagesPage() {
  const { user } = useEnhancedAuth()
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0])
  const [conversations, setConversations] = useState(mockConversations)
  const [messages, setMessages] = useState(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: Date.now().toString(),
      senderId: 'current',
      senderName: 'You',
      senderAvatar: '/api/placeholder/32/32',
      content: newMessage,
      timestamp: new Date(),
      type: 'text' as const,
      status: 'sent' as const
    }

    setMessages([...messages, message])
    setNewMessage('')

    // Update conversation last message
    setConversations(conversations.map(conv => 
      conv.id === selectedConversation.id 
        ? { ...conv, lastMessage: newMessage, lastMessageTime: new Date() }
        : conv
    ))

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'delivered' } : msg
      ))
    }, 1000)

    // Simulate read receipt
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'read' } : msg
      ))
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <ProtectedRoute requiredRole={UserRole.USER}>
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Conversations Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Messages
                  </CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-3">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation.id === conversation.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conversation.avatar} />
                              <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                            </Avatar>
                            {conversation.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm truncate">{conversation.name}</h4>
                                {conversation.isPinned && <Pin className="h-3 w-3 text-gray-400" />}
                                {conversation.type === 'group' && <Users className="h-3 w-3 text-gray-400" />}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">
                                  {formatTime(conversation.lastMessageTime)}
                                </span>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {conversation.isTyping ? (
                                <span className="text-blue-600 italic">typing...</span>
                              ) : (
                                conversation.lastMessage
                              )}
                            </p>
                            {conversation.type === 'group' && (
                              <p className="text-xs text-gray-500 mt-1">
                                {conversation.memberCount} members
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.avatar} />
                        <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                      </Avatar>
                      {selectedConversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.name}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedConversation.isOnline ? 'Online' : `Last seen ${formatDistanceToNow(selectedConversation.lastMessageTime)} ago`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.senderId === 'current' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.senderId !== 'current' && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.senderAvatar} />
                            <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-xs lg:max-w-md ${
                          message.senderId === 'current' ? 'order-first' : ''
                        }`}>
                          <div className={`rounded-lg p-3 ${
                            message.senderId === 'current'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            {message.type === 'text' ? (
                              <p className="text-sm">{message.content}</p>
                            ) : message.type === 'image' ? (
                              <div>
                                <img
                                  src={message.content}
                                  alt="Shared image"
                                  className="rounded-lg max-w-full h-auto"
                                />
                                {message.caption && (
                                  <p className="text-sm mt-2">{message.caption}</p>
                                )}
                              </div>
                            ) : null}
                          </div>
                          
                          <div className={`flex items-center gap-2 mt-1 ${
                            message.senderId === 'current' ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.senderId === 'current' && getStatusIcon(message.status)}
                          </div>

                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {message.reactions.map((reaction, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-1 bg-white border rounded-full px-2 py-1 text-xs"
                                >
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {message.senderId === 'current' && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.senderAvatar} />
                            <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <Separator />

              {/* Message Input */}
              <div className="p-4">
                <div className="flex items-end gap-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="min-h-[40px] max-h-32 resize-none"
                      rows={1}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

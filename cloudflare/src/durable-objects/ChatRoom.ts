import { DurableObject } from 'cloudflare:workers';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'text' | 'image' | 'file' | 'system';
}

interface ChatUser {
  id: string;
  username: string;
  avatar_url?: string;
  joined_at: number;
  last_seen: number;
}

export class ChatRoom extends DurableObject {
  private sessions: Map<WebSocket, ChatUser> = new Map();
  private messages: ChatMessage[] = [];
  private users: Map<string, ChatUser> = new Map();
  private roomId: string;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.roomId = ctx.id.toString();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case '/websocket':
        return this.handleWebSocket(request);
      case '/messages':
        return this.handleGetMessages(request);
      case '/users':
        return this.handleGetUsers(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    // Get user info from query params or headers
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const username = url.searchParams.get('username');
    const avatarUrl = url.searchParams.get('avatar_url');

    if (!userId || !username) {
      return new Response('Missing user_id or username', { status: 400 });
    }

    const [client, server] = Object.values(new WebSocketPair());

    const user: ChatUser = {
      id: userId,
      username,
      avatar_url: avatarUrl || undefined,
      joined_at: Date.now(),
      last_seen: Date.now(),
    };

    this.sessions.set(server, user);
    this.users.set(userId, user);

    server.accept();

    // Send recent messages to new user
    server.send(JSON.stringify({
      type: 'message_history',
      data: this.messages.slice(-50), // Last 50 messages
    }));

    // Send current users list
    server.send(JSON.stringify({
      type: 'users_list',
      data: Array.from(this.users.values()),
    }));

    // Notify other users about new user
    this.broadcast({
      type: 'user_joined',
      data: user,
    }, server);

    // Send system message
    const systemMessage: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: 'system',
      username: 'System',
      message: `${username} joined the chat`,
      timestamp: Date.now(),
      type: 'system',
    };

    this.addMessage(systemMessage);
    this.broadcast({
      type: 'new_message',
      data: systemMessage,
    });

    server.addEventListener('message', (event) => {
      this.handleMessage(server, event.data as string);
    });

    server.addEventListener('close', () => {
      this.handleDisconnect(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleMessage(socket: WebSocket, data: string): void {
    try {
      const message = JSON.parse(data);
      const user = this.sessions.get(socket);

      if (!user) {
        socket.send(JSON.stringify({
          type: 'error',
          data: { message: 'User not found' },
        }));
        return;
      }

      // Update last seen
      user.last_seen = Date.now();
      this.users.set(user.id, user);

      switch (message.type) {
        case 'send_message':
          this.handleSendMessage(user, message.data);
          break;
        case 'typing_start':
          this.handleTyping(user, true);
          break;
        case 'typing_stop':
          this.handleTyping(user, false);
          break;
        default:
          socket.send(JSON.stringify({
            type: 'error',
            data: { message: 'Unknown message type' },
          }));
      }
    } catch (error) {
      socket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' },
      }));
    }
  }

  private handleSendMessage(user: ChatUser, messageData: any): void {
    const { message, type = 'text' } = messageData;

    if (!message || message.trim().length === 0) {
      return;
    }

    // Validate message length
    if (message.length > 1000) {
      return;
    }

    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      username: user.username,
      message: message.trim(),
      timestamp: Date.now(),
      type,
    };

    this.addMessage(chatMessage);

    this.broadcast({
      type: 'new_message',
      data: chatMessage,
    });
  }

  private handleTyping(user: ChatUser, isTyping: boolean): void {
    this.broadcast({
      type: isTyping ? 'user_typing_start' : 'user_typing_stop',
      data: { user_id: user.id, username: user.username },
    }, this.getSocketByUser(user));
  }

  private handleDisconnect(socket: WebSocket): void {
    const user = this.sessions.get(socket);
    if (user) {
      this.sessions.delete(socket);
      this.users.delete(user.id);

      // Notify other users
      this.broadcast({
        type: 'user_left',
        data: user,
      });

      // Send system message
      const systemMessage: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: 'system',
        username: 'System',
        message: `${user.username} left the chat`,
        timestamp: Date.now(),
        type: 'system',
      };

      this.addMessage(systemMessage);
      this.broadcast({
        type: 'new_message',
        data: systemMessage,
      });
    }
  }

  private addMessage(message: ChatMessage): void {
    this.messages.push(message);
    
    // Keep only last 1000 messages in memory
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }
  }

  private broadcast(message: any, exclude?: WebSocket): void {
    const messageStr = JSON.stringify(message);
    
    for (const [socket, user] of this.sessions) {
      if (socket !== exclude && socket.readyState === WebSocket.READY_STATE_OPEN) {
        try {
          socket.send(messageStr);
        } catch (error) {
          // Remove broken connections
          this.sessions.delete(socket);
          this.users.delete(user.id);
        }
      }
    }
  }

  private getSocketByUser(user: ChatUser): WebSocket | undefined {
    for (const [socket, sessionUser] of this.sessions) {
      if (sessionUser.id === user.id) {
        return socket;
      }
    }
    return undefined;
  }

  private async handleGetMessages(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const messages = this.messages.slice(-limit - offset, -offset || undefined);

    return new Response(JSON.stringify({
      success: true,
      data: messages,
      total: this.messages.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleGetUsers(request: Request): Promise<Response> {
    return new Response(JSON.stringify({
      success: true,
      data: Array.from(this.users.values()),
      total: this.users.size,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

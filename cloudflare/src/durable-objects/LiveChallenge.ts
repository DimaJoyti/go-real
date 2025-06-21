import { DurableObject } from 'cloudflare:workers';

interface ChallengeParticipant {
  id: string;
  username: string;
  avatar_url?: string;
  joined_at: number;
  score: number;
  submissions: number;
  last_activity: number;
}

interface ChallengeSubmission {
  id: string;
  participant_id: string;
  username: string;
  content: string;
  file_url?: string;
  submitted_at: number;
  votes: number;
  voters: string[];
}

interface ChallengeUpdate {
  type: 'participant_joined' | 'participant_left' | 'new_submission' | 'vote_cast' | 'challenge_ended';
  data: any;
  timestamp: number;
}

export class LiveChallenge extends DurableObject {
  private sessions: Map<WebSocket, ChallengeParticipant> = new Map();
  private participants: Map<string, ChallengeParticipant> = new Map();
  private submissions: Map<string, ChallengeSubmission> = new Map();
  private challengeId: string;
  private challengeData: any = null;
  private isActive: boolean = true;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.challengeId = ctx.id.toString();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case '/websocket':
        return this.handleWebSocket(request);
      case '/participants':
        return this.handleGetParticipants(request);
      case '/submissions':
        return this.handleGetSubmissions(request);
      case '/submit':
        return this.handleSubmission(request);
      case '/vote':
        return this.handleVote(request);
      case '/end':
        return this.handleEndChallenge(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const username = url.searchParams.get('username');
    const avatarUrl = url.searchParams.get('avatar_url');

    if (!userId || !username) {
      return new Response('Missing user_id or username', { status: 400 });
    }

    const [client, server] = Object.values(new WebSocketPair());

    const participant: ChallengeParticipant = {
      id: userId,
      username,
      avatar_url: avatarUrl || undefined,
      joined_at: Date.now(),
      score: 0,
      submissions: 0,
      last_activity: Date.now(),
    };

    this.sessions.set(server, participant);
    this.participants.set(userId, participant);

    server.accept();

    // Send current challenge state
    server.send(JSON.stringify({
      type: 'challenge_state',
      data: {
        challenge: this.challengeData,
        participants: Array.from(this.participants.values()),
        submissions: Array.from(this.submissions.values()),
        is_active: this.isActive,
      },
    }));

    // Notify other participants
    this.broadcast({
      type: 'participant_joined',
      data: participant,
      timestamp: Date.now(),
    }, server);

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
      const participant = this.sessions.get(socket);

      if (!participant) {
        socket.send(JSON.stringify({
          type: 'error',
          data: { message: 'Participant not found' },
        }));
        return;
      }

      // Update last activity
      participant.last_activity = Date.now();
      this.participants.set(participant.id, participant);

      switch (message.type) {
        case 'submit_entry':
          this.handleSubmissionMessage(participant, message.data);
          break;
        case 'cast_vote':
          this.handleVoteMessage(participant, message.data);
          break;
        case 'get_leaderboard':
          this.handleGetLeaderboard(socket);
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

  private handleSubmissionMessage(participant: ChallengeParticipant, submissionData: any): void {
    if (!this.isActive) {
      return;
    }

    const { content, file_url } = submissionData;

    if (!content || content.trim().length === 0) {
      return;
    }

    const submission: ChallengeSubmission = {
      id: crypto.randomUUID(),
      participant_id: participant.id,
      username: participant.username,
      content: content.trim(),
      file_url,
      submitted_at: Date.now(),
      votes: 0,
      voters: [],
    };

    this.submissions.set(submission.id, submission);

    // Update participant stats
    participant.submissions += 1;
    participant.score += 10; // Base points for submission
    this.participants.set(participant.id, participant);

    // Broadcast new submission
    this.broadcast({
      type: 'new_submission',
      data: submission,
      timestamp: Date.now(),
    });
  }

  private handleVoteMessage(participant: ChallengeParticipant, voteData: any): void {
    if (!this.isActive) {
      return;
    }

    const { submission_id } = voteData;
    const submission = this.submissions.get(submission_id);

    if (!submission) {
      return;
    }

    // Can't vote for own submission
    if (submission.participant_id === participant.id) {
      return;
    }

    // Check if already voted
    if (submission.voters.includes(participant.id)) {
      return;
    }

    // Add vote
    submission.votes += 1;
    submission.voters.push(participant.id);
    this.submissions.set(submission_id, submission);

    // Update submission author's score
    const author = this.participants.get(submission.participant_id);
    if (author) {
      author.score += 5; // Points for receiving a vote
      this.participants.set(author.id, author);
    }

    // Broadcast vote update
    this.broadcast({
      type: 'vote_cast',
      data: {
        submission_id,
        votes: submission.votes,
        voter_id: participant.id,
      },
      timestamp: Date.now(),
    });
  }

  private handleGetLeaderboard(socket: WebSocket): void {
    const leaderboard = Array.from(this.participants.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    socket.send(JSON.stringify({
      type: 'leaderboard',
      data: leaderboard,
    }));
  }

  private handleDisconnect(socket: WebSocket): void {
    const participant = this.sessions.get(socket);
    if (participant) {
      this.sessions.delete(socket);
      // Keep participant data but mark as offline
      participant.last_activity = Date.now();
      this.participants.set(participant.id, participant);

      this.broadcast({
        type: 'participant_left',
        data: { participant_id: participant.id },
        timestamp: Date.now(),
      });
    }
  }

  private broadcast(update: ChallengeUpdate, exclude?: WebSocket): void {
    const messageStr = JSON.stringify(update);
    
    for (const [socket, participant] of this.sessions) {
      if (socket !== exclude && socket.readyState === WebSocket.READY_STATE_OPEN) {
        try {
          socket.send(messageStr);
        } catch (error) {
          // Remove broken connections
          this.sessions.delete(socket);
        }
      }
    }
  }

  private async handleSubmission(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json() as any;
    const { participant_id, content, file_url } = body;

    if (!this.isActive) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Challenge is not active',
      }), { status: 400 });
    }

    const participant = this.participants.get(participant_id);
    if (!participant) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Participant not found',
      }), { status: 404 });
    }

    const submission: ChallengeSubmission = {
      id: crypto.randomUUID(),
      participant_id,
      username: participant.username,
      content,
      file_url,
      submitted_at: Date.now(),
      votes: 0,
      voters: [],
    };

    this.submissions.set(submission.id, submission);

    // Update participant
    participant.submissions += 1;
    participant.score += 10;
    this.participants.set(participant_id, participant);

    // Broadcast to all connected clients
    this.broadcast({
      type: 'new_submission',
      data: submission,
      timestamp: Date.now(),
    });

    return new Response(JSON.stringify({
      success: true,
      data: submission,
    }));
  }

  private async handleVote(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json() as any;
    const { participant_id, submission_id } = body;

    const submission = this.submissions.get(submission_id);
    if (!submission) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Submission not found',
      }), { status: 404 });
    }

    if (submission.voters.includes(participant_id)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Already voted',
      }), { status: 400 });
    }

    submission.votes += 1;
    submission.voters.push(participant_id);
    this.submissions.set(submission_id, submission);

    return new Response(JSON.stringify({
      success: true,
      data: { votes: submission.votes },
    }));
  }

  private async handleEndChallenge(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    this.isActive = false;

    // Calculate final leaderboard
    const finalLeaderboard = Array.from(this.participants.values())
      .sort((a, b) => b.score - a.score);

    this.broadcast({
      type: 'challenge_ended',
      data: { leaderboard: finalLeaderboard },
      timestamp: Date.now(),
    });

    return new Response(JSON.stringify({
      success: true,
      data: { leaderboard: finalLeaderboard },
    }));
  }

  private async handleGetParticipants(request: Request): Promise<Response> {
    return new Response(JSON.stringify({
      success: true,
      data: Array.from(this.participants.values()),
    }));
  }

  private async handleGetSubmissions(request: Request): Promise<Response> {
    return new Response(JSON.stringify({
      success: true,
      data: Array.from(this.submissions.values()),
    }));
  }
}

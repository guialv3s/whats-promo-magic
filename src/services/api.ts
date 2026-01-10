import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:3001';

class ApiService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<(data: any) => void>> = new Map();

    constructor() {
        this.connect();
    }

    private connect() {
        if (this.socket?.connected) return;

        this.socket = io(API_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        });

        this.socket.on('connect', () => {
            console.log('🔌 Conectado ao servidor');
        });

        this.socket.on('disconnect', () => {
            console.log('📴 Desconectado do servidor');
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Erro de conexão:', error.message);
        });

        // Re-emit events to registered listeners
        const events = [
            'connection-status',
            'qr-code',
            'loading-progress',
            'scheduled-messages',
            'message-scheduled',
            'message-sent',
            'message-failed',
            'message-cancelled',
            'message-status-updated'
        ];

        events.forEach(event => {
            this.socket?.on(event, (data) => {
                this.emit(event, data);
            });
        });
    }

    // Event system for components
    on(event: string, callback: (data: any) => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    private emit(event: string, data: any) {
        this.listeners.get(event)?.forEach(callback => callback(data));
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    // WhatsApp API
    async connectWhatsApp(): Promise<{ success: boolean; message?: string; error?: string }> {
        const response = await fetch(`${API_URL}/api/whatsapp/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    }

    async disconnectWhatsApp(): Promise<{ success: boolean }> {
        const response = await fetch(`${API_URL}/api/whatsapp/disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    }

    async getWhatsAppStatus(): Promise<{ status: string; isReady: boolean }> {
        const response = await fetch(`${API_URL}/api/whatsapp/status`);
        return response.json();
    }

    async refreshQRCode(): Promise<{ success: boolean }> {
        const response = await fetch(`${API_URL}/api/whatsapp/refresh-qr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    }

    async getGroups(): Promise<{ success: boolean; groups: WhatsAppGroup[] }> {
        const response = await fetch(`${API_URL}/api/whatsapp/groups`);
        return response.json();
    }

    // Messages API
    async getScheduledMessages(): Promise<{ success: boolean; messages: ScheduledMessage[] }> {
        const response = await fetch(`${API_URL}/api/messages`);
        return response.json();
    }

    async scheduleMessage(data: ScheduleMessageRequest): Promise<{ success: boolean; message?: ScheduledMessage; error?: string }> {
        const response = await fetch(`${API_URL}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }

    async cancelMessage(id: string): Promise<{ success: boolean }> {
        const response = await fetch(`${API_URL}/api/messages/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }

    async sendMessageNow(groupId: string, message: string, imageBase64?: string | null): Promise<{ success: boolean; message?: string; error?: string }> {
        const response = await fetch(`${API_URL}/api/messages/send-now`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, message, imageBase64 })
        });
        return response.json();
    }

    async getHealth(): Promise<{ status: string; whatsapp: string; scheduledMessages: number }> {
        const response = await fetch(`${API_URL}/api/health`);
        return response.json();
    }
}

// Types
export interface WhatsAppGroup {
    id: string;
    name: string;
    participants: number;
    isGroup?: boolean;
}

export interface ScheduledMessage {
    id: string;
    message: string;
    scheduledTime: string;
    groupId: string;
    groupName?: string;
    productData?: any;
    status: 'scheduled' | 'sent' | 'failed' | 'cancelled' | 'expired';
    createdAt: string;
    sentAt?: string;
    error?: string;
}

export interface ScheduleMessageRequest {
    message: string;
    scheduledTime: Date | string;
    groupId: string;
    groupName?: string;
    productData?: any;
}

// Singleton instance
export const apiService = new ApiService();

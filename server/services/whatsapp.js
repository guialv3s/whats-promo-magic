import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import QRCode from 'qrcode';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = join(__dirname, '../uploads');

export class WhatsAppService {
    constructor(io) {
        this.io = io;
        this.client = null;
        this.status = 'disconnected'; // disconnected, connecting, scanning, connected, error
        this.qrCode = null;
        this.ready = false;

        // Ensure uploads directory exists
        if (!existsSync(UPLOADS_DIR)) {
            mkdirSync(UPLOADS_DIR, { recursive: true });
        }
    }

    async connect() {
        if (this.client) {
            console.log('⚠️ Cliente já existe, destruindo...');
            await this.disconnect();
        }

        console.log('🔄 Iniciando conexão com WhatsApp...');
        this.setStatus('connecting');

        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './whatsapp-session'
            }),
            puppeteer: {
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, 
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--single-process',
                ]
            }
        });

        // QR Code event
        this.client.on('qr', async (qr) => {
            console.log('📱 QR Code gerado');
            this.setStatus('scanning');

            try {
                // Convert QR to data URL
                const qrDataUrl = await QRCode.toDataURL(qr, {
                    width: 256,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                });

                this.qrCode = qrDataUrl;
                this.io.emit('qr-code', { qrCode: qrDataUrl });
                this.io.emit('connection-status', { status: 'scanning', qrCode: qrDataUrl });
            } catch (error) {
                console.error('Erro ao gerar QR Code:', error);
            }
        });

        // Ready event
        this.client.on('ready', () => {
            console.log('✅ WhatsApp conectado e pronto!');
            this.setStatus('connected');
            this.ready = true;
            this.qrCode = null;
            this.io.emit('connection-status', { status: 'connected', isReady: true });
        });

        // Authenticated event
        this.client.on('authenticated', () => {
            console.log('🔐 Autenticado com sucesso!');
        });

        // Auth failure event
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação:', msg);
            this.setStatus('error');
            this.ready = false;
            this.io.emit('connection-status', { status: 'error', error: msg });
        });

        // Disconnected event
        this.client.on('disconnected', (reason) => {
            console.log('📴 Desconectado:', reason);
            this.setStatus('disconnected');
            this.ready = false;
            this.qrCode = null;
            this.io.emit('connection-status', { status: 'disconnected', reason });
        });

        // Loading screen event
        this.client.on('loading_screen', (percent, message) => {
            console.log(`⏳ Carregando: ${percent}% - ${message}`);
            this.io.emit('loading-progress', { percent, message });
        });

        // Errors
        this.client.on('error', (error) => {
            console.error('❌ Erro no cliente WhatsApp:', error);
        });

        // Initialize the client
        try {
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Erro ao inicializar cliente:', error);
            this.setStatus('error');
            // Do not rethrow, just log, so the server keeps running
        }
    }

    async disconnect() {
        console.log('📴 Desconectando WhatsApp...');

        if (this.client) {
            try {
                await this.client.destroy();
            } catch (error) {
                console.error('Erro ao desconectar:', error);
            }
            this.client = null;
        }

        this.setStatus('disconnected');
        this.ready = false;
        this.qrCode = null;
        this.io.emit('connection-status', { status: 'disconnected' });
    }

    async refreshQR() {
        console.log('🔄 Atualizando QR Code...');
        // Restart the connection to get a new QR
        await this.disconnect();
        await this.connect();
    }

    async getGroups() {
        if (!this.ready || !this.client) {
            throw new Error('WhatsApp não está conectado');
        }

        try {
            console.log('📋 Buscando chats...');

            // Retry logic: try up to 3 times with 2s delay
            let chats = [];
            for (let i = 0; i < 3; i++) {
                chats = await this.client.getChats();
                if (chats && chats.length > 0) break;
                console.log(`⏳ Sincronizando chats (tentativa ${i + 1}/3)...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log(`✅ ${chats.length} conversas encontradas`);

            const allChats = chats.map(chat => ({
                id: chat.id._serialized,
                name: chat.name || chat.pushname || chat.formattedTitle || 'Desconhecido',
                participants: chat.isGroup ? (chat.participants?.length || 0) : 1,
                isGroup: chat.isGroup
            }));

            // Filter out chats with no name or invalid ID
            const validChats = allChats.filter(chat => chat.id && chat.name !== 'Desconhecido');

            return validChats;
        } catch (error) {
            console.error('❌ Erro ao buscar grupos:', error);
            // Return empty array instead of throwing if just syncing issue
            if (error.message.includes('Evaluation failed')) {
                return [];
            }
            throw new Error(`Erro ao carregar grupos: ${error.message}`);
        }
    }

    async sendMessage(chatId, message, imageBase64 = null) {
        if (!this.ready || !this.client) {
            throw new Error('WhatsApp não está conectado');
        }

        try {
            console.log(`📤 Enviando mensagem para ${chatId}...`);

            if (imageBase64) {
                console.log('📷 Enviando imagem com legenda...');
                const media = await this.createMediaFromBase64(imageBase64);

                const result = await this.client.sendMessage(chatId, media, {
                    caption: message
                });

                console.log('✅ Imagem com legenda enviada com sucesso!');
                return result;
            } else {
                console.log('💬 Enviando mensagem de texto...');
                const result = await this.client.sendMessage(chatId, message);
                console.log('✅ Mensagem enviada com sucesso!');
                return result;
            }
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    async createMediaFromBase64(base64String) {
        try {
            // Extract mime type and data from base64 string
            // Format: data:image/jpeg;base64,/9j/4AAQ...
            const matches = base64String.match(/^data:(.+);base64,(.+)$/);

            if (!matches) {
                throw new Error('Formato de imagem inválido');
            }

            const mimeType = matches[1];
            const data = matches[2];

            // Determine file extension
            let extension = 'jpg';
            if (mimeType.includes('png')) {
                extension = 'png';
            } else if (mimeType.includes('gif')) {
                extension = 'gif';
            } else if (mimeType.includes('webp')) {
                extension = 'webp';
            }

            // Create MessageMedia from base64
            const media = new MessageMedia(mimeType, data, `product.${extension}`);

            return media;
        } catch (error) {
            console.error('Erro ao criar media:', error);
            throw error;
        }
    }

    setStatus(status) {
        this.status = status;
        console.log(`📊 Status: ${status}`);
    }

    getStatus() {
        return this.status;
    }

    isReady() {
        return this.ready;
    }

    getQRCode() {
        return this.qrCode;
    }
}

import pkg from 'whatsapp-web.js';
const { Client, RemoteAuth, MessageMedia } = pkg;
import QRCode from 'qrcode';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = join(__dirname, '../uploads');

// ADAPTADOR CUSTOMIZADO PARA NEON (Sem depender de wwebjs-pg externo)
class NeonStore {
    constructor(pool) {
        this.pool = pool;
    }
    async sessionExists(options) {
        const res = await this.pool.query('SELECT 1 FROM whatsapp_sessions WHERE session_id = $1', [options.session]);
        return res.rowCount > 0;
    }
    async save(options) {
        await this.pool.query(
            'INSERT INTO whatsapp_sessions (session_id, data) VALUES ($1, $2) ON CONFLICT (session_id) DO UPDATE SET data = $2, updated_at = NOW()',
            [options.session, JSON.stringify(options.userData)]
        );
    }
    async extract(options) {
        const res = await this.pool.query('SELECT data FROM whatsapp_sessions WHERE session_id = $1', [options.session]);
        return res.rowCount > 0 ? JSON.parse(res.rows[0].data) : null;
    }
    async delete(options) {
        await this.pool.query('DELETE FROM whatsapp_sessions WHERE session_id = $1', [options.session]);
    }
}

export class WhatsAppService {
    constructor(io) {
        this.io = io;
        this.client = null;
        this.status = 'disconnected';
        this.qrCode = null;
        this.ready = false;

        const { Pool } = pg;
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        if (!existsSync(UPLOADS_DIR)) {
            mkdirSync(UPLOADS_DIR, { recursive: true });
        }
    }

    async connect() {
        if (this.client) {
            console.log('⚠️ Cliente já existe, destruindo...');
            await this.disconnect();
        }

        console.log('🔄 Iniciando conexão com WhatsApp + Neon...');
        this.setStatus('connecting');

        try {
            await this.pool.query('SELECT NOW()');
            console.log('✅ Conexão com Neon estabelecida');

            const store = new NeonStore(this.pool);

            this.client = new Client({
                authStrategy: new RemoteAuth({
                    store: store,
                    backupSyncIntervalMs: 300000, // Backup a cada 5 min
                    session: 'sessao-magic'
                }),
                puppeteer: {
                    headless: true,
                    // Removemos executablePath fixo para o Render usar o que ele instalou
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--single-process',
                        '--no-zygote'
                    ],
                }
            });

            this.setupEventListeners();
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Erro ao conectar:', error);
            this.setStatus('error');
        }
    }

    setupEventListeners() {
        this.client.on('remote_session_saved', () => {
            console.log('💾 SESSÃO SALVA: Dados sincronizados com o Neon!');
        });

        this.client.on('qr', async (qr) => {
            console.log('📱 QR Code gerado');
            this.setStatus('scanning');
            try {
                const qrDataUrl = await QRCode.toDataURL(qr, { width: 256 });
                this.qrCode = qrDataUrl;
                this.io.emit('connection-status', { status: 'scanning', qrCode: qrDataUrl });
            } catch (error) {
                console.error('Erro ao gerar QR Code:', error);
            }
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp pronto!');
            this.setStatus('connected');
            this.ready = true;
            this.io.emit('connection-status', { status: 'connected', isReady: true });
        });

        this.client.on('authenticated', () => {
            console.log('🔐 Autenticado!');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação:', msg);
            this.setStatus('error');
        });

        this.client.on('disconnected', async (reason) => {
            console.log('📴 Desconectado:', reason);
            this.setStatus('disconnected');
            this.ready = false;
        });
    }

    async disconnect() {
        if (this.client) {
            try {
                await this.client.destroy();
            } catch (e) {
                console.error('Erro ao destruir cliente:', e);
            }
            this.client = null;
        }
        this.setStatus('disconnected');
        this.ready = false;
    }

    setStatus(status) {
        this.status = status;
        console.log(`📊 Status: ${status}`);
    }

    // Métodos extras (sendMessage, etc) devem vir abaixo
    async sendMessage(chatId, message, imageBase64 = null) {
        if (!this.ready || !this.client) throw new Error('WhatsApp não está conectado');
        if (imageBase64) {
            const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
            const media = new MessageMedia(matches[1], matches[2], 'imagem.jpg');
            return await this.client.sendMessage(chatId, media, { caption: message });
        }
        return await this.client.sendMessage(chatId, message);
    }
}
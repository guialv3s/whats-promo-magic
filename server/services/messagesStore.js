import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../data');
const DATA_FILE = join(DATA_DIR, 'messages.json');

export class MessagesStore {
    constructor() {
        this.messages = [];
        this.ensureDataDir();
        this.load();
    }

    ensureDataDir() {
        if (!existsSync(DATA_DIR)) {
            mkdirSync(DATA_DIR, { recursive: true });
        }
    }

    load() {
        try {
            if (existsSync(DATA_FILE)) {
                const data = readFileSync(DATA_FILE, 'utf-8');
                this.messages = JSON.parse(data);
                console.log(`📂 ${this.messages.length} mensagens carregadas do arquivo`);
            } else {
                this.messages = [];
                this.save();
            }
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
            this.messages = [];
        }
    }

    save() {
        try {
            this.ensureDataDir();
            writeFileSync(DATA_FILE, JSON.stringify(this.messages, null, 2));
        } catch (error) {
            console.error('Erro ao salvar mensagens:', error);
        }
    }

    add(messageData) {
        const message = {
            id: crypto.randomUUID(),
            ...messageData,
            createdAt: new Date().toISOString()
        };

        this.messages.push(message);
        this.save();

        console.log(`📝 Mensagem ${message.id} adicionada`);
        return message;
    }

    remove(id) {
        const index = this.messages.findIndex(m => m.id === id);
        if (index !== -1) {
            this.messages.splice(index, 1);
            this.save();
            console.log(`🗑️ Mensagem ${id} removida`);
            return true;
        }
        return false;
    }

    updateStatus(id, status, error = null) {
        const message = this.messages.find(m => m.id === id);
        if (message) {
            message.status = status;
            if (error) {
                message.error = error;
            }
            if (status === 'sent') {
                message.sentAt = new Date().toISOString();
            }
            this.save();
            return message;
        }
        return null;
    }

    get(id) {
        return this.messages.find(m => m.id === id);
    }

    getAll() {
        return this.messages.sort((a, b) =>
            new Date(a.scheduledTime) - new Date(b.scheduledTime)
        );
    }

    getByStatus(status) {
        return this.messages.filter(m => m.status === status);
    }

    clear() {
        this.messages = [];
        this.save();
    }
}

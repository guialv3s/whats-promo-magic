import cron from 'node-cron';

export class SchedulerService {
    constructor(whatsappService, messagesStore, io) {
        this.whatsappService = whatsappService;
        this.messagesStore = messagesStore;
        this.io = io;
        this.scheduledJobs = new Map(); // messageId -> timeout/job
    }

    scheduleMessage(message) {
        const { id, scheduledTime, groupId, message: messageText } = message;
        const sendTime = new Date(scheduledTime);
        const now = new Date();
        const delay = sendTime.getTime() - now.getTime();

        if (delay <= 0) {
            console.log(`⏰ Mensagem ${id} já passou do horário. Enviando agora...`);
            this.sendMessage(message);
            return;
        }

        console.log(`📅 Agendando mensagem ${id} para ${sendTime.toLocaleString('pt-BR')}`);
        console.log(`   Tempo restante: ${Math.round(delay / 1000 / 60)} minutos`);

        // Use setTimeout for scheduling
        const timeoutId = setTimeout(() => {
            this.sendMessage(message);
        }, delay);

        // Store the timeout reference
        this.scheduledJobs.set(id, {
            timeoutId,
            scheduledTime: sendTime
        });

        // Update message status
        this.messagesStore.updateStatus(id, 'scheduled');
        this.io.emit('message-status-updated', { id, status: 'scheduled' });
    }

    async sendMessage(message) {
        const { id, groupId, message: messageText, groupName, productData } = message;

        console.log(`\n📤 Executando envio agendado da mensagem ${id}`);
        console.log(`   Grupo: ${groupName || groupId}`);

        try {
            // Check if WhatsApp is connected
            if (!this.whatsappService.isReady()) {
                throw new Error('WhatsApp não está conectado');
            }

            // Get image from productData if available
            const imageBase64 = productData?.productImage || null;

            if (imageBase64) {
                console.log('   📷 Mensagem inclui imagem');
            }

            // Send the message (with or without image)
            await this.whatsappService.sendMessage(groupId, messageText, imageBase64);

            // Update status to sent
            this.messagesStore.updateStatus(id, 'sent');
            this.scheduledJobs.delete(id);

            console.log(`✅ Mensagem ${id} enviada com sucesso!`);

            // Notify clients
            this.io.emit('message-sent', {
                id,
                sentAt: new Date().toISOString(),
                groupName
            });
            this.io.emit('message-status-updated', { id, status: 'sent' });
            this.io.emit('scheduled-messages', this.messagesStore.getAll());

        } catch (error) {
            console.error(`❌ Erro ao enviar mensagem ${id}:`, error.message);

            // Update status to failed
            this.messagesStore.updateStatus(id, 'failed', error.message);
            this.scheduledJobs.delete(id);

            // Notify clients
            this.io.emit('message-failed', {
                id,
                error: error.message,
                groupName
            });
            this.io.emit('message-status-updated', { id, status: 'failed', error: error.message });
            this.io.emit('scheduled-messages', this.messagesStore.getAll());
        }
    }

    cancelMessage(id) {
        const job = this.scheduledJobs.get(id);

        if (job) {
            clearTimeout(job.timeoutId);
            this.scheduledJobs.delete(id);
            console.log(`❌ Mensagem ${id} cancelada`);
        }

        this.messagesStore.updateStatus(id, 'cancelled');
    }

    rescheduleAllPending() {
        const messages = this.messagesStore.getAll();
        const pendingMessages = messages.filter(m => m.status === 'scheduled');

        console.log(`\n📋 Reagendando ${pendingMessages.length} mensagens pendentes...`);

        pendingMessages.forEach(message => {
            const sendTime = new Date(message.scheduledTime);
            const now = new Date();

            if (sendTime > now) {
                this.scheduleMessage(message);
            } else {
                console.log(`⏰ Mensagem ${message.id} perdeu o horário, marcando como expirada`);
                this.messagesStore.updateStatus(message.id, 'expired');
            }
        });

        this.io.emit('scheduled-messages', this.messagesStore.getAll());
    }

    getScheduledJobs() {
        const jobs = [];
        this.scheduledJobs.forEach((job, id) => {
            jobs.push({
                id,
                scheduledTime: job.scheduledTime
            });
        });
        return jobs;
    }
}

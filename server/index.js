import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { WhatsAppService } from './services/whatsapp.js';
import { SchedulerService } from './services/scheduler.js';
import { MessagesStore } from './services/messagesStore.js';
import { AuthService } from './services/auth.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    credentials: true
  }
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173'],
  credentials: true
}));
// Increase JSON limit for base64 images (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize services
const authService = new AuthService();
const messagesStore = new MessagesStore();
const whatsappService = new WhatsAppService(io);
const schedulerService = new SchedulerService(whatsappService, messagesStore, io);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('📱 Cliente conectado:', socket.id);

  // Send current status to new client
  socket.emit('connection-status', {
    status: whatsappService.getStatus(),
    isReady: whatsappService.isReady()
  });

  // Send scheduled messages to new client
  socket.emit('scheduled-messages', messagesStore.getAll());

  socket.on('disconnect', () => {
    console.log('📴 Cliente desconectado:', socket.id);
  });
});

// API Routes

// Authentication middleware
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !authService.validateToken(token)) {
    return res.status(401).json({ success: false, error: 'Não autorizado' });
  }

  req.user = authService.getUserFromToken(token);
  next();
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = authService.login(username, password);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      authService.logout(token);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/validate', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const isValid = token && authService.validateToken(token);

  if (isValid) {
    res.json({ success: true, username: authService.getUserFromToken(token) });
  } else {
    res.status(401).json({ success: false, error: 'Token inválido' });
  }
});

// WhatsApp Connection
app.post('/api/whatsapp/connect', requireAuth, async (req, res) => {
  try {
    await whatsappService.connect();
    res.json({ success: true, message: 'Iniciando conexão...' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/whatsapp/disconnect', requireAuth, async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.json({ success: true, message: 'Desconectado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/whatsapp/status', requireAuth, (req, res) => {
  res.json({
    status: whatsappService.getStatus(),
    isReady: whatsappService.isReady()
  });
});

app.post('/api/whatsapp/refresh-qr', requireAuth, async (req, res) => {
  try {
    await whatsappService.refreshQR();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get WhatsApp Groups
app.get('/api/whatsapp/groups', requireAuth, async (req, res) => {
  try {
    const groups = await whatsappService.getGroups();
    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scheduled Messages
app.get('/api/messages', requireAuth, (req, res) => {
  res.json({ success: true, messages: messagesStore.getAll() });
});

app.post('/api/messages', requireAuth, (req, res) => {
  try {
    const { message, scheduledTime, groupId, groupName, productData } = req.body;

    if (!message || !scheduledTime || !groupId) {
      return res.status(400).json({
        success: false,
        error: 'message, scheduledTime e groupId são obrigatórios'
      });
    }

    const newMessage = messagesStore.add({
      message,
      scheduledTime: new Date(scheduledTime),
      groupId,
      groupName,
      productData,
      status: 'scheduled'
    });

    // Schedule the message
    schedulerService.scheduleMessage(newMessage);

    // Notify all clients
    io.emit('message-scheduled', newMessage);
    io.emit('scheduled-messages', messagesStore.getAll());

    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/messages/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;

    // Cancel the scheduled job
    schedulerService.cancelMessage(id);

    // Remove from store
    messagesStore.remove(id);

    // Notify all clients
    io.emit('message-cancelled', { id });
    io.emit('scheduled-messages', messagesStore.getAll());

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send message immediately (with optional image)
app.post('/api/messages/send-now', requireAuth, async (req, res) => {
  try {
    const { message, groupId, imageBase64 } = req.body;

    if (!whatsappService.isReady()) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp não está conectado'
      });
    }

    await whatsappService.sendMessage(groupId, message, imageBase64 || null);
    res.json({ success: true, message: 'Mensagem enviada!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    whatsapp: whatsappService.getStatus(),
    scheduledMessages: messagesStore.getAll().length
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 WebSocket disponível em ws://localhost:${PORT}`);
  console.log(`\n📋 Endpoints disponíveis:`);
  console.log(`   POST /api/whatsapp/connect - Iniciar conexão`);
  console.log(`   POST /api/whatsapp/disconnect - Desconectar`);
  console.log(`   GET  /api/whatsapp/status - Status da conexão`);
  console.log(`   GET  /api/whatsapp/groups - Listar grupos`);
  console.log(`   GET  /api/messages - Listar mensagens agendadas`);
  console.log(`   POST /api/messages - Agendar mensagem`);
  console.log(`   DELETE /api/messages/:id - Cancelar mensagem`);

  // Load and reschedule pending messages
  schedulerService.rescheduleAllPending();
});

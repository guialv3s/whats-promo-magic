# WhatsApp Promo - Servidor Backend

Servidor para envio automático de mensagens no WhatsApp.

## Pré-requisitos

- Node.js 18+ instalado
- Google Chrome instalado (necessário para o whatsapp-web.js)

## Instalação

```bash
cd server
npm install
```

## Executando

```bash
npm start
# ou para desenvolvimento com auto-reload:
npm run dev
```

O servidor iniciará na porta 3001.

## Como funciona

1. O servidor gerencia a conexão com o WhatsApp usando a biblioteca `whatsapp-web.js`
2. Quando você clica em "Conectar" no frontend, um QR Code real é gerado
3. Escaneie o QR Code com seu WhatsApp para autenticar
4. A sessão é salva localmente para reconexão automática
5. Mensagens agendadas são armazenadas e enviadas no horário programado

## Endpoints da API

### WhatsApp

- `POST /api/whatsapp/connect` - Iniciar conexão
- `POST /api/whatsapp/disconnect` - Desconectar
- `GET /api/whatsapp/status` - Status da conexão
- `POST /api/whatsapp/refresh-qr` - Gerar novo QR Code
- `GET /api/whatsapp/groups` - Listar grupos do WhatsApp

### Mensagens

- `GET /api/messages` - Listar mensagens agendadas
- `POST /api/messages` - Agendar nova mensagem
- `DELETE /api/messages/:id` - Cancelar mensagem
- `POST /api/messages/send-now` - Enviar mensagem imediatamente

### Outros

- `GET /api/health` - Health check do servidor

## WebSocket

O servidor usa WebSocket (Socket.IO) para comunicação em tempo real:

- `connection-status` - Status da conexão do WhatsApp
- `qr-code` - QR Code para autenticação
- `scheduled-messages` - Lista de mensagens agendadas
- `message-sent` - Notificação de mensagem enviada
- `message-failed` - Notificação de falha no envio

## Estrutura de arquivos

```
server/
├── index.js              # Servidor Express principal
├── package.json          # Dependências
├── services/
│   ├── whatsapp.js       # Gerenciamento da conexão WhatsApp
│   ├── scheduler.js      # Agendamento de mensagens
│   └── messagesStore.js  # Armazenamento de mensagens
├── data/
│   └── messages.json     # Mensagens agendadas (criado automaticamente)
└── whatsapp-session/     # Sessão do WhatsApp (criado automaticamente)
```

## Notas importantes

- **Mantenha o servidor rodando** para que as mensagens sejam enviadas no horário agendado
- A sessão do WhatsApp é persistida localmente, então você não precisa escanear o QR toda vez
- Se você desconectar o WhatsApp do celular, precisará escanear novamente
- O Chrome/Chromium será executado em modo headless (sem interface gráfica)

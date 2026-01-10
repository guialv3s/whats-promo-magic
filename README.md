# WhatsApp Promo Magic 📱💰

Aplicação para criar e agendar mensagens promocionais no WhatsApp automaticamente.

## ✨ Funcionalidades

- **Criar mensagens promocionais** formatadas para WhatsApp
- **Agendar envio automático** para horários específicos
- **Conectar ao WhatsApp** via QR Code (como WhatsApp Web)
- **Selecionar grupos** de destino para as mensagens
- **Histórico** de mensagens criadas
- **Preview em tempo real** das mensagens

## 🚀 Como Usar

### 1. Instalar dependências

```bash
# Instalar dependências do frontend
npm install

# Instalar dependências do servidor
cd server && npm install
```

### 2. Iniciar o servidor backend

O servidor é responsável por conectar ao WhatsApp e enviar as mensagens:

```bash
# Na pasta do projeto
npm run server

# Ou diretamente
cd server && npm start
```

O servidor rodará na porta 3001.

### 3. Iniciar o frontend

Em outro terminal:

```bash
npm run dev
```

O frontend estará disponível em http://localhost:5173

### 4. Conectar ao WhatsApp

1. Acesse a aba **WhatsApp** no app
2. Clique em **Conectar meu WhatsApp**
3. Escaneie o QR Code com seu celular
4. Selecione o grupo de destino

### 5. Criar e agendar mensagens

1. Na aba **Criar**, preencha os dados do produto
2. Defina a data e horário para envio
3. Clique em **Agendar** ou **Enviar Agora**

## 📁 Estrutura do Projeto

```
whats-promo-magic/
├── src/                    # Frontend React
│   ├── components/         # Componentes da UI
│   ├── hooks/              # Hooks customizados
│   ├── services/           # API e WebSocket
│   ├── pages/              # Páginas
│   └── types/              # Tipos TypeScript
│
├── server/                 # Backend Node.js
│   ├── index.js            # Servidor Express
│   ├── services/
│   │   ├── whatsapp.js     # Conexão WhatsApp
│   │   ├── scheduler.js    # Agendador
│   │   └── messagesStore.js # Armazenamento
│   └── data/               # Dados persistidos
│
└── package.json
```

## 🛠️ Tecnologias

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Socket.IO Client

### Backend
- Node.js + Express
- whatsapp-web.js (automação WhatsApp)
- Socket.IO (tempo real)
- node-cron (agendamento)

## ⚠️ Notas Importantes

1. **Mantenha o servidor rodando** para que as mensagens agendadas sejam enviadas
2. A sessão do WhatsApp é salva localmente - você não precisa escanear o QR toda vez
3. Se desconectar o WhatsApp do celular, será necessário escanear novamente
4. O servidor usa Chrome/Chromium em modo headless

## 📝 Licença

Este projeto é para uso pessoal/educacional.

---

Feito com ❤️ para facilitar o envio de promoções no WhatsApp!

# AI Code Editor Agent

An intelligent code editing system that uses AI agents to modify single or multiple files within an application instance. The system leverages markdown files containing contextual information and code blocks to facilitate precise code modifications.

## Overview

This project creates a specialized AI agent designed for targeted code editing. Unlike traditional code editors that work with entire documents, this system focuses on editing specific sections or files using contextual markdown files that contain all necessary information for making accurate modifications.

## Architecture

### Backend
- **Node.js/Express** server with TypeScript
- **MongoDB** for persistent chat storage and document management
- **Socket.IO** for real-time communication between frontend and backend
- **LangGraph** for AI agent orchestration
- **OpenRouter API** with Gemini-2.5-flash model for AI responses

### Frontend
- **React** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Socket.IO client** for real-time chat communication

### AI Agent
- Uses **Gemini-2.5-flash** via OpenRouter
- Configured for concise responses (5-10 lines maximum)
- Processes user requests and generates code modifications
- Maintains conversation history in MongoDB

## Key Features

### Markdown-Driven Editing
- Contextual information stored in markdown files
- Code blocks within markdown provide editing context
- Focused editing approach for single document sections

### Real-Time Chat Interface
- Socket.IO-powered real-time communication
- Persistent chat storage per user and chat session
- User identification with constant user ID

### MongoDB Integration
- Chat conversations stored with full message history
- User-specific chat sessions
- Scalable document storage

## Setup

### Prerequisites
- Node.js (v18+)
- Podman (for MongoDB container)
- OpenRouter API key
- Rust (for mdbook documentation, optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-code-editor-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Edit `backend/.env` and add your OpenRouter API key:
   ```env
   # Database
   MONGO_URI=mongodb://root:example@localhost:27017/
   MONGO_USERNAME=root
   MONGO_PASSWORD=example

   # AI API
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   OPENROUTER_CHAT_MODEL=google/gemini-2.0-flash-exp:free
   ```

4. **Start the application**
   ```bash
   # This will start MongoDB, backend, and frontend
   node run-all.js
   ```

   Or start components individually:
   ```bash
   # Start MongoDB
   node run-mongo.js

   # Start backend (in another terminal)
   npm run dev --workspace=backend

   # Start frontend (in another terminal)
   npm run dev --workspace=frontend
   ```

### Documentation

Build and view the documentation:

```bash
# Build documentation
cd docs && ~/.cargo/bin/mdbook build

# Serve documentation locally (for development)
cd docs && ~/.cargo/bin/mdbook serve

# Open documentation in browser
# Visit: http://localhost:3000 (when serving)
```

## Usage

### Chat Interface
- Access the application at `http://localhost:3000` (or `http://localhost:3001` if port 3000 is in use)
- Use the chat sidebar to communicate with the AI agent
- Messages are stored in MongoDB and persist across sessions
- The AI responds with concise, helpful answers

### Testing Socket Connection
```bash
# Test socket connection with the backend
node test-socket.js
```

### Markdown Context Files
- Create markdown files containing:
  - Contextual information about the code to edit
  - Code blocks with current implementations
  - Specific requirements for modifications
- The AI agent uses this context to generate accurate code changes

## API Endpoints

### REST Endpoints
- `GET /api/health` - Health check
- `GET /api/document` - Get current document content
- `POST /api/commit` - Commit document changes
- `POST /api/ai/chat` - Direct AI chat (legacy)

### Socket.IO Events
- `join-chat` - Join a specific chat session
- `send-message` - Send a message to the AI
- `message` - Receive AI response
- `error` - Handle connection errors

## Development

### Project Structure
```
├── backend/
│   ├── src/
│   │   ├── ai/           # AI agents and LangGraph setup
│   │   ├── core/         # Core file management
│   │   ├── managers/     # Chat and data managers
│   │   ├── models/       # MongoDB schemas
│   │   └── server.ts     # Main server file
│   └── .env              # Environment variables
├── frontend/
│   └── src/
│       ├── components/   # React components
│       └── lib/          # Utilities and socket client
├── docker-compose.yml    # MongoDB setup (alternative)
├── run-all.js           # Development startup script
└── docs/                # Mdbook documentation
    ├── book.toml        # Mdbook configuration
    ├── src/             # Documentation source files
    └── book/            # Built documentation (generated)
```

### Key Components

#### ChatManager
Handles chat creation, message storage, and AI response processing.

#### ChatAgent
LangGraph-based AI agent using Gemini-2.5-flash for code editing assistance.

#### SocketManager
Manages real-time communication between frontend and backend.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]
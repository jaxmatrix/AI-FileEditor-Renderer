# Setup

This chapter covers everything you need to know to set up the AI Code Editor Agent on your system.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18+): Required for running the backend and frontend servers
- **Podman** or **Docker**: For running MongoDB in a container
- **OpenRouter API Key**: Required for AI functionality

## Installation

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
   Create the backend environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

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

## Database Setup

The system uses MongoDB for persistent storage. See the [Database Setup](database.md) chapter for detailed MongoDB configuration.

## Running the Application

### Option 1: Run Everything at Once
```bash
node run-all.js
```
This will:
1. Start the MongoDB container
2. Wait for MongoDB to initialize
3. Start the backend server (http://localhost:3001)
4. Start the frontend development server (http://localhost:3000)

### Option 2: Run Components Individually

**Start MongoDB:**
```bash
node run-mongo.js
```

**Start Backend (in another terminal):**
```bash
npm run dev --workspace=backend
```

**Start Frontend (in another terminal):**
```bash
npm run dev --workspace=frontend
```

## Verification

Once all services are running:

1. **Check MongoDB**: The container should be running on port 27017
2. **Check Backend**: Visit http://localhost:3001/api/health
3. **Check Frontend**: Visit http://localhost:3000

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB container is running: `podman ps`
- Check MongoDB logs: `podman logs local-mongodb`
- Verify environment variables in `backend/.env`

### Port Conflicts
- Backend runs on port 3001
- Frontend runs on port 3000
- MongoDB runs on port 27017
- If ports are in use, modify the respective configuration files

### API Key Issues
- Ensure your OpenRouter API key is valid
- Check the OpenRouter dashboard for usage limits
- Verify the model name is correct in the environment file

## Next Steps

Once setup is complete, proceed to the [Database Setup](database.md) chapter to learn about MongoDB configuration and data models.
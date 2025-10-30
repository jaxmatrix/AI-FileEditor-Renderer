# Database Setup

This chapter covers MongoDB setup and configuration for the AI Code Editor Agent.

## MongoDB Overview

The system uses MongoDB to store:
- Chat conversations and message history
- User sessions and chat metadata
- Document versions and editing history

## Container Setup

The project uses Podman to run MongoDB in a container. The database is configured with authentication and persistent storage.

### Environment Variables

MongoDB credentials are configured in `backend/.env`:

```env
MONGO_USERNAME=root
MONGO_PASSWORD=example
MONGO_URI=mongodb://root:example@localhost:27017/
```

### Starting MongoDB

Use the provided script to start MongoDB:

```bash
node run-mongo.js
```

This script:
1. Reads credentials from `backend/.env`
2. Starts a Podman container with MongoDB 6.0
3. Configures authentication with the specified username/password
4. Mounts `./mongodb_data` for persistent storage

### Manual Container Management

If you need to manage the container manually:

```bash
# Start container
podman run -d --name local-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=example \
  -v ./mongodb_data:/data/db \
  docker.io/library/mongo:6.0

# Stop container
podman stop local-mongodb

# Remove container
podman rm local-mongodb

# View logs
podman logs local-mongodb
```

## Data Models

### Chat Model

The main data model for storing chat conversations:

```typescript
interface IChat extends Document {
  chatId: string;        // Unique identifier for the chat session
  userId: string;        // User identifier (currently "test_user_awesome")
  messages: IMessage[];  // Array of messages in the conversation
  createdAt: Date;       // Chat creation timestamp
  updatedAt: Date;       // Last modification timestamp
}

interface IMessage {
  role: 'user' | 'assistant';  // Message sender type
  content: string;             // Message content
  timestamp: Date;             // Message timestamp
}
```

### Database Schema

MongoDB collections are automatically created when the application runs. The main collection is `chats`.

## Connection Configuration

The backend connects to MongoDB using Mongoose:

```typescript
const connectMongoDB = async () => {
  try {
    const username = process.env.MONGO_USERNAME || 'root';
    const password = process.env.MONGO_PASSWORD || 'example';
    const uri = `mongodb://${username}:${password}@localhost:27017/`;

    await mongoose.connect(uri, {
      authSource: 'admin'
    });

    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};
```

## Data Persistence

### Persistent Storage
- MongoDB data is stored in the `./mongodb_data` directory
- This directory is mounted as a volume in the container
- Data persists between container restarts

### Backup and Restore

```bash
# Backup database
podman exec local-mongodb mongodump --db admin --out /data/backup

# Copy backup to host
podman cp local-mongodb:/data/backup ./mongodb_backup

# Restore database
podman cp ./mongodb_backup local-mongodb:/data/
podman exec local-mongodb mongorestore /data/mongodb_backup
```

## Indexes

The following indexes are created for optimal performance:

```javascript
// User and chat ID index for fast lookups
ChatSchema.index({ userId: 1, chatId: 1 });
```

## Monitoring

### Connection Status
The backend logs MongoDB connection status on startup.

### Query Performance
Monitor slow queries in MongoDB logs:

```bash
podman logs local-mongodb | grep -i slow
```

## Troubleshooting

### Connection Issues
- Verify MongoDB container is running: `podman ps`
- Check credentials in `backend/.env`
- Ensure port 27017 is not blocked
- Test connection manually:
  ```bash
  podman exec -it local-mongodb mongo -u root -p example --authenticationDatabase admin
  ```

### Data Loss Prevention
- Always backup data before major changes
- The `./mongodb_data` directory contains all persistent data
- Container removal doesn't affect mounted volumes

### Performance Issues
- Monitor memory usage: `podman stats local-mongodb`
- Check disk space in `./mongodb_data`
- Consider increasing container resources if needed

## Next Steps

With MongoDB configured, you can now run the full application. The database will automatically create collections and indexes as needed when the backend starts.
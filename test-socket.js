const { io } = require('socket.io-client');

const socket = io('http://localhost:6000', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);

  // Join a chat
  socket.emit('join-chat', 'test-chat', 'test_user_awesome');
  console.log('📝 Joined chat: test-chat');

  // Send a test message
  setTimeout(() => {
    socket.emit('send-message', {
      chatId: 'test-chat',
      userId: 'test_user_awesome',
      message: 'Hello from socket test!'
    });
    console.log('📤 Sent test message');
  }, 1000);
});

socket.on('message', (data) => {
  console.log('📨 Received message:', data);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from server');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('👋 Shutting down...');
  socket.disconnect();
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 10000);
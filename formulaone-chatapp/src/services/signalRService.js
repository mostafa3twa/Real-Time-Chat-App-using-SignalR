import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.currentUser = null;
    this.currentRoom = 'General';
  }

  // Initialize connection to SignalR hub
  async connectToHub(username, chatRoom = 'General') {
    try {
      // Create connection to your ASP.NET SignalR hub
      this.connection = new HubConnectionBuilder()
        .withUrl('http://localhost:5205/chathub') // Your backend URL
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event listeners before starting connection
      this.setupEventListeners();

      // Start the connection
      await this.connection.start();
      this.isConnected = true;
      this.currentUser = username;
      this.currentRoom = chatRoom;

      console.log('Connected to SignalR hub');

      // Join specific chat room (matches your backend JoinSpecificChatRoom method)
      await this.joinSpecificChatRoom({ Username: username, ChatRoom: chatRoom });

     
      return true;

    } catch (error) {
      console.error('Error connecting to SignalR hub:', error);
      this.isConnected = false;
      return false;
    }
    

  }

  // Set up event listeners for receiving messages
  setupEventListeners() {
    if (!this.connection) return;

    // Listen for general messages (admin notifications)
    this.connection.on('ReceiveMessage', (user, message) => {
      console.log('Received message:', { user, message });
      // This will be handled by the component that calls this service
      if (this.onMessageReceived) {
        this.onMessageReceived({ user, message, timestamp: new Date() });
      }
    });

    // Listen for specific chat room messages (matches your backend SendMessage method)
    this.connection.on('ReceiveSpecificMessage', (user, message) => {
      console.log('Received specific message:', { user, message });
      if (this.onMessageReceived) {
        this.onMessageReceived({ user, message, timestamp: new Date() });
      }
    });

    // Handle connection closed
    this.connection.onclose((error) => {
      console.log('Connection closed:', error);
      this.isConnected = false;
      if (this.onConnectionClosed) {
        this.onConnectionClosed();
      }
    });
  }

  // Join specific chat room (matches your backend method)
  async joinSpecificChatRoom(userConnection) {
    if (!this.connection || !this.isConnected) {
      console.error('Not connected to hub');
      return false;
    }

    try {
      await this.connection.invoke('JoinSpecificChatRoom', userConnection);
      return true;
    } catch (error) {
      console.error('Error joining chat room:', error);
      return false;
    }
  }

  async leaveSpecificChatRoom(userConnection) {
    if (!this.connection || !this.isConnected) {
      console.error('Not connected to hub');
      return false;
    }

    try {
      await this.connection.invoke("LeaveSpecificChatRoom", userConnection);
      return true;
    } catch (error) {
      console.error("Error leaving specific chat room:", error);
      return false;
    }
  }

  // Send message (matches your backend SendMessage method)
  async sendMessage(message) {
    if (!this.connection || !this.isConnected) {
      console.error('Not connected to hub');
      return false;
    }

    try {
      await this.connection.invoke('SendMessage', message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Disconnect from hub
  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.isConnected = false;
        this.currentUser = null;
        console.log('Disconnected from SignalR hub');
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    }
  }

  // Set callback for when messages are received
  setOnMessageReceived(callback) {
    this.onMessageReceived = callback;
  }

  // Set callback for when connection is closed
  setOnConnectionClosed(callback) {
    this.onConnectionClosed = callback;
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      currentUser: this.currentUser,
      currentRoom: this.currentRoom
    };
  }
}

// Export singleton instance
const signalRService = new SignalRService();
export default signalRService;

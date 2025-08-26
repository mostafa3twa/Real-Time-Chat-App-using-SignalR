using FormulaOne.ChatService.DataService;
using FormulaOne.ChatService.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.ObjectPool;


namespace FormulaOne.ChatService.Hubs
{

    public class ChatHub : Hub
    {
        private readonly SharedDb _SharedDb;
        public ChatHub(SharedDb sharedDb) => _SharedDb = sharedDb;
        public async Task JoinChat(UserConnection userConnection)
        {
            await Clients.All.
            SendAsync("ReceiveMessage", "admin", $"{userConnection.Username} has joined the chat");
        }
        public async Task JoinSpecificChatRoom(UserConnection userConnection)
        {
            var userid =Context.ConnectionId;
             var roomname =userConnection.ChatRoom;
            await Groups.AddToGroupAsync(userid, roomname);
            _SharedDb.Connections[userid] = userConnection;
            await Clients.Group(roomname).SendAsync("ReceiveMessage", "admin", $"{userConnection.Username} has joined the chat");
        }
        public async Task LeaveSpecificChatRoom(UserConnection userConnection)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userConnection.ChatRoom);
            
            if (_SharedDb.Connections.TryRemove(Context.ConnectionId, out UserConnection removedConnection))
            {
            // Send a message to all users in the chat room that the user has joined
                Console.WriteLine($"{removedConnection.Username} left the chat");
            }
            await Clients.Group(userConnection.ChatRoom)
                .SendAsync("ReceiveMessage", "admin", $"{userConnection.Username} has left the chat");
        }

        public async Task SendMessage(string message)
        {
            if (_SharedDb.Connections.TryGetValue(Context.ConnectionId, out UserConnection userConnection))
            {
                await Clients.Group(userConnection.ChatRoom).SendAsync("ReceiveSpecificMessage", userConnection.Username, message);
            }
        }
    }
    
}
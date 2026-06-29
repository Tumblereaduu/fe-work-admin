# Chat UI Implementation Guide

## Quick Start

### 1. Import the Chat Component
```jsx
import Chat from "./pages/chat";

// In your router
<Route path="/chat" element={<Chat />} />
```

### 2. Ensure Socket.IO is Configured
```javascript
// src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5001", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

export default socket;
```

### 3. User Authentication
The chat expects user data in localStorage:
```javascript
localStorage.setItem("user", JSON.stringify({
  id: userId,
  name: userName,
  email: userEmail
}));
```

## Backend Integration

### Required API Endpoints

#### GET /chat/groups
Returns list of groups for the current user.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "group_name": "Engineering Team",
      "description": "Team discussions",
      "created_at": "2024-01-01T00:00:00Z",
      "last_message": "See you tomorrow!"
    }
  ]
}
```

#### GET /chat/messages/:groupId
Returns message history for a group.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "group_id": 1,
      "sender_id": 123,
      "name": "John Doe",
      "message": "Hello everyone!",
      "created_at": "2024-01-01T10:00:00Z",
      "seen": true
    }
  ]
}
```

### Required Socket.IO Events

#### Server → Client

**receiveMessage**
```javascript
socket.on("receiveMessage", (message) => {
  // message: { id, group_id, sender_id, name, message, created_at, seen }
});
```

**typing**
```javascript
socket.on("typing", (data) => {
  // data: { user_id, user_name, group_id }
});
```

**userOnline**
```javascript
socket.on("userOnline", (data) => {
  // data: { user_id, user_name }
});
```

**userOffline**
```javascript
socket.on("userOffline", (data) => {
  // data: { user_id }
});
```

#### Client → Server

**joinGroup**
```javascript
socket.emit("joinGroup", groupId);
```

**sendMessage**
```javascript
socket.emit("sendMessage", {
  group_id: groupId,
  sender_id: userId,
  message: messageText
});
```

**typing**
```javascript
socket.emit("typing", {
  group_id: groupId,
  user_id: userId,
  user_name: userName
});
```

## Component Usage Examples

### Using ChatLayout Directly
```jsx
import ChatLayout from "./components/chat/ChatLayout";

export default function ChatPage() {
  return <ChatLayout />;
}
```

### Customizing Individual Components
```jsx
import Sidebar from "./components/chat/Sidebar";
import ChatHeader from "./components/chat/ChatHeader";
import MessageList from "./components/chat/MessageList";
import MessageInput from "./components/chat/MessageInput";

export default function CustomChat() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);

  return (
    <div className="flex gap-4">
      <Sidebar
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
        loading={false}
        searchQuery=""
        onSearchChange={() => {}}
        unreadCounts={{}}
      />
      <div className="flex-1 flex flex-col">
        {selectedGroup && (
          <>
            <ChatHeader group={selectedGroup} onlineCount={5} />
            <MessageList
              messages={messages}
              currentUserId={1}
              typingUsers={{}}
            />
            <MessageInput
              onSendMessage={(msg) => console.log(msg)}
              onTyping={() => {}}
            />
          </>
        )}
      </div>
    </div>
  );
}
```

## Styling Customization

### Change Theme Colors
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: "#f0f9ff",
        600: "#0284c7",
        700: "#0369a1",
      }
    }
  }
}
```

Then update component classes:
```jsx
// From: bg-blue-600
// To: bg-primary-600
```

### Adjust Spacing
```jsx
// Sidebar width
<div className="w-[320px]"> {/* Change to w-[400px] */}

// Message padding
<div className="p-6"> {/* Change to p-4 or p-8 */}
```

### Modify Animations
```jsx
// In MessageList.jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Increase for slower animation
    },
  },
};
```

## Advanced Features

### Adding Message Reactions
```jsx
// In MessageBubble.jsx
const [showReactions, setShowReactions] = useState(false);

return (
  <div onHoverStart={() => setShowReactions(true)}>
    {/* Message content */}
    {showReactions && (
      <div className="flex gap-1 mt-2">
        <button>👍</button>
        <button>❤️</button>
        <button>😂</button>
      </div>
    )}
  </div>
);
```

### Adding Message Search
```jsx
// In ChatLayout.jsx
const [searchMessages, setSearchMessages] = useState("");

const filteredMessages = messages.filter(msg =>
  msg.message.toLowerCase().includes(searchMessages.toLowerCase())
);
```

### Adding User Mentions
```jsx
// In MessageInput.jsx
const handleMention = (userName) => {
  setMessage(prev => prev + `@${userName} `);
};
```

### Adding Message Pinning
```jsx
// In MessageBubble.jsx
const [isPinned, setIsPinned] = useState(false);

const handlePin = () => {
  socket.emit("pinMessage", { messageId: message.id });
  setIsPinned(true);
};
```

## Performance Tips

### 1. Virtualize Long Message Lists
```jsx
import { FixedSizeList } from "react-window";

// Wrap MessageList with virtualization for 1000+ messages
```

### 2. Debounce Typing Events
```jsx
const typingTimeoutRef = useRef(null);

const handleTyping = () => {
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }
  socket.emit("typing", data);
  typingTimeoutRef.current = setTimeout(() => {
    // Typing stopped
  }, 1000);
};
```

### 3. Memoize Components
```jsx
import { memo } from "react";

const MessageBubble = memo(({ message, isOwn }) => {
  // Component code
});

export default MessageBubble;
```

### 4. Use useCallback for Event Handlers
```jsx
const handleSendMessage = useCallback((msg) => {
  socket.emit("sendMessage", msg);
}, []);
```

## Error Handling

### Handle Network Errors
```jsx
useEffect(() => {
  socket.on("connect_error", (error) => {
    toast.error("Connection failed: " + error.message);
  });

  socket.on("disconnect", () => {
    toast.error("Disconnected from server");
  });

  return () => {
    socket.off("connect_error");
    socket.off("disconnect");
  };
}, []);
```

### Handle API Errors
```jsx
const fetchGroups = async () => {
  try {
    const response = await api.get("/chat/groups");
    setGroups(response.data.data || []);
  } catch (error) {
    if (error.response?.status === 401) {
      toast.error("Please log in again");
      // Redirect to login
    } else {
      toast.error("Failed to load groups");
    }
  }
};
```

## Testing

### Unit Test Example
```jsx
import { render, screen } from "@testing-library/react";
import MessageBubble from "./MessageBubble";

describe("MessageBubble", () => {
  it("renders message text", () => {
    const message = {
      id: 1,
      message: "Hello",
      created_at: new Date().toISOString(),
    };

    render(<MessageBubble message={message} isOwn={true} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Integration Test Example
```jsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatLayout from "./ChatLayout";

describe("ChatLayout", () => {
  it("sends message on enter key", async () => {
    render(<ChatLayout />);
    
    const input = screen.getByPlaceholderText(/Type your message/);
    await userEvent.type(input, "Hello{Enter}");
    
    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });
});
```

## Deployment Checklist

- [ ] Update Socket.IO server URL for production
- [ ] Enable HTTPS for Socket.IO connection
- [ ] Add CORS configuration for production domain
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Configure CDN for static assets
- [ ] Add rate limiting for API endpoints
- [ ] Enable message encryption
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
- [ ] Test on production environment

## Common Issues & Solutions

### Issue: Messages not appearing
**Solution**: Check Socket.IO connection and verify backend is emitting events correctly.

### Issue: Typing indicator stuck
**Solution**: Ensure typing timeout is set and events are being cleared properly.

### Issue: Slow performance with many messages
**Solution**: Implement message virtualization or pagination.

### Issue: Unread badges not updating
**Solution**: Verify unread count state is being updated when messages arrive.

### Issue: Animations stuttering
**Solution**: Check GPU acceleration is enabled and reduce animation complexity.

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Socket.IO Docs](https://socket.io/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev/)
- [React Icons](https://react-icons.github.io/react-icons/)

---

**Last Updated**: May 2026

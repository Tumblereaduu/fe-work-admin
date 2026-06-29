# Chat UI - Quick Reference Guide

## 🚀 Quick Start

### 1. Run Development Server
```bash
npm run dev
```

### 2. Build for Production
```bash
npm run build
```

### 3. Preview Production Build
```bash
npm run preview
```

## 📁 File Structure

```
src/
├── pages/
│   └── chat.jsx                    # Main chat page (simplified)
├── components/chat/
│   ├── ChatLayout.jsx              # Main container
│   ├── Sidebar.jsx                 # Groups list
│   ├── ChatHeader.jsx              # Header
│   ├── MessageList.jsx             # Messages
│   ├── MessageBubble.jsx           # Message bubble
│   ├── MessageInput.jsx            # Input area
│   ├── TypingIndicator.jsx         # Typing animation
│   └── RightSidebar.jsx            # Group info
├── api/
│   └── axios.js                    # API client
└── socket.js                       # Socket.IO config
```

## 🎨 Component Props

### ChatLayout
```jsx
// No props - manages all state internally
<ChatLayout />
```

### Sidebar
```jsx
<Sidebar
  groups={groups}                    // Array of group objects
  selectedGroup={selectedGroup}      // Current selected group
  onSelectGroup={handleSelectGroup}  // Callback on group select
  loading={loading}                  // Loading state
  searchQuery={searchQuery}          // Search input value
  onSearchChange={setSearchQuery}    // Search callback
  unreadCounts={unreadCounts}        // Object with unread counts
/>
```

### ChatHeader
```jsx
<ChatHeader
  group={selectedGroup}              // Current group object
  onlineCount={5}                    // Number of online users
/>
```

### MessageList
```jsx
<MessageList
  messages={messages}                // Array of message objects
  currentUserId={user.id}            // Current user ID
  typingUsers={typingUsers}          // Object of typing users
/>
```

### MessageBubble
```jsx
<MessageBubble
  message={message}                  // Message object
  isOwn={isOwn}                      // Boolean - is own message
/>
```

### MessageInput
```jsx
<MessageInput
  onSendMessage={handleSendMessage}  // Callback with message text
  onTyping={handleTyping}            // Callback on typing
/>
```

### TypingIndicator
```jsx
<TypingIndicator
  typingUsers={typingUsers}          // Object of typing users
/>
```

### RightSidebar
```jsx
<RightSidebar
  group={selectedGroup}              // Current group object
  onlineUsers={onlineUsers}          // Object of online users
/>
```

## 🔌 Socket.IO Events

### Emit (Client → Server)
```javascript
// Join a group
socket.emit("joinGroup", groupId);

// Send message
socket.emit("sendMessage", {
  group_id: groupId,
  sender_id: userId,
  message: messageText
});

// Typing indicator
socket.emit("typing", {
  group_id: groupId,
  user_id: userId,
  user_name: userName
});
```

### Listen (Server → Client)
```javascript
// Receive message
socket.on("receiveMessage", (message) => {
  // message: { id, group_id, sender_id, name, message, created_at, seen }
});

// User typing
socket.on("typing", (data) => {
  // data: { user_id, user_name, group_id }
});

// User online
socket.on("userOnline", (data) => {
  // data: { user_id, user_name }
});

// User offline
socket.on("userOffline", (data) => {
  // data: { user_id }
});
```

## 🎯 API Endpoints

### GET /chat/groups
```javascript
// Response
{
  data: [
    {
      id: 1,
      group_name: "Engineering",
      description: "Team discussions",
      created_at: "2024-01-01T00:00:00Z",
      last_message: "See you tomorrow!"
    }
  ]
}
```

### GET /chat/messages/:groupId
```javascript
// Response
{
  data: [
    {
      id: 1,
      group_id: 1,
      sender_id: 123,
      name: "John Doe",
      message: "Hello!",
      created_at: "2024-01-01T10:00:00Z",
      seen: true
    }
  ]
}
```

## 🎨 Tailwind Classes

### Common Classes Used
```jsx
// Backgrounds
bg-slate-900/80          // Semi-transparent slate
bg-gradient-to-br        // Gradient background
from-blue-600 to-blue-700

// Borders
border border-slate-800/50

// Text
text-white text-slate-400

// Spacing
p-6 px-4 py-3

// Rounded
rounded-2xl rounded-xl rounded-lg

// Shadows
shadow-xl shadow-lg shadow-md

// Animations
animate-spin animate-pulse

// Responsive
w-[320px] flex-1

// Backdrop
backdrop-blur-xl
```

## 🔧 Customization

### Change Primary Color
```jsx
// Find all instances of:
from-blue-600 to-blue-700

// Replace with your color:
from-purple-600 to-purple-700
```

### Change Sidebar Width
```jsx
// In Sidebar.jsx
<div className="w-[320px]">  // Change to w-[400px]
```

### Change Animation Speed
```jsx
// In components with Framer Motion
transition={{ duration: 0.2 }}  // Change duration
staggerChildren: 0.05           // Change stagger
```

### Change Message Max Width
```jsx
// In MessageList.jsx
max-w-[75%]  // Change to max-w-[60%] or max-w-[80%]
```

## 🐛 Debugging

### Check Socket Connection
```javascript
// In browser console
socket.connected  // true/false
socket.id         // Socket ID
```

### Check User Data
```javascript
// In browser console
JSON.parse(localStorage.getItem("user"))
```

### Check Messages
```javascript
// In React DevTools
// Look for messages state in ChatLayout
```

### Check Typing Users
```javascript
// In React DevTools
// Look for typingUsers state in ChatLayout
```

## 📱 Responsive Breakpoints

```tailwindcss
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

## 🎬 Animation Classes

```css
animate-spin          /* Spinning animation */
animate-pulse         /* Pulsing animation */
animate-pulse-slow    /* Custom slow pulse */
animate-bounce-slow   /* Custom slow bounce */
```

## 🎨 Color Palette

```
Primary Blue:
  from-blue-600 to-blue-700
  hover: from-blue-500 to-blue-600

Background:
  slate-900/80
  slate-800/50
  slate-700/30

Text:
  text-white (primary)
  text-slate-400 (secondary)
  text-slate-500 (tertiary)

Accents:
  Green: text-green-400 (online)
  Red: text-red-400 (error)
```

## 🔐 Security Checklist

- [ ] Validate user input
- [ ] Sanitize message content
- [ ] Use HTTPS for Socket.IO
- [ ] Implement rate limiting
- [ ] Add CORS configuration
- [ ] Encrypt sensitive data
- [ ] Use secure storage for tokens

## 📊 Performance Tips

1. **Virtualize long lists** - Use react-window for 1000+ messages
2. **Debounce typing** - Already implemented (1s timeout)
3. **Memoize components** - Use React.memo for MessageBubble
4. **Lazy load images** - Use lazy loading for avatars
5. **Code split** - Split chat into separate bundle

## 🧪 Testing Commands

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Documentation Files

- `CHAT_UI_UPGRADE.md` - Complete feature overview
- `CHAT_IMPLEMENTATION_GUIDE.md` - Backend integration
- `UPGRADE_SUMMARY.md` - What was changed
- `BEFORE_AFTER_COMPARISON.md` - Before/after comparison
- `QUICK_REFERENCE.md` - This file

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| Messages not appearing | Check Socket.IO connection |
| Typing indicator stuck | Verify typing timeout |
| Unread badges wrong | Check unread count state |
| Animations stuttering | Enable GPU acceleration |
| Search not working | Check searchQuery state |
| Styles not applying | Clear cache, rebuild |

## 🚀 Deployment

```bash
# Build for production
npm run build

# Output in dist/ folder
# Deploy dist/ to your server
```

## 📞 Support Resources

- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Socket.IO](https://socket.io/)
- [React Icons](https://react-icons.github.io/react-icons/)

## ✅ Checklist Before Deploy

- [ ] Build succeeds: `npm run build`
- [ ] No console errors
- [ ] Socket.IO connects
- [ ] Messages send/receive
- [ ] Typing indicator works
- [ ] Online status updates
- [ ] Unread badges work
- [ ] Search works
- [ ] Responsive on mobile
- [ ] Animations smooth

## 🎯 Next Steps

1. Test locally: `npm run dev`
2. Verify Socket.IO connection
3. Test all features
4. Customize colors/spacing
5. Deploy to production

---

**Quick Links:**
- [Full Documentation](./CHAT_UI_UPGRADE.md)
- [Implementation Guide](./CHAT_IMPLEMENTATION_GUIDE.md)
- [Before/After](./BEFORE_AFTER_COMPARISON.md)

**Version**: 1.0.0  
**Status**: ✅ Production Ready

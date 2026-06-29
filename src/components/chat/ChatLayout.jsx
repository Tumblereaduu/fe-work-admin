import { useEffect, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import api from "../../api/axios";
import socket from "../../socket";
import Sidebar from "./Sidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import RightSidebar from "./RightSidebar";
import CreateGroupModal from "./CreateGroupModal";
import AddMembersModal from "./AddMembersModal";
import toast from "react-hot-toast";

const ChatLayout = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const membersNameById = useMemo(() => {
    const map = {};
    for (const member of members || []) {
      if (member?.id != null) {
        map[member.id] = member?.name;
      }
    }
    return map;
  }, [members]);

  const hasMessageContent = (msg) => {
    return (
      msg?.message?.trim() ||
      msg?.file_url ||
      ((msg?.message_type === "image" ||
        msg?.message_type === "document" ||
        msg?.message_type === "voice") &&
        msg?.file_url)
    );
  };

  const getSenderName = (msg) => {
    return (
      msg?.sender_name ||
      msg?.name ||
      msg?.username ||
      msg?.user_name ||
      membersNameById?.[msg?.sender_id] ||
      (msg?.sender_id === user?.id ? user?.name : undefined) ||
      "Unknown"
    );
  };

  const normalizeMessage = (msg) => {
    if (!msg || typeof msg !== "object") return msg;
    const sender_name = getSenderName(msg);
    return { ...msg, sender_name };
  };

  // FETCH GROUPS
  const fetchGroups = async () => {
    try {
      setLoading(true);
      console.log("Fetching groups...");
      const response = await api.get("/chat/groups");
      console.log("Groups response:", response.data);
      
      // Handle both response formats
      const groupsData = response.data.data || response.data.groups || [];
      setGroups(groupsData);
      
      if (groupsData.length === 0) {
        console.warn("No groups returned from API");
      }
    } catch (error) {
      console.error("Error fetching groups:", error.response?.data || error.message);
      toast.error("Failed to load groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // FETCH MESSAGES
  const fetchMessages = async (groupId) => {
    try {
      const response = await api.get(`/chat/messages/${groupId}`);
      const fetched = response.data.data || [];
      setMessages((Array.isArray(fetched) ? fetched : []).map(normalizeMessage));
      // Clear unread count for this group
      setUnreadCounts((prev) => ({
        ...prev,
        [groupId]: 0,
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  // FETCH GROUP MEMBERS
  const fetchGroupMembers = async (groupId) => {
    try {
      setMembersLoading(true);
      console.log("🔍 Fetching members for group:", groupId);
      
      const response = await api.get(`/chat/group-members/${groupId}`);
      console.log("✅ Members API Response:", response.data);
      console.log("📊 Response structure:", {
        success: response.data?.success,
        membersCount: response.data?.members?.length,
        members: response.data?.members
      });
      
      if (response.data?.success && response.data?.members) {
        console.log("✅ Setting members state with:", response.data.members);
        setMembers(response.data.members);
      } else if (Array.isArray(response.data?.members)) {
        console.log("✅ Setting members from array:", response.data.members);
        setMembers(response.data.members);
      } else {
        console.warn("⚠️ No members in response, setting empty array");
        setMembers([]);
      }
    } catch (error) {
      console.error("❌ Error fetching members:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  // FETCH ALL USERS FOR ADD MEMBERS MODAL
  const fetchAllUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get("/admin/users");
      console.log("Users response:", response.data);
      
      if (response.data?.success) {
        setAllUsers(response.data.data || response.data.users || []);
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error.response?.data || error.message);
      setAllUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // FETCH GROUPS ON MOUNT
  useEffect(() => {
    fetchGroups();
  }, []);

  // FETCH MEMBERS WHEN GROUP CHANGES
  useEffect(() => {
    console.log("📌 useEffect triggered - selectedGroup:", selectedGroup);
    if (selectedGroup?.id) {
      console.log("🔄 Fetching members for group ID:", selectedGroup.id);
      fetchGroupMembers(selectedGroup.id);
      fetchAllUsers();
    } else {
      console.log("⚠️ No selectedGroup.id, skipping fetch");
    }
  }, [selectedGroup?.id]);

  // DEBUG: Log members state changes
  useEffect(() => {
    console.log("📊 Members state updated:", {
      count: members.length,
      loading: membersLoading,
      members: members
    });
  }, [members, membersLoading]);

  // SELECT GROUP
  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    setMessages([]);
    setTypingUsers({});
    socket.emit("joinGroup", group.id);
    await fetchMessages(group.id);
  };

  // SEND MESSAGE
  const handleSendMessage = (messageText) => {
    if (!messageText?.trim() || !selectedGroup?.id) {
      return;
    }

    const messageData = {
      group_id: selectedGroup.id,
      sender_id: user?.id,
      sender_name: user?.name,
      message: messageText.trim(),
      message_type: "text",
    };

    socket.emit("sendMessage", messageData);
  };

  // SEND ATTACHMENT
  const handleSendAttachment = async (file, caption) => {
    try {
      if (!selectedGroup?.id) {
        toast.error("Please select a group");
        return { success: false };
      }

      console.log("Sending attachment...");
      const formData = new FormData();
      formData.append("group_id", selectedGroup.id);
      formData.append("message", caption || "");
      formData.append("file", file);

      // Detect file type
      let messageType = "document";
      if (file.type.startsWith("image/")) {
        messageType = "image";
      }
      formData.append("message_type", messageType);

      const response = await api.post("/chat/send-attachment", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        const newMessage =
          response.data.data || response.data.messageData || response.data.message;
        const normalized = normalizeMessage(newMessage);

        if (normalized && hasMessageContent(normalized)) {
          setMessages((prev) => {
            const exists = prev.some((m) => m?.id && m.id === normalized?.id);
            if (exists) return prev;
            return [...prev, normalized];
          });
        }

        toast.success("Attachment sent!");
        return { success: true, message: normalized };
      } else {
        toast.error(response.data?.message || "Failed to send attachment");
        return { success: false };
      }
    } catch (error) {
      console.error("Error sending attachment:", error);
      toast.error(error.response?.data?.message || "Failed to send attachment");
      return { success: false };
    }
  };

  // SEND VOICE NOTE
  const handleSendVoice = async (audioBlob) => {
    try {
      if (!selectedGroup?.id) {
        toast.error("Please select a group");
        return { success: false };
      }

      console.log("Sending voice note...");
      const formData = new FormData();
      formData.append("group_id", selectedGroup.id);
      formData.append("voice", audioBlob, "voice-note.webm");

      const response = await api.post("/chat/send-voice", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        const newMessage =
          response.data.data || response.data.messageData || response.data.message;
        const normalized = normalizeMessage(newMessage);

        if (normalized && hasMessageContent(normalized)) {
          setMessages((prev) => {
            const exists = prev.some((m) => m?.id && m.id === normalized?.id);
            if (exists) return prev;
            return [...prev, normalized];
          });
        }

        toast.success("Voice note sent!");
        return { success: true, message: normalized };
      } else {
        toast.error(response.data?.message || "Failed to send voice note");
        return { success: false };
      }
    } catch (error) {
      console.error("Error sending voice note:", error);
      toast.error(error.response?.data?.message || "Failed to send voice note");
      return { success: false };
    }
  };

  // HANDLE GROUP CREATED
  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
    setSelectedGroup(newGroup);
    setMessages([]);
    setMembers([]);
    socket.emit("joinGroup", newGroup.id);
    toast.success("Group created successfully!");
  };

  // HANDLE MEMBERS ADDED
  const handleMembersAdded = (updatedMembers) => {
    setMembers(updatedMembers);
    toast.success("Members added successfully!");
  };

  // ADD MEMBERS TO GROUP
  const handleAddMembers = async () => {
    try {
      if (!selectedGroup?.id || selectedUsers.length === 0) {
        toast.error("Select at least one member");
        return;
      }

      const response = await api.post("/chat/add-members", {
        group_id: selectedGroup.id,
        members: selectedUsers,
      });

      console.log("Add members response:", response.data);

      if (response.data?.success) {
        toast.success("Members added successfully!");
        setIsAddMembersModalOpen(false);
        setSelectedUsers([]);
        await fetchGroupMembers(selectedGroup.id);
      } else {
        toast.error(response.data?.message || "Failed to add members");
      }
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error(error.response?.data?.message || "Failed to add members");
    }
  };

  // REMOVE MEMBER FROM GROUP
  const handleRemoveMember = async (userId) => {
    try {
      if (!selectedGroup?.id || !userId) {
        toast.error("Invalid request");
        return;
      }

      const response = await api.delete("/chat/remove-member", {
        data: {
          group_id: selectedGroup.id,
          user_id: userId,
        },
      });

      console.log("Remove member response:", response.data);

      if (response.data?.success) {
        toast.success("Member removed successfully!");
        await fetchGroupMembers(selectedGroup.id);
      } else {
        toast.error(response.data?.message || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  // HANDLE TYPING
  const handleTyping = () => {
    if (selectedGroup?.id && user?.id) {
      socket.emit("typing", {
        group_id: selectedGroup.id,
        user_id: user.id,
        user_name: user.name || "User",
      });
    }
  };

  // SOCKET EVENT LISTENERS
  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      if (selectedGroup) {
        socket.emit("joinGroup", selectedGroup.id);
      }
    });

    // Listen for new group creation
    const handleGroupCreatedEvent = (newGroup) => {
      console.log("New group created:", newGroup);
      setGroups((prev) => [newGroup, ...prev]);
      toast.success(`New group "${newGroup?.group_name}" created!`);
    };

    // Listen for members updated
    const handleMembersUpdatedEvent = (data) => {
      console.log("🔔 Socket: membersUpdated event received:", data);
      if (data?.group_id === selectedGroup?.id) {
        console.log("✅ Members updated for current group, refreshing...");
        fetchGroupMembers(selectedGroup.id);
      } else {
        console.log("⚠️ Members updated for different group, ignoring");
      }
    };

    socket.on("groupCreated", handleGroupCreatedEvent);
    socket.on("membersUpdated", handleMembersUpdatedEvent);

    const handleReceiveMessage = (newMessage) => {
      const fixedMessage = normalizeMessage(newMessage);
      if (!hasMessageContent(fixedMessage)) return;

      setMessages((prev) => {
        const exists = prev.some((m) => m?.id === fixedMessage?.id);
        if (exists) return prev;
        return [...prev, fixedMessage];
      });

      // Increment unread if not in current group
      if (newMessage?.group_id && newMessage?.group_id !== selectedGroup?.id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [newMessage.group_id]: (prev[newMessage.group_id] || 0) + 1,
        }));
      }
    };

    const handleTyping = (data) => {
      if (data?.user_id && data?.user_id !== user?.id) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.user_id]: data.user_name || "User",
        }));

        setTimeout(() => {
          setTypingUsers((prev) => {
            const updated = { ...prev };
            delete updated[data.user_id];
            return updated;
          });
        }, 3000);
      }
    };

    const handleUserOnline = (data) => {
      if (data?.user_id) {
        setOnlineUsers((prev) => ({
          ...prev,
          [data.user_id]: true,
        }));
      }
    };

    const handleUserOffline = (data) => {
      if (data?.user_id) {
        setOnlineUsers((prev) => {
          const updated = { ...prev };
          delete updated[data.user_id];
          return updated;
        });
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userTyping", handleTyping);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("connect");
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userTyping", handleTyping);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
      socket.off("groupCreated", handleGroupCreatedEvent);
      socket.off("membersUpdated", handleMembersUpdatedEvent);
    };
  }, [selectedGroup, user.id, user?.name, membersNameById]);

  // FILTER GROUPS
  const filteredGroups = groups.filter((group) =>
    (group?.group_name || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-120px)] flex gap-3 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3">
      {/* LEFT SIDEBAR */}
      <Sidebar
        groups={filteredGroups}
        selectedGroup={selectedGroup}
        onSelectGroup={handleSelectGroup}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        unreadCounts={unreadCounts}
        onCreateGroupClick={() => setIsCreateGroupModalOpen(true)}
      />

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        {selectedGroup ? (
          <>
            <ChatHeader
              group={selectedGroup}
              onlineCount={Object.keys(onlineUsers).length}
            />
            <MessageList
              messages={messages}
              currentUserId={user.id}
              currentUserName={user?.name}
              userMap={membersNameById}
              typingUsers={typingUsers}
            />
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onSendAttachment={handleSendAttachment}
              onSendVoice={handleSendVoice}
              selectedGroup={selectedGroup}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-6">
            <div className="w-24 h-24 bg-slate-800/40 rounded-full flex items-center justify-center shadow-inner">
              <FiSearch className="text-5xl text-slate-600" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-300 mb-2">
                Welcome to Team Chat
              </h2>
              <p className="text-slate-500">
                Select a group from the sidebar to start collaborating.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - GROUP INFO */}
      {selectedGroup && (
        <RightSidebar 
          group={selectedGroup} 
          onlineUsers={onlineUsers}
          members={members}
          membersLoading={membersLoading}
          onAddMembersClick={() => setIsAddMembersModalOpen(true)}
          currentUserId={user?.id}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {/* CREATE GROUP MODAL */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      {/* ADD MEMBERS MODAL */}
      <AddMembersModal
        isOpen={isAddMembersModalOpen}
        onClose={() => setIsAddMembersModalOpen(false)}
        groupId={selectedGroup?.id}
        currentMembers={members}
        onMembersAdded={handleAddMembers}
        allUsers={allUsers}
      />
    </div>
  );
};

export default ChatLayout;

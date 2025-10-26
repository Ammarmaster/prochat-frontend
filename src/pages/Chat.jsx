import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ProChat = () => {
  const [currentView, setCurrentView] = useState("chats");
  const [selectedUser, setSelectedUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chats, setChats] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  // ✅ Utility: Auto-hide alerts after 3s
  useEffect(() => {
    if (message || error) {
      const t = setTimeout(() => {
        setMessage("");
        setError("");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [message, error]);

  const VerifiedBadge = ({ size = 16 }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className="inline-block align-middle ml-1"
      width={size}
      height={size}
    >
      <path
        fill="#0099FF"
        d="M256 32c123.7 0 224 100.3 224 224S379.7 480 256 480 32 379.7 32 256 132.3 32 256 32z"
      />
      <path
        fill="#fff"
        d="M374.6 166.6 229.3 311.9l-74-74-45.3 45.2 119.3 119.3L420 211.9z"
      />
    </svg>
  );

  const getDisplayName = (user) => {
    if (!user?.name) return "Unknown User";
    const verified = user.name?.trim().toLowerCase() === "prodevopz";
    return (
      <span className="flex items-center">
        {user.name}
        {verified && <VerifiedBadge />}
      </span>
    );
  };

  const checkAuth = async () => {
    try {
      const res = await axios.get("https://prochat-api.onrender.com/api/auth/user");
      setCurrentUser(res.data.user);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const verify = async () => {
      const ok = await checkAuth();
      if (!ok) navigate("/login");
      else loadFriends();
    };
    verify();
  }, [navigate]);

  const loadFriends = async () => {
    try {
      const res = await axios.get("https://prochat-api.onrender.com/api/auth/user/friends");
      setFriends(res.data.friends || []);
    } catch {
      setError("Failed to load friends");
    }
  };

  // 🔍 Instant Search
  useEffect(() => {
    const fetchUsers = async () => {
      const q = searchQuery.trim();
      if (!q) return setSearchResults([]);
      try {
        const res = await axios.get(
          `https://prochat-api.onrender.com/api/auth/search?query=${encodeURIComponent(q)}`
        );
        const found = res.data.users || [];
        const filtered = found.filter(
          (u) => !friends.some((f) => f.userId === u.userId)
        );
        setSearchResults(filtered);
      } catch {
        setSearchResults([]);
      }
    };
    fetchUsers();
  }, [searchQuery, friends]);

  // ➕ ADD FRIEND
  const addFriend = async (user) => {
    try {
      await axios.post("https://prochat-api.onrender.com/api/auth/user/add-friend", {
        userId: user.userId,
      });
      setMessage(`Added ${user.name} as a friend`);
      setSearchQuery("");
      setSearchResults([]);
      loadFriends(); // 🔁 Refresh list
    } catch {
      setError("Failed to add friend");
    }
  };

  // ❌ REMOVE FRIEND
  const removeFriend = async (user) => {
    if (!window.confirm(`Remove ${user.name} from friends?`)) return;
    try {
      await axios.post("https://prochat-api.onrender.com/api/auth/user/remove-friend", {
        userId: user.userId,
      });
      setMessage(`Removed ${user.name} from friends`);
      setFriends((prev) => prev.filter((f) => f.userId !== user.userId));
      if (selectedUser && selectedUser.userId === user.userId) {
        setSelectedUser(null);
        setCurrentView("chats");
      }
    } catch {
      setError("Failed to remove friend");
    }
  };

  // 💬 Messages
  const loadMessages = async (friendId, markAsRead = false) => {
    try {
      const res = await axios.get(
        `https://prochat-api.onrender.com/api/auth/messages/conversation/${friendId}`
      );
      const msgs = res.data.messages.map((m) => ({
        id: m._id,
        text: m.text,
        sender: m.sender === friendId ? "friend" : "me",
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setChats((prev) => ({ ...prev, [friendId]: msgs }));
      if (markAsRead) setUnreadCounts((p) => ({ ...p, [friendId]: 0 }));
    } catch {
      setError("Failed to load messages");
    }
  };

  const startChat = async (user) => {
    setSelectedUser(user);
    setCurrentView("chat");
    await loadMessages(user._id, true);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const tempId = Date.now();
    const msgObj = {
      id: tempId,
      text: newMessage,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChats((prev) => ({
      ...prev,
      [selectedUser._id]: [...(prev[selectedUser._id] || []), msgObj],
    }));
    const msgToSend = newMessage;
    setNewMessage("");
    try {
      await axios.post("https://prochat-api.onrender.com/api/auth/messages/send", {
        recipientId: selectedUser._id,
        text: msgToSend,
      });
      loadMessages(selectedUser._id, true);
    } catch {
      setError("Failed to send message");
    }
  };

  useEffect(() => {
    if (!selectedUser) return;
    const intv = setInterval(() => loadMessages(selectedUser._id), 3000);
    return () => clearInterval(intv);
  }, [selectedUser]);

  const handleLogout = async () => {
    await axios.post("https://prochat-api.onrender.com/api/auth/user/logout");
    navigate("/login");
  };

  const getAvatar = (user) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "")}&background=008069&color=ffffff&bold=true`;

  // =======================
  // 💬 UI STARTS HERE
  // =======================
  return (
    <div className="flex h-screen bg-[#111b21] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className={`${currentView === "chat" ? "hidden md:flex" : "flex"} flex-col w-full md:w-1/3 lg:w-1/4 bg-[#202c33] border-r border-[#303d45]`}>
        {/* Header */}
        <div className="bg-[#202c33] p-4 flex items-center justify-between border-b border-[#303d45]">
          <div className="flex items-center space-x-4">
            {currentUser && (
              <img src={getAvatar(currentUser)} className="w-10 h-10 rounded-full" />
            )}
            <div>
              <h2 className="font-semibold">{currentUser?.name}</h2>
              <p className="text-xs text-[#8696a0]">Online</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-[#aebac1] hover:text-white">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4v18h8v-2H4V5z"/>
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-[#202c33]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full bg-[#2a3942] text-white placeholder-[#8696a0] rounded-lg pl-3 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#00a884]"
          />
        </div>

        {/* Search Results */}
        {searchQuery && searchResults.length > 0 && (
          <div className="overflow-y-auto">
            {searchResults.map((u) => (
              <div key={u._id} className="flex items-center justify-between p-3 hover:bg-[#2a3942] rounded-lg">
                <div className="flex items-center space-x-3">
                  <img src={getAvatar(u)} className="w-10 h-10 rounded-full" />
                  <div>
                    <p>{getDisplayName(u)}</p>
                    <p className="text-xs text-[#8696a0]">ID: {u.userId}</p>
                  </div>
                </div>
                <button
                  onClick={() => addFriend(u)}
                  className="bg-[#00a884] px-3 py-1 rounded-full text-sm hover:bg-[#00b894]"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto bg-[#111b21]">
          {friends.map((user) => (
            <div
              key={user._id}
              onClick={() => startChat(user)}
              className="group flex items-center justify-between p-3 hover:bg-[#2a3942] cursor-pointer border-b border-[#222d34]"
            >
              <div className="flex items-center space-x-3">
                <img src={getAvatar(user)} className="w-12 h-12 rounded-full" />
                <div>
                  <h3 className="font-medium">{getDisplayName(user)}</h3>
                  <p className="text-xs text-[#8696a0]">ID: {user.userId}</p>
                </div>
              </div>
              {/* 🗑️ Remove Friend Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFriend(user);
                }}
                className="hidden group-hover:block text-red-400 hover:text-red-500 transition"
                title="Remove friend"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {/* ... (same as before) ... */}

      {/* Alerts */}
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-[#00a884] text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm text-center">
          {message}
        </div>
      )}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default ProChat;

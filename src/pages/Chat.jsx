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

  // ✅ Blue verified badge
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

  useEffect(() => {
    const fetchUsers = async () => {
      const q = searchQuery.trim();
      if (!q) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await axios.get(
          `https://prochat-api.onrender.com/api/auth/search?query=${encodeURIComponent(q)}`
        );
        const found = res.data.users || (res.data.user ? [res.data.user] : []);
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

  const addFriend = async (user) => {
    try {
      const res = await axios.post(
        "https://prochat-api.onrender.com/api/auth/user/add-friend",
        { userId: user.userId }
      );
      const newFriend = res.data.friend;
      setFriends((prev) => [...prev, newFriend]);
      setSearchQuery("");
      setSearchResults([]);
      setMessage(`Added ${user.name} as a friend.`);
      setChats((prev) => ({ ...prev, [newFriend._id]: [] }));
    } catch {
      setError("Failed to add friend");
    }
  };

  const loadMessages = async (friendId, markAsRead = false) => {
    try {
      const res = await axios.get(
        `https://prochat-api.onrender.com/api/auth/messages/conversation/${friendId}`
      );
      const msgs = res.data.messages.map((m) => ({
        id: m._id,
        text: m.text,
        sender: m.sender === friendId ? "friend" : "me",
        read: m.read,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setChats((prev) => ({ ...prev, [friendId]: msgs }));

      if (!markAsRead) {
        const unread = msgs.filter((m) => m.sender === "friend" && !m.read).length;
        setUnreadCounts((prev) => ({ ...prev, [friendId]: unread }));
      } else {
        setUnreadCounts((prev) => ({ ...prev, [friendId]: 0 }));
      }
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, selectedUser]);

  const handleLogout = async () => {
    await axios.post("https://prochat-api.onrender.com/api/auth/user/logout");
    navigate("/login");
  };

  const getAvatar = (user) => {
    if (!user?.name) return null;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name
    )}&background=008069&color=ffffff&bold=true`;
  };

  return (
    <div className="flex h-screen bg-[#111b21] text-white font-sans overflow-hidden">
      {/* Sidebar - Chats List */}
      <div className={`${currentView === "chat" ? "hidden md:flex" : "flex"} flex-col w-full md:w-1/3 lg:w-1/4 bg-[#202c33] border-r border-[#303d45]`}>
        {/* Sidebar Header */}
        <div className="bg-[#202c33] p-4 flex items-center justify-between border-b border-[#303d45]">
          <div className="flex items-center space-x-4">
            {currentUser && (
              <img
                src={getAvatar(currentUser)}
                alt="Profile"
                className="w-10 h-10 rounded-full cursor-pointer"
              />
            )}
            <div className="flex-1">
              <h2 className="font-semibold text-white">{currentUser?.name || "User"}</h2>
              <p className="text-xs text-[#8696a0]">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-[#aebac1] hover:text-white transition">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 20.664a9.163 9.163 0 0 1-6.521-2.702.977.977 0 0 1 1.381-1.381 7.269 7.269 0 0 0 10.024.244.977.977 0 0 1 1.313 1.445A9.192 9.192 0 0 1 12 20.664zm7.965-6.112a.977.977 0 0 1-.944-1.229 7.26 7.26 0 0 0-4.8-8.804.977.977 0 0 1 .594-1.86 9.212 9.212 0 0 1 6.092 11.169.976.976 0 0 1-.942.724z"/>
              </svg>
            </button>
            <button 
              onClick={handleLogout}
              className="text-[#aebac1] hover:text-white transition"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-[#202c33]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#8696a0]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or start new chat"
              className="w-full bg-[#2a3942] text-white placeholder-[#8696a0] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#00a884]"
            />
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && searchResults.length > 0 && (
          <div className="flex-1 overflow-y-auto bg-[#111b21]">
            <div className="p-2">
              <h3 className="text-xs font-semibold text-[#8696a0] uppercase px-3 py-2">Search Results</h3>
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 hover:bg-[#2a3942] cursor-pointer transition rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={getAvatar(user)}
                      alt={user.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {getDisplayName(user)}
                      </p>
                      <p className="text-sm text-[#8696a0] truncate">
                        ID: {user.userId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => addFriend(user)}
                    className="bg-[#00a884] hover:bg-[#00b894] text-white px-4 py-2 rounded-full text-sm font-medium transition"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto bg-[#111b21]">
          {friends.map((user) => {
            const msgs = chats[user._id] || [];
            const lastMsg = msgs[msgs.length - 1];
            const unread = unreadCounts[user._id] || 0;
            
            return (
              <div
                key={user._id}
                onClick={() => startChat(user)}
                className="flex items-center p-3 hover:bg-[#2a3942] cursor-pointer border-b border-[#222d34] transition"
              >
                <div className="relative">
                  <img
                    src={getAvatar(user)}
                    alt={user.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]"></div>
                </div>
                <div className="flex-1 ml-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white truncate">
                      {getDisplayName(user)}
                    </h3>
                    {lastMsg && (
                      <span className="text-xs text-[#8696a0]">
                        {lastMsg.time}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#8696a0] truncate max-w-[140px]">
                      {lastMsg ? lastMsg.text : "Tap to start chatting"}
                    </p>
                    {unread > 0 && (
                      <span className="bg-[#00a884] text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${currentView === "chats" ? "hidden md:flex" : "flex"} flex-1 flex-col bg-[#0b141a]`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-[#303d45]">
              <div className="flex items-center space-x-4">
                {currentView === "chat" && (
                  <button
                    onClick={() => {
                      setCurrentView("chats");
                      setSelectedUser(null);
                    }}
                    className="md:hidden text-[#8696a0] hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z"/>
                    </svg>
                  </button>
                )}
                <img
                  src={getAvatar(selectedUser)}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h2 className="font-semibold text-white">
                    {getDisplayName(selectedUser)}
                  </h2>
                  <p className="text-xs text-[#8696a0]">Online</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-[#8696a0]">
                <button className="hover:text-white transition">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </button>
                <button className="hover:text-white transition">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-[#0b141a] p-4 space-y-2">
              {(chats[selectedUser._id] || []).map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 shadow-lg ${
                      m.sender === "me"
                        ? "bg-[#005c4b] text-white rounded-tr-none"
                        : "bg-[#202c33] text-white rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{m.text}</p>
                    <p className={`text-xs mt-1 ${m.sender === "me" ? "text-[#8696a0] text-right" : "text-[#8696a0]"}`}>
                      {m.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-[#202c33] p-3">
              <form onSubmit={sendMessage} className="flex items-center space-x-3">
                <button type="button" className="text-[#8696a0] hover:text-white p-2">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"/>
                  </svg>
                </button>
                <button type="button" className="text-[#8696a0] hover:text-white p-2">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M11.999 22c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm0-1.5a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17zm-3.5-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                  </svg>
                </button>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message"
                    className="w-full bg-[#2a3942] text-white placeholder-[#8696a0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="text-[#8696a0] hover:text-[#00a884] disabled:opacity-50 disabled:cursor-not-allowed p-2 transition"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0b141a] text-center p-8">
            <div className="max-w-md">
              <div className="w-24 h-24 bg-[#00a884] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="white">
                  <path d="M17.5 12.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0z"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-light text-white mb-4">ProChat</h1>
              <p className="text-[#8696a0] text-sm leading-relaxed">
                Send and receive messages without keeping your phone online.
                <br />
                Use ProChat on up to 4 linked devices and 1 phone at the same time.
              </p>
              <div className="mt-6 flex items-center justify-center space-x-2 text-[#8696a0] text-sm">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <span>Your personal messages are end-to-end encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
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
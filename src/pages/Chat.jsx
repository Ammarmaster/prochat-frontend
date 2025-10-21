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
    if (!user?.name) return null;
    const verified = user.name.trim().toLowerCase() === "prodevopz";
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

  const getAvatar = (user) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name
    )}&background=000000&color=E9EDEF`;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-[#E9EDEF] font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center border-b border-[#222]">
        {currentView === "chat" ? (
          <button
            onClick={() => {
              setCurrentView("chats");
              setSelectedUser(null);
            }}
            className="text-[#aaa] hover:text-white text-sm sm:text-base"
          >
            ← Back
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            {/* ✅ Branding */}
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[#00A884]">
                ProChat
              </h1>
              <a
                href="https://instagram.com/prodevopz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-[#E9EDEF] text-sm sm:text-base hover:text-[#00A884] transition"
              >
                @prodevopz
                <VerifiedBadge size={14} />
              </a>
            </div>

            {/* ✅ Current user */}
            {currentUser && (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <img
                  src={getAvatar(currentUser)}
                  alt={currentUser.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                />
                <h1 className="text-base sm:text-lg font-semibold truncate max-w-[120px] sm:max-w-none">
                  {getDisplayName(currentUser)}
                </h1>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="text-xs sm:text-sm bg-[#222] hover:bg-[#333] px-2 sm:px-3 py-1 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Status messages */}
      {message && (
        <div className="bg-[#111] text-green-400 px-3 sm:px-4 py-2 text-sm sm:text-base">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-[#111] text-red-400 px-3 sm:px-4 py-2 text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Main View */}
      <div className="flex-1 overflow-hidden">
        {/* Friends / Search */}
        {currentView === "chats" && (
          <div className="h-full overflow-y-auto">
            <div className="p-3 sm:p-4 bg-[#111] sticky top-0 z-10 border-b border-[#222]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or start new chat"
                className="w-full bg-[#1c1c1c] rounded-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-[#E9EDEF] placeholder-[#777] focus:outline-none"
              />
            </div>

            {/* Search Results */}
            {searchQuery && searchResults.length > 0 && (
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between bg-[#1a1a1a] hover:bg-[#222] p-3 sm:p-4 rounded-xl cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <img
                        src={getAvatar(user)}
                        alt={user.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-sm sm:text-base">
                          {getDisplayName(user)}
                        </p>
                        <p className="text-xs sm:text-sm text-[#777]">
                          ID: {user.userId}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => addFriend(user)}
                      className="text-xs sm:text-sm bg-[#333] hover:bg-[#444] px-2 sm:px-3 py-1 rounded-full"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Friends List */}
            <div className="divide-y divide-[#111]">
              {friends.map((user) => {
                const msgs = chats[user._id] || [];
                const last = msgs[msgs.length - 1];
                const unread = unreadCounts[user._id] || 0;
                return (
                  <div
                    key={user._id}
                    onClick={() => startChat(user)}
                    className="flex items-center justify-between p-3 sm:p-4 hover:bg-[#1a1a1a] cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={getAvatar(user)}
                        alt={user.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                      />
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-sm sm:text-base">
                          {getDisplayName(user)}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#777] truncate max-w-[140px] sm:max-w-[200px]">
                          {last ? last.text : "Tap to chat"}
                        </p>
                      </div>
                    </div>
                    {unread > 0 && (
                      <span className="bg-[#00A884] text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {unread}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat View */}
        {currentView === "chat" && selectedUser && (
          <div className="flex flex-col h-full">
            <div className="bg-[#1a1a1a] p-3 sm:p-4 flex items-center border-b border-[#222] space-x-3">
              <img
                src={getAvatar(selectedUser)}
                alt={selectedUser.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
              />
              <h2 className="text-base sm:text-lg font-semibold">
                {getDisplayName(selectedUser)}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-[#0a0a0a]">
              {(chats[selectedUser._id] || []).map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.sender === "me" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 shadow-md ${
                      m.sender === "me"
                        ? "bg-[#222] text-[#E9EDEF]"
                        : "bg-[#1c1c1c] text-[#E9EDEF]"
                    }`}
                  >
                    <p className="text-sm sm:text-base">{m.text}</p>
                    <p className="text-[10px] sm:text-xs text-[#777] mt-1">
                      {m.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={sendMessage}
              className="bg-[#111] p-3 sm:p-4 flex space-x-2 sm:space-x-3"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                className="flex-1 bg-[#1a1a1a] rounded-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-[#E9EDEF] placeholder-[#777] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[#00A884] hover:bg-[#00B98E] text-white text-sm sm:text-base px-4 sm:px-5 py-2 rounded-full disabled:bg-[#333]"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProChat;

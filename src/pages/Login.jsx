import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

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
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showRemoveButtons, setShowRemoveButtons] = useState({});
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io("https://prochat-api.onrender.com", {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join user room when user is authenticated
  useEffect(() => {
    if (socket && currentUser) {
      socket.emit('join', currentUser._id);
      socket.emit('userOnline', currentUser._id);
    }
  }, [socket, currentUser]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (messageData) => {
      console.log('📨 New message received:', messageData);
      
      const message = {
        id: messageData._id,
        text: messageData.text,
        sender: messageData.sender._id === currentUser?._id ? "me" : "friend",
        time: new Date(messageData.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const chatUserId = messageData.sender._id === currentUser?._id 
        ? messageData.recipient._id 
        : messageData.sender._id;

      // Add message to chats
      setChats(prev => ({
        ...prev,
        [chatUserId]: [
          ...(prev[chatUserId] || []),
          message
        ]
      }));

      // If the message is from a friend and not in current chat, increment unread count
      if (messageData.sender._id !== currentUser?._id && selectedUser?._id !== messageData.sender._id) {
        setUnreadCounts(prev => ({
          ...prev,
          [messageData.sender._id]: (prev[messageData.sender._id] || 0) + 1
        }));

        // Move friend to top of the list
        setFriends(prev => {
          const friendIndex = prev.findIndex(f => f._id === messageData.sender._id);
          if (friendIndex > -1) {
            const updatedFriends = [...prev];
            const [movedFriend] = updatedFriends.splice(friendIndex, 1);
            return [movedFriend, ...updatedFriends];
          }
          return prev;
        });
      }
    };

    const handleMessageError = (errorData) => {
      setError(errorData.error);
    };

    const handleUserTyping = (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => new Set(prev).add(data.userId));
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageError', handleMessageError);
    socket.on('userTyping', handleUserTyping);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageError', handleMessageError);
      socket.off('userTyping', handleUserTyping);
    };
  }, [socket, currentUser, selectedUser]);

  // Auto-hide alerts
  useEffect(() => {
    if (message || error) {
      const t = setTimeout(() => {
        setMessage("");
        setError("");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [message, error]);

  // Typing indicators
  useEffect(() => {
    if (!socket || !selectedUser || !currentUser) return;

    let typingTimeout;

    if (newMessage.trim()) {
      socket.emit('typing', {
        recipientId: selectedUser._id,
        isTyping: true,
        userId: currentUser._id
      });

      typingTimeout = setTimeout(() => {
        socket.emit('typing', {
          recipientId: selectedUser._id,
          isTyping: false,
          userId: currentUser._id
        });
      }, 1000);
    } else {
      socket.emit('typing', {
        recipientId: selectedUser._id,
        isTyping: false,
        userId: currentUser._id
      });
    }

    return () => {
      clearTimeout(typingTimeout);
      socket.emit('typing', {
        recipientId: selectedUser._id,
        isTyping: false,
        userId: currentUser._id
      });
    };
  }, [newMessage, selectedUser, socket, currentUser]);

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
      loadFriends();
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

  // 💬 Load initial messages (only once when chat starts)
  const loadMessages = async (friendId) => {
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
      
      // Reset unread count when opening chat
      setUnreadCounts(prev => ({
        ...prev,
        [friendId]: 0
      }));
    } catch {
      setError("Failed to load messages");
    }
  };

  const startChat = async (user) => {
    setSelectedUser(user);
    setCurrentView("chat");
    await loadMessages(user._id);
  };

  // 🚀 INSTANT MESSAGING WITH SOCKETS
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket || !currentUser) return;

    try {
      // Emit message via socket for instant delivery
      socket.emit('sendMessage', {
        senderId: currentUser._id,
        recipientId: selectedUser._id,
        text: newMessage.trim()
      });

      // Clear input immediately for better UX
      setNewMessage("");

      // Stop typing indicator
      socket.emit('typing', {
        recipientId: selectedUser._id,
        isTyping: false,
        userId: currentUser._id
      });

    } catch (err) {
      setError("Failed to send message");
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, selectedUser]);

  const handleLogout = async () => {
    if (socket) {
      socket.emit('userOffline', currentUser?._id);
      socket.disconnect();
    }
    await axios.post("https://prochat-api.onrender.com/api/auth/user/logout");
    navigate("/login");
  };

  const getAvatar = (user) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "")}&background=008069&color=ffffff&bold=true`;

  // Check if selected user is typing
  const isSelectedUserTyping = selectedUser && typingUsers.has(selectedUser._id);

  // Toggle remove button visibility
  const toggleRemoveButton = (userId) => {
    setShowRemoveButtons(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Get last message for friend list
  const getLastMessage = (userId) => {
    const userChats = chats[userId] || [];
    return userChats[userChats.length - 1];
  };

  return (
    <div className="flex h-screen bg-[#111b21] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className={`${currentView === "chat" ? "hidden md:flex" : "flex"} flex-col w-full md:w-1/3 lg:w-1/4 bg-[#202c33] border-r border-[#303d45]`}>
        {/* Header */}
        <div className="bg-[#202c33] p-4 flex items-center justify-between border-b border-[#303d45]">
          <div className="flex items-center space-x-4">
            {currentUser && (
              <img src={getAvatar(currentUser)} alt="Profile" className="w-10 h-10 rounded-full" />
            )}
            <div>
              <h2 className="font-semibold">{currentUser?.name}</h2>
              <p className="text-xs text-[#8696a0]">
                {socket ? "🟢 Online" : "🔴 Connecting..."}
              </p>
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
            className="w-full bg-[#2a3942] text-white placeholder-[#8696a0] rounded-lg pl-3 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#00a884] mx-2"
          />
        </div>

        {/* Search Results */}
        {searchQuery && searchResults.length > 0 && (
          <div className="overflow-y-auto px-2">
            {searchResults.map((u) => (
              <div key={u._id} className="flex items-center justify-between p-3 hover:bg-[#2a3942] rounded-lg mx-2 mb-2">
                <div className="flex items-center space-x-3">
                  <img src={getAvatar(u)} alt={u.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="text-sm">{getDisplayName(u)}</p>
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
        <div className="flex-1 overflow-y-auto bg-[#111b21] px-2">
          {friends.map((user) => {
            const lastMessage = getLastMessage(user._id);
            const unreadCount = unreadCounts[user._id] || 0;
            
            return (
              <div
                key={user._id}
                onClick={() => startChat(user)}
                className="group flex items-center justify-between p-3 hover:bg-[#2a3942] cursor-pointer border-b border-[#222d34] rounded-lg mx-1 my-2"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="relative">
                    <img src={getAvatar(user)} alt={user.name} className="w-12 h-12 rounded-full" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#00a884] text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">{getDisplayName(user)}</h3>
                      {lastMessage && (
                        <span className="text-xs text-[#8696a0] whitespace-nowrap ml-2">
                          {lastMessage.time}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#8696a0] truncate max-w-[120px]">
                        {lastMessage ? lastMessage.text : "Tap to start chatting"}
                      </p>
                      {/* Mobile remove button - always visible with long press */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFriend(user);
                        }}
                        className="md:hidden text-red-400 hover:text-red-500 transition p-1 ml-2"
                        title="Remove friend"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Desktop remove button - show on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFriend(user);
                  }}
                  className="hidden md:group-hover:block text-red-400 hover:text-red-500 transition p-1"
                  title="Remove friend"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1z"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${currentView === "chats" ? "hidden md:flex" : "flex"} flex-1 flex-col bg-[#0b141a]`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#202c33] px-4 md:px-6 py-3 flex items-center justify-between border-b border-[#303d45]">
              <div className="flex items-center space-x-3 md:space-x-4">
                {currentView === "chat" && (
                  <button
                    onClick={() => {
                      setCurrentView("chats");
                      setSelectedUser(null);
                    }}
                    className="md:hidden text-[#8696a0] hover:text-white p-1"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z"/>
                    </svg>
                  </button>
                )}
                <img
                  src={getAvatar(selectedUser)}
                  alt={selectedUser.name}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                />
                <div>
                  <h2 className="font-semibold text-white text-sm md:text-base">
                    {getDisplayName(selectedUser)}
                  </h2>
                  <p className="text-xs text-[#8696a0]">
                    {isSelectedUserTyping ? "✍️ Typing..." : "🟢 Online"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 md:space-x-6 text-[#8696a0]">
                <button className="hover:text-white transition p-1">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </button>
                <button className="hover:text-white transition p-1">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-[#0b141a] p-3 md:p-4 space-y-3">
              {(chats[selectedUser._id] || []).map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"} px-2 md:px-0`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-lg px-3 md:px-4 py-2 md:py-3 shadow-lg ${
                      m.sender === "me"
                        ? "bg-[#005c4b] text-white rounded-tr-none ml-4"
                        : "bg-[#202c33] text-white rounded-tl-none mr-4"
                    }`}
                  >
                    <p className="text-sm md:text-base leading-relaxed break-words">{m.text}</p>
                    <p className={`text-xs mt-1 md:mt-2 ${m.sender === "me" ? "text-[#8696a0] text-right" : "text-[#8696a0]"}`}>
                      {m.time}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isSelectedUserTyping && (
                <div className="flex justify-start px-2 md:px-0">
                  <div className="bg-[#202c33] text-white rounded-tl-none rounded-lg px-4 py-3 shadow-lg mr-4">
                    <div className="flex space-x-1 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-xs text-[#8696a0] ml-2">typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-[#202c33] p-3 md:p-4">
              <form onSubmit={sendMessage} className="flex items-center space-x-2 md:space-x-3">
                <button type="button" className="text-[#8696a0] hover:text-white p-2">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"/>
                  </svg>
                </button>
                <button type="button" className="text-[#8696a0] hover:text-white p-2">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M11.999 22c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm0-1.5a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17zm-3.5-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                  </svg>
                </button>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message"
                    className="w-full bg-[#2a3942] text-white placeholder-[#8696a0] rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00a884] mx-1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-[#00a884] hover:bg-[#00b894] text-white px-4 md:px-6 py-2 md:py-3 rounded-lg disabled:bg-[#2a3942] disabled:text-[#8696a0] transition font-medium text-sm md:text-base"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0b141a] text-center p-6 md:p-8">
            <div className="max-w-md mx-4">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[#00a884] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg viewBox="0 0 24 24" width="36" height="36" fill="white">
                  <path d="M17.5 12.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0z"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-light text-white mb-3 md:mb-4">ProChat</h1>
              <p className="text-[#8696a0] text-xs md:text-sm leading-relaxed">
                Send and receive messages instantly with real-time technology.
                <br />
                No more delays - chat happens in real-time!
              </p>
              <div className="mt-4 md:mt-6 flex items-center justify-center space-x-2 text-[#8696a0] text-xs md:text-sm">
                <span>{socket ? "🟢 Real-time messaging enabled" : "🟡 Connecting to server..."}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-[#00a884] text-white px-4 md:px-6 py-2 md:py-3 rounded-lg shadow-lg z-50 max-w-[90%] md:max-w-sm text-center text-sm md:text-base mx-4">
          {message}
        </div>
      )}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg shadow-lg z-50 max-w-[90%] md:max-w-sm text-center text-sm md:text-base mx-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default ProChat;
import React, { useState, useEffect, useRef, useCallback } from 'react';

let apiEnvUrl = import.meta.env.VITE_API_URL;
if (!apiEnvUrl) {
  apiEnvUrl = '/api';
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    if (window.location.port !== '5000') {
      apiEnvUrl = 'http://localhost:5000/api';
    }
  }
}
if (apiEnvUrl && !apiEnvUrl.endsWith('/api')) {
  apiEnvUrl = apiEnvUrl.replace(/\/$/, '') + '/api';
}
const BASE_URL = apiEnvUrl;

const ChatWidget = ({ currentUserId, currentUserName, currentUserRole, currentUserAvatar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [view, setView] = useState('contacts'); // 'contacts' | 'chat' | 'new'
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversation contacts
  const fetchContacts = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`${BASE_URL}/messages/contacts/${currentUserId}`);
      if (res.ok) setContacts(await res.json());
    } catch {}
  }, [currentUserId]);

  // Fetch unread count for notification badge
  const fetchUnreadCount = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`${BASE_URL}/messages/unread-count/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {}
  }, [currentUserId]);

  // Fetch all users for new chat
  const fetchAllUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/messages/users`);
      if (res.ok) setAllUsers(await res.json());
    } catch {}
  };

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!currentUserId || !activeContact) return;
    try {
      const res = await fetch(
        `${BASE_URL}/messages/conversation?userId1=${currentUserId}&userId2=${activeContact._id}`
      );
      if (res.ok) {
        setMessages(await res.json());
        scrollToBottom();
      }
      // Mark messages as read
      await fetch(`${BASE_URL}/messages/mark-read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: activeContact._id, receiverId: currentUserId }),
      });
    } catch {}
  }, [currentUserId, activeContact]);

  // Initial load
  useEffect(() => {
    if (currentUserId) {
      fetchContacts();
      fetchUnreadCount();
    }
  }, [fetchContacts, fetchUnreadCount, currentUserId]);

  // Poll for new messages when chat is open
  useEffect(() => {
    if (isOpen && activeContact) {
      fetchMessages();
      pollRef.current = setInterval(() => {
        fetchMessages();
        fetchUnreadCount();
      }, 3000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
      // Poll unread count even when closed
      if (isOpen) {
        pollRef.current = setInterval(() => {
          fetchContacts();
          fetchUnreadCount();
        }, 5000);
      }
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOpen, activeContact, fetchMessages, fetchUnreadCount, fetchContacts]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          senderName: currentUserName,
          senderRole: currentUserRole,
          senderAvatar: currentUserAvatar || '',
          receiverId: activeContact._id,
          receiverName: activeContact.fullName,
          text: newMessage.trim(),
        }),
      });
      if (res.ok) {
        const sent = await res.json();
        setMessages(prev => [...prev, sent]);
        setNewMessage('');
        fetchContacts();
      }
    } catch {}
    setSending(false);
  };

  const openChatWith = (contact) => {
    setActiveContact(contact);
    setView('chat');
    setMessages([]);
  };

  const handleNewChat = async () => {
    await fetchAllUsers();
    setView('new');
    setSearchQuery('');
  };

  const filteredUsers = allUsers.filter(u =>
    u._id !== currentUserId &&
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const roleColors = { client: '#0d6efd', worker: '#198754', admin: '#dc3545' };
  const roleColor = roleColors[currentUserRole] || '#6c757d';

  return (
    <>
      {/* ──── Floating Trigger Button ──── */}
      <button
        id="chat-widget-trigger"
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) { fetchContacts(); fetchUnreadCount(); } }}
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
          width: '62px', height: '62px', borderRadius: '50%', border: 'none',
          background: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)',
          color: '#fff', fontSize: '1.6rem', cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(13,110,253,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Open Messages"
      >
        {isOpen ? '✕' : '💬'}
        {unreadCount > 0 && !isOpen && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            background: '#dc3545', color: '#fff',
            borderRadius: '50%', fontSize: '0.65rem', fontWeight: 800,
            width: '20px', height: '20px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff', animation: 'pulse 1.5s infinite',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ──── Chat Panel ──── */}
      {isOpen && (
        <div
          id="chat-widget-panel"
          style={{
            position: 'fixed', bottom: '102px', right: '28px', zIndex: 9998,
            width: '370px', height: '540px', borderRadius: '20px',
            background: '#fff',
            boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 4px 20px rgba(13,110,253,0.12)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'slideUpFade 0.25s ease',
            border: '1.5px solid rgba(13,110,253,0.1)',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)',
            padding: '16px 20px', color: '#fff', flexShrink: 0,
          }}>
            {view === 'chat' && activeContact ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => { setView('contacts'); setActiveContact(null); setMessages([]); }}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '1rem' }}
                >←</button>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.9rem', overflow: 'hidden',
                }}>
                  {activeContact.avatar
                    ? <img src={activeContact.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : getInitials(activeContact.fullName)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{activeContact.fullName}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.85, textTransform: 'capitalize' }}>
                    {activeContact.role === 'worker' ? `👷 ${activeContact.occupation || 'Trade Worker'}` : activeContact.role === 'client' ? '🏠 Client' : '🛡️ Admin'}
                  </div>
                </div>
              </div>
            ) : view === 'new' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setView('contacts')}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '1rem' }}
                >←</button>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>New Conversation</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Choose someone to message</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>💬 Messages</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                    Signed in as <strong>{currentUserName}</strong>
                  </div>
                </div>
                <button
                  onClick={handleNewChat}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                    borderRadius: '10px', padding: '6px 12px', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.8rem',
                  }}
                >＋ New</button>
              </div>
            )}
          </div>

          {/* ── View: Contacts List ── */}
          {view === 'contacts' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {contacts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>No conversations yet</div>
                  <div style={{ fontSize: '0.8rem' }}>Click <strong>＋ New</strong> to start messaging a client or worker!</div>
                </div>
              ) : (
                contacts.map(contact => (
                  <button
                    key={contact._id}
                    onClick={() => openChatWith(contact)}
                    style={{
                      width: '100%', background: 'none', border: 'none', padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                      textAlign: 'left', transition: 'background 0.15s',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8f9ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,#e8f0fe,#c2d3ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.9rem', color: '#0d6efd', overflow: 'hidden',
                      position: 'relative',
                    }}>
                      {contact.avatar
                        ? <img src={contact.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : getInitials(contact.fullName)}
                      {contact.unread > 0 && (
                        <span style={{
                          position: 'absolute', top: 0, right: 0,
                          background: '#dc3545', color: '#fff', borderRadius: '50%',
                          fontSize: '0.6rem', fontWeight: 800, width: '16px', height: '16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '2px solid #fff',
                        }}>{contact.unread > 9 ? '9+' : contact.unread}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>{contact.fullName}</span>
                        <span style={{ fontSize: '0.7rem', color: '#aaa', flexShrink: 0 }}>
                          {contact.lastMessageTime ? formatDate(contact.lastMessageTime) : ''}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.78rem', color: contact.unread > 0 ? '#0d6efd' : '#888',
                        fontWeight: contact.unread > 0 ? 700 : 400,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: '220px',
                      }}>
                        {contact.lastMessage}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── View: New Chat — User Search ── */}
          {view === 'new' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search clients or workers..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%', padding: '10px 14px 10px 38px',
                      border: '1.5px solid #e0e7ff', borderRadius: '12px',
                      fontSize: '0.85rem', outline: 'none',
                      background: '#f8f9ff', boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '0.9rem' }}>🔍</span>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa', fontSize: '0.85rem' }}>
                    No users found
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user._id}
                      onClick={() => openChatWith(user)}
                      style={{
                        width: '100%', background: 'none', border: 'none', padding: '12px 16px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        cursor: 'pointer', textAlign: 'left',
                        borderBottom: '1px solid #f5f5f5', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                        background: user.role === 'worker' ? 'linear-gradient(135deg,#d4edda,#a8d5b5)' : 'linear-gradient(135deg,#cfe2ff,#9ec5fe)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.85rem',
                        color: user.role === 'worker' ? '#198754' : '#0d6efd',
                        overflow: 'hidden',
                      }}>
                        {user.avatar
                          ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : getInitials(user.fullName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a2e' }}>{user.fullName}</div>
                        <div style={{
                          fontSize: '0.72rem', color: user.role === 'worker' ? '#198754' : '#0d6efd',
                          fontWeight: 600, textTransform: 'capitalize',
                        }}>
                          {user.role === 'worker' ? `👷 ${user.occupation || 'Worker'}` : '🏠 Client'}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── View: Chat Conversation ── */}
          {view === 'chat' && activeContact && (
            <>
              {/* Messages area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', background: '#f8f9ff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: '#aaa' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👋</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Start a conversation with {activeContact.fullName}!
                    </div>
                  </div>
                ) : (
                  (() => {
                    let lastDate = '';
                    return messages.map((msg, i) => {
                      const msgDate = formatDate(msg.createdAt);
                      const showDateLabel = msgDate !== lastDate;
                      lastDate = msgDate;
                      const isOwn = msg.senderId === currentUserId;

                      return (
                        <React.Fragment key={msg._id || i}>
                          {showDateLabel && (
                            <div style={{ textAlign: 'center', margin: '8px 0 4px' }}>
                              <span style={{
                                background: 'rgba(0,0,0,0.07)', color: '#888',
                                borderRadius: '20px', padding: '3px 12px',
                                fontSize: '0.7rem', fontWeight: 600,
                              }}>{msgDate}</span>
                            </div>
                          )}
                          <div style={{
                            display: 'flex',
                            justifyContent: isOwn ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-end', gap: '8px',
                          }}>
                            {!isOwn && (
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                background: '#e0e7ff', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontWeight: 700, fontSize: '0.65rem',
                                color: '#0d6efd', overflow: 'hidden',
                              }}>
                                {activeContact.avatar
                                  ? <img src={activeContact.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : getInitials(activeContact.fullName)}
                              </div>
                            )}
                            <div style={{ maxWidth: '75%' }}>
                              <div style={{
                                background: isOwn
                                  ? 'linear-gradient(135deg, #0d6efd, #6610f2)'
                                  : '#fff',
                                color: isOwn ? '#fff' : '#1a1a2e',
                                padding: '9px 14px', borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                fontSize: '0.85rem', lineHeight: '1.45',
                                boxShadow: isOwn ? '0 4px 12px rgba(13,110,253,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                                wordBreak: 'break-word',
                              }}>
                                {msg.text}
                              </div>
                              <div style={{
                                fontSize: '0.65rem', color: '#aaa',
                                textAlign: isOwn ? 'right' : 'left',
                                marginTop: '3px', paddingX: '4px',
                              }}>
                                {formatTime(msg.createdAt)}
                                {isOwn && <span style={{ marginLeft: '4px' }}>{msg.isRead ? ' ✓✓' : ' ✓'}</span>}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderTop: '1.5px solid #e8ecf8',
                  background: '#fff', flexShrink: 0,
                }}
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={1000}
                  style={{
                    flex: 1, border: '1.5px solid #e0e7ff', borderRadius: '25px',
                    padding: '10px 16px', fontSize: '0.85rem', outline: 'none',
                    background: '#f8f9ff', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0d6efd'}
                  onBlur={e => e.target.style.borderColor = '#e0e7ff'}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                    background: newMessage.trim()
                      ? 'linear-gradient(135deg,#0d6efd,#6610f2)'
                      : '#e0e7ff',
                    color: newMessage.trim() ? '#fff' : '#aaa',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '1.1rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.2s ease',
                    boxShadow: newMessage.trim() ? '0 4px 12px rgba(13,110,253,0.3)' : 'none',
                  }}
                >
                  {sending ? '⏳' : '➤'}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
        #chat-widget-panel ::-webkit-scrollbar { width: 4px; }
        #chat-widget-panel ::-webkit-scrollbar-track { background: transparent; }
        #chat-widget-panel ::-webkit-scrollbar-thumb { background: #d0d8f0; border-radius: 4px; }
      `}</style>
    </>
  );
};

export default ChatWidget;

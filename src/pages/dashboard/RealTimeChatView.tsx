import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Send } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { API_BASE, apiFetch, getAccessToken, isBackendAvailable } from '../../lib/api.ts';

interface Conversation {
  id: number;
  peer_id: number;
  peer_name: string;
  peer_role: string;
  subject: string | null;
  last_message: string | null;
  unread_count: number;
  peer_online: boolean;
}

interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  attachment_url: string | null;
  is_read: number;
  created_at: string;
}

export function RealTimeChatView() {
  const { user, showToast } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [onlineIds, setOnlineIds] = useState<number[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const selectedRef = useRef<number | null>(null);
  selectedRef.current = selectedId;

  const loadConversations = () => {
    return apiFetch<{ items: Conversation[] }>('/api/conversations')
      .then((res) => {
        setConversations(res.items);
        if (!selectedRef.current && res.items.length > 0) {
          setSelectedId(res.items[0].id);
        }
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    let active = true;
    void loadConversations().then(() => {
      if (!active || isBackendAvailable() !== true) return;
      const token = getAccessToken();
      if (!token) return;

      const socket = API_BASE
        ? io(API_BASE, { auth: { token }, transports: ['websocket', 'polling'] })
        : io({ auth: { token }, transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.on('connect_error', () => {
        if (isBackendAvailable() === false) {
          socket.disconnect();
        }
      });

      socket.on('presence:update', (payload: { onlineUserIds: number[] }) => {
        setOnlineIds(payload.onlineUserIds || []);
      });

      socket.on('message:new', (msg: ChatMessage) => {
        if (msg.conversation_id === selectedRef.current) {
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (msg.sender_id !== user?.id) {
            socket.emit('message:read', msg.conversation_id);
          }
        }
        void loadConversations();
      });

      socket.on('message:read_ack', (ack: { conversationId: number }) => {
        if (ack.conversationId === selectedRef.current) {
          setMessages((prev) => prev.map((m) => ({ ...m, is_read: 1 })));
        }
      });
    });

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedId) return;
    apiFetch<{ items: ChatMessage[] }>(`/api/conversations/${selectedId}/messages`)
      .then((res) => {
        setMessages(res.items);
        socketRef.current?.emit('conversation:join', selectedId);
        socketRef.current?.emit('message:read', selectedId);
      })
      .catch(() => undefined);
  }, [selectedId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !body.trim()) return;
    const text = body.trim();
    const attach = attachmentUrl.trim() || undefined;
    setBody('');
    setAttachmentUrl('');

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit('message:send', { conversationId: selectedId, body: text, attachmentUrl: attach });
      } else {
        const saved = await apiFetch<ChatMessage>(`/api/conversations/${selectedId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ body: text, attachmentUrl: attach }),
        });
        setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
        void loadConversations();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Xabar yuborilmadi', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden min-h-[520px]">
      {/* Conversations list */}
      <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
        <div className="p-4">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Suhbatlar</h2>
        </div>
        {conversations.length === 0 ? (
          <p className="p-4 text-xs text-slate-500">Hozircha suhbatlar yo&apos;q. Mahsulot yoki xizmat sahifasidan yozing.</p>
        ) : (
          conversations.map((conv) => {
            const isOnline = onlineIds.includes(conv.peer_id) || conv.peer_online;
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left p-4 transition-colors ${
                  selectedId === conv.id ? 'bg-blue-50/70 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{conv.peer_name}</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {isOnline ? 'Online' : conv.peer_role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                  {conv.last_message || conv.subject}
                </p>
                {conv.unread_count > 0 && (
                  <span className="inline-block mt-1 text-[11px] font-mono font-semibold text-[#EA580C]">
                    {conv.unread_count} yangi xabar
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Active chat */}
      <div className="lg:col-span-8 flex flex-col">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500 p-8">
            Suhbatni tanlang
          </div>
        ) : (
          <>
            <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[420px]">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-md px-4 py-2.5 rounded-xl text-sm ${
                        mine
                          ? 'bg-[#1E40AF] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <p>{m.body}</p>
                      {m.attachment_url && (
                        <a
                          href={m.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block mt-1.5 text-xs underline opacity-90"
                        >
                          Rasm / Hujjat ilovasi
                        </a>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 font-mono">
                      {m.sender_name} · {m.created_at.slice(11, 16)} {mine ? (m.is_read ? '· O‘qildi' : '· Yuborildi') : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Xabar yozing..."
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold"
                >
                  <Send className="w-4 h-4" />
                  Yuborish
                </button>
              </div>
              <input
                type="text"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="Ixtiyoriy rasm URL manzili..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </form>
          </>
        )}
      </div>
    </div>
  );
}

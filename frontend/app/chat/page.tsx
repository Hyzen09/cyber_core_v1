'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { fetchChatsAction, loadChatAction, renameChatAction, deleteChatAction, createChatAction, getChatDetailsAction } from '@/app/actions/db';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Plus, History, Edit2, Trash2, Power, Menu, MessageSquare, Settings, Cpu, ChevronRight, Paperclip, Loader2, CornerDownLeft, Copy, Check, Users } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  created_at: string;
};

const CodeBlock = ({ language, className, children }: any) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = () => {
    if (codeRef.current) {
      navigator.clipboard.writeText(codeRef.current.textContent || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group rounded-xl overflow-hidden bg-[#0c0e17] border border-[#434656] my-6 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1d1f29] border-b border-[#434656]">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[#c3c5d9] hover:text-[#e1e1ef] transition-colors bg-[#282934] hover:bg-[#434656] px-2 py-1 rounded-md"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
        <span className="text-xs text-[#c3c5d9] uppercase tracking-wider font-bold">{language}</span>
      </div>
      <div className="overflow-x-auto p-4 custom-scrollbar">
        <pre className="text-sm m-0 bg-transparent p-0">
          <code ref={codeRef} className={className}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default function ChatPage() {
  const router = useRouter();

  // App & User State
  const [userName, setUserName] = useState<string>('Loading...');

  // Chat State
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Reset textarea height when input clears
  useEffect(() => {
    if (input === '' && chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
    }
  }, [input]);

  // Auto-focus chat input on any typing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || (activeElement as HTMLElement)?.isContentEditable;
      if (!isInput && e.key.length === 1) {
        chatInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Rename Feature State
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Upload Feature State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tracks the document currently being discussed
  const [activeFilename, setActiveFilename] = useState<string | null>(null);

  // Initial Agent Name for greeting
  const [initialAgentName, setInitialAgentName] = useState<string | null>(null);

  const initRef = useRef(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeApp = async () => {
      // PLAYWRIGHT TEST BYPASS
      if (typeof window !== 'undefined' && window.localStorage.getItem('PLAYWRIGHT_TEST') === 'true') {
        setUserName('Test User (E2E)');
        fetchChats('test-user-id');
        return;
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }
      const meta = user.user_metadata;
      const display = meta?.username || meta?.full_name || meta?.name || user.email?.split('@')[0] || 'User';
      setUserName(display);

      const searchParams = new URLSearchParams(window.location.search);
      const agentId = searchParams.get('agent_id');
      const agentName = searchParams.get('agent_name');

      // Fetch chats immediately so the sidebar doesn't flash empty
      fetchChats(user.id);

      if (agentId && agentName) {
        setInitialAgentName(agentName);
        try {
          const newChat = await createChatAction(`Chat with ${agentName}`, user.id, agentId);
          if (newChat) {
            setCurrentChatId(newChat.id);
            setCurrentAgentId(agentId);
            window.history.replaceState({}, '', '/chat');
            // Fetch chats again to include the newly created agent chat
            fetchChats(user.id);
          }
        } catch (e) {
          console.error("Failed to init agent chat", e);
        }
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- DATA FETCHING ---
  const fetchChats = async (userId: string) => {
    try {
      const data = await fetchChatsAction(userId);
      if (data) setChats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    setActiveFilename(null);
    setSuggestions([]);
    try {
      const chatDetails = await getChatDetailsAction(chatId);
      setCurrentAgentId(chatDetails?.agent_id || null);

      const data = await loadChatAction(chatId);
      if (data) setMessages(data.map(m => ({ id: m.id, role: m.role, content: m.content })));
    } catch (e) {
      console.error(e);
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setCurrentAgentId(null);
    setInitialAgentName(null);
    setMessages([]);
    setActiveFilename(null);
    setSuggestions([]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const startRename = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };

  const saveRename = async (chatId: string) => {
    if (!editTitle.trim()) {
      setEditingChatId(null);
      return;
    }
    try {
      await renameChatAction(chatId, editTitle);
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: editTitle } : c));
    } catch (e) {
      console.error(e);
    }
    setEditingChatId(null);
  };

  const deleteChat = async (chatId: string) => {
    if (!window.confirm("CONFIRM DELETION OF NEURAL LINK?")) return;
    try {
      await deleteChatAction(chatId);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (currentChatId === chatId) startNewChat();
    } catch (e) {
      console.error(e);
    }
  };

  // --- FILE UPLOAD TO FASTAPI (WITH SESSION ISOLATION) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('SYS_ERR: ONLY PDF FORMAT ALLOWED.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsUploading(true);

    // ENSURE A CHAT SESSION EXISTS BEFORE UPLOAD
    let activeChatId = currentChatId;

    if (!activeChatId) {
      try {
        const docTitle = file.name.substring(0, 20);
        const newChat = await createChatAction(`DOC: ${docTitle}`, user.id);
        if (newChat) {
          activeChatId = newChat.id;
          setCurrentChatId(newChat.id);
          fetchChats(user.id);
        } else {
          throw new Error("Failed to initialize session for upload.");
        }
      } catch (err) {
        console.error(err);
        alert("SYS_ERR: Could not create database session.");
        setIsUploading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user.id);
    formData.append('session_id', activeChatId as string);

    try {
      const response = await fetch('/api/upload-pdf', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload Failed');
      const data = await response.json();

      setActiveFilename(data.filename);

      const systemMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `[DATA_INGEST_COMPLETE] FILE: ${data.filename} PROCESSED & ISOLATED TO THIS SESSION.`
      };

      setMessages(prev => [...prev, systemMessage]);
      await supabase.from('messages').insert([{ chat_id: activeChatId, role: 'system', content: systemMessage.content }]);

    } catch (error) {
      alert('SYS_ERR: CONNECTION TO CORE OCR ENGINE (PORT 8000) FAILED.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- UNIFIED SEND MESSAGE FUNCTION ---
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    let activeChatId = currentChatId;
    setSuggestions([]); // Clear suggestions instantly upon sending

    const { data: { user } } = await supabase.auth.getUser();

    if (!activeChatId) {
      try {
        const newChat = await createChatAction(messageText.substring(0, 20) + '...', user?.id || 'anonymous');
        if (newChat) {
          activeChatId = newChat.id;
          setCurrentChatId(newChat.id);
          if (user) fetchChats(user.id);
        }
      } catch (chatError) {
        console.error("Failed to create chat in Supabase:", chatError);
        alert("Database error: Ensure the 'chats' table exists and check RLS policies.");
        return;
      }
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageText.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages([...newMessages, { id: assistantMessageId, role: 'assistant', content: '' }]); // Start empty for streaming

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 'anonymous',
          session_id: activeChatId,
          message: messageText.trim(),             
          filename: activeFilename,
          agent_id: currentAgentId
        }),
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        console.error(`Backend API Error (${response.status}):`, errorDetail);
        throw new Error(`API returned status ${response.status}: ${errorDetail}`);
      }

      const data = await response.json();
      const answer = data.answer || "I'm sorry, I couldn't generate a response.";

      // Fake the streaming effect so the UI types it out smoothly
      const chunkSize = 15;
      let fullAssistantResponse = '';
      
      for (let i = 0; i < answer.length; i += chunkSize) {
        const chunk = answer.slice(i, i + chunkSize);
        fullAssistantResponse += chunk;
        
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullAssistantResponse } 
              : msg
          )
        );
        
        // Delay to simulate typing speed
        await new Promise(r => setTimeout(r, 15));
      }

      // Clear suggestions since the streaming backend doesn't output a JSON array for them
      setSuggestions([]);

    } catch (error: any) {
      console.error("Chat Error:", error);
      setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: `[SYS_ERR]: ${error.message || "CONNECTION TO CORE FAILED."} Check browser console for details.` } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <div className="bg-[#11131c] text-[#e1e1ef] h-screen flex overflow-hidden font-sans">
      {/* SideNavBar */}
      <nav className={`bg-[#1d1f29] shadow-sm fixed left-0 top-0 h-full w-[280px] flex flex-col border-r border-[#434656] z-40 transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex md:static`}>
        <div className="p-6 border-b border-[#434656]">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#282934] flex items-center justify-center border border-[#434656]">
              <User className="w-6 h-6 text-[#c3c5d9]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-lg text-[#e1e1ef] truncate uppercase">{userName}</h2>
              <p className="text-xs font-bold tracking-widest text-[#c3c5d9]">STATUS: SECURE</p>
            </div>
          </div>
          <button
            onClick={startNewChat}
            className="w-full bg-[#0052ff] hover:bg-[#0052ff]/80 text-[#dfe3ff] text-sm py-2 px-4 rounded-lg flex items-center justify-center space-x-1 transition-colors shadow-sm"
          >
            <Plus className="w-[18px] h-[18px]" />
            <span className="font-medium">NEW UPLINK</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <h3 className="px-6 py-1 text-xs font-bold tracking-widest text-[#c3c5d9] mb-1">SESSION HISTORY</h3>
          <ul className="space-y-1">
            {chats.map(chat => {
              const isActive = chat.id === currentChatId;
              return (
                <li key={chat.id} className="group flex items-center justify-between w-full relative">
                  {editingChatId === chat.id ? (
                    <div className={`flex items-center w-full px-6 py-2 transition-colors ${isActive ? 'bg-[#0052ff] text-[#dfe3ff] border-l-4 border-[#b7c4ff] rounded-r-lg' : 'text-[#c3c5d9] hover:bg-[#282934]'}`}>
                      <History className="w-[18px] h-[18px] mr-3" />
                      <input
                        autoFocus
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => saveRename(chat.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveRename(chat.id)}
                        className="flex-1 bg-transparent border border-[#b7c4ff] text-[#e1e1ef] text-sm focus:outline-none w-full"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        loadChat(chat.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left flex items-center space-x-3 pl-6 pr-16 py-2 text-sm transition-colors ${isActive
                          ? 'bg-[#0052ff] text-[#dfe3ff] border-l-4 border-[#b7c4ff] rounded-r-lg'
                          : 'text-[#c3c5d9] hover:bg-[#282934]'
                        }`}
                    >
                      <History className="w-[18px] h-[18px] shrink-0" />
                      <span className="truncate flex-1">{chat.title}</span>
                    </button>
                  )}
                  {/* Hover Actions */}
                  {editingChatId !== chat.id && (
                    <div className="absolute right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-transparent">
                      <button onClick={(e) => { e.stopPropagation(); startRename(chat.id, chat.title); }} className={`p-1 ${isActive ? 'text-[#dfe3ff] hover:text-white' : 'text-[#8d90a2] hover:text-[#b7c4ff]'}`} title="Rename">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className={`p-1 ${isActive ? 'text-[#ffdad6] hover:text-white' : 'text-[#ffb4ab] hover:text-red-400'}`} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
            {chats.length === 0 && (
              <li className="px-6 py-2 text-xs text-[#c3c5d9]/50 italic">No previous sessions</li>
            )}
          </ul>
        </div>

        <div className="p-6 border-t border-[#434656] mt-auto">
          <ul className="space-y-3">
            <li>
              <Link href="/chat/agents" className="flex items-center space-x-3 w-full text-[#c3c5d9] hover:text-[#e1e1ef] transition-colors text-sm py-1">
                <Users className="w-[18px] h-[18px]" />
                <span>Agents</span>
              </Link>
            </li>
            <li>
              <button onClick={handleSignOut} className="flex items-center space-x-3 w-full text-[#ffb4ab] hover:text-red-400 transition-colors text-sm py-1">
                <Power className="w-[18px] h-[18px]" />
                <span>Log Out</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-[#11131c] min-w-0">
        {/* TopNavBar */}
        <header className="bg-[#11131c] shadow-sm z-10 sticky top-0 flex justify-between items-center w-full px-4 md:px-6 py-4 h-16 border-b border-[#434656]">
          <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-[#e1e1ef] p-1 hover:bg-[#282934] rounded-full shrink-0"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#b7c4ff] truncate uppercase">
              PROFESSIONAL_CORE
            </h1>
          </div>
          <div className="flex items-center space-x-4 shrink-0">
            {activeFilename && (
              <span className="hidden md:inline-block text-xs text-[#c3c5d9] bg-[#282934] px-2 py-1 rounded border border-[#434656] truncate max-w-[200px]">
                FILE: {activeFilename}
              </span>
            )}
            <div className="flex items-center space-x-2 bg-[#1d1f29] px-3 py-1 rounded-full border border-[#434656]">
              <span className="text-xs font-bold tracking-widest text-[#c3c5d9]">CORE:</span>
              <span className="text-sm text-[#e1e1ef] font-medium">CLOUD_GEMINI</span>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative pb-6">
          {messages.length > 0 && (
            <div className="flex justify-center mb-6">
              <span className="text-xs font-bold tracking-widest text-[#c3c5d9] bg-[#1d1f29] px-3 py-1 rounded-full uppercase">
                SESSION: {chats.find(c => c.id === currentChatId)?.title || "NEW_UPLINK"}
              </span>
            </div>
          )}

          {/* Empty State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#1d1f29] flex items-center justify-center border border-[#434656] mb-4">
                <MessageSquare className="w-8 h-8 text-[#b7c4ff]" />
              </div>
              <h3 className="text-xl font-bold text-[#e1e1ef] mb-2">
                {initialAgentName 
                  ? `I am ${initialAgentName}. How can I help you today?` 
                  : (currentChatId && chats.find(c => c.id === currentChatId)?.title?.startsWith('Chat with ')
                      ? `I am ${chats.find(c => c.id === currentChatId)!.title.replace('Chat with ', '')}. How can I help you today?`
                      : "How can I help you today?")
                }
              </h3>
              <p className="text-[#c3c5d9] mb-8">Initiate a query or upload a document to begin the analysis protocol.</p>

              <div className="flex flex-wrap justify-center gap-2">
                {["Summarize my latest report", "Explain quantum computing", "Draft an email to the team"].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(suggestion)}
                    className="px-4 py-2 rounded-full border border-[#434656] text-[#c3c5d9] text-sm hover:bg-[#282934] transition-colors bg-[#11131c]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-6 max-w-4xl mx-auto w-full">
            {messages.map((msg, idx) => {
              if (isLoading && msg.role === 'assistant' && msg.content === '' && idx === messages.length - 1) {
                return null;
              }
              return (
              <div key={msg.id || idx} className={`flex items-start space-x-3 w-full ${msg.role === 'user' ? 'justify-end' : ''}`}>

                {/* Avatar for Assistant */}
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#282934] flex items-center justify-center shrink-0 mt-1 border border-[#434656]">
                    {msg.role === 'system' ? <Settings className="w-4 h-4 text-[#c3c5d9]" /> : <Cpu className="w-4 h-4 text-[#c3c5d9]" />}
                  </div>
                )}

                {/* Message Bubble */}
                <div data-testid="message-bubble" className={`p-4 shadow-sm max-w-[85%] break-words ${msg.role === 'user'
                    ? 'bg-[#0052ff] rounded-2xl rounded-tr-sm text-white text-base font-medium'
                    : msg.role === 'system'
                      ? 'bg-[#282934] rounded-2xl rounded-tl-sm text-[#e1e1ef] text-base border border-[#b7c4ff]/50 uppercase text-sm'
                      : 'bg-[#1d1f29] rounded-2xl rounded-tl-sm text-[#e1e1ef] text-base border border-[#434656]'
                  }`}>
                  <div className="prose prose-sm md:prose-base max-w-none prose-invert prose-p:leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        pre: ({ children }: any) => {
                          const codeElement = children;
                          const className = codeElement?.props?.className || '';
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : 'text';
                          return <CodeBlock language={language} className={className} children={codeElement?.props?.children} />;
                        },
                        code: ({ node, className, children, ...props }: any) => {
                          return <code className={`bg-[#282934] text-[#ffb4ab] px-1.5 py-0.5 rounded text-sm ${className || ''}`} {...props}>{children}</code>;
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {msg.role === 'user' && (
                    <div className="text-[10px] text-[#dfe3ff]/70 mt-2 text-right uppercase">TX: SECURE</div>
                  )}
                </div>

                {/* Avatar for User */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#b7c4ff] flex items-center justify-center shrink-0 mt-1 border border-[#434656]">
                    <User className="w-4 h-4 text-[#001452]" />
                  </div>
                )}
              </div>
            )})}

            {/* Loading Indicator */}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex items-start space-x-3 max-w-4xl mx-auto w-full">
                <div className="w-8 h-8 rounded-full bg-[#282934] flex items-center justify-center shrink-0 mt-1 border border-[#434656]">
                  <Cpu className="w-4 h-4 text-[#c3c5d9] animate-pulse" />
                </div>
                <div data-testid="loading-indicator" className="bg-[#1d1f29] rounded-2xl rounded-tl-sm p-4 text-[#e1e1ef] text-base border border-[#434656] flex items-center space-x-2 uppercase text-sm">
                  PROCESSING COMPUTATION...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area and Suggestions */}
        <div className="w-full z-30 flex flex-col shrink-0 bg-[#11131c]">
          {/* Suggestion Chips */}
          {suggestions.length > 0 && messages.length > 0 && (
            <div className="w-full bg-[#11131c]/90 backdrop-blur-sm py-3 px-4 md:px-6 flex gap-2 overflow-x-auto custom-scrollbar border-t border-[#434656]">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(sug)}
                  className="shrink-0 px-4 py-2 rounded-full border border-[#434656] text-[#c3c5d9] text-sm hover:bg-[#282934] transition-colors bg-[#1d1f29] shadow-sm"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-4 md:p-6 bg-[#11131c] border-t border-[#434656] shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
            <form onSubmit={onSubmitForm} className="max-w-4xl mx-auto relative">
              <div className="flex items-center bg-[#1d1f29] border border-[#434656] rounded-xl shadow-sm focus-within:border-[#b7c4ff] focus-within:ring-1 focus-within:ring-[#b7c4ff] transition-all overflow-hidden p-1">
                <ChevronRight className="w-6 h-6 text-[#b7c4ff] ml-3 mr-1 shrink-0" />
                <textarea
                  data-testid="chat-input"
                  ref={chatInputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !isLoading && !isUploading) {
                        onSubmitForm(e as any);
                      }
                    }
                  }}
                  rows={1}
                  disabled={isLoading || isUploading}
                  placeholder="Enter command..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[#e1e1ef] text-sm placeholder:text-[#c3c5d9]/50 py-3 min-w-0 focus:outline-none disabled:opacity-50 resize-none custom-scrollbar leading-relaxed"
                  autoComplete="off"
                />

                <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                <div className="flex items-center space-x-1 pr-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`p-2 transition-colors rounded-full ${activeFilename ? 'text-[#0052ff] bg-[#0052ff]/10 hover:bg-[#0052ff]/20' : 'text-[#8d90a2] hover:text-[#b7c4ff] hover:bg-[#282934]'}`}
                    title="UPLOAD DOCUMENT"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    data-testid="send-button"
                    type="submit"
                    disabled={!input.trim() || isLoading || isUploading}
                    className="bg-[#0052ff] hover:bg-[#0052ff]/80 text-[#dfe3ff] disabled:opacity-50 font-semibold text-sm py-1.5 px-4 rounded-lg flex items-center space-x-1 transition-colors shadow-sm ml-1"
                  >
                    <span className="hidden sm:inline">EXECUTE</span>
                    <CornerDownLeft className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
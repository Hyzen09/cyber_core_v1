import React, { useState } from 'react';

// Types
export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatSession = {
  id: string;
  title: string;
};

interface ProfessionalChatDarkModeProps {
  userName?: string;
  sessions?: ChatSession[];
  activeSessionId?: string;
  messages?: Message[];
  suggestions?: string[];
  isLoading?: boolean;
  onSendMessage?: (message: string) => void;
  onSelectSession?: (id: string) => void;
  onNewSession?: () => void;
}

export default function ProfessionalChatDarkMode({
  userName = "User",
  sessions = [],
  activeSessionId,
  messages = [],
  suggestions = [],
  isLoading = false,
  onSendMessage,
  onSelectSession,
  onNewSession
}: ProfessionalChatDarkModeProps) {
  const [input, setInput] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && onSendMessage) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const activeSessionTitle = sessions.find(s => s.id === activeSessionId)?.title || "NEW SESSION";

  return (
    <div className="bg-[#11131c] text-[#e1e1ef] h-screen flex overflow-hidden font-sans">
      {/* SideNavBar */}
      <nav className={`bg-[#1d1f29] shadow-sm fixed left-0 top-0 h-full w-[280px] flex flex-col border-r border-[#434656] z-20 transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex md:static`}>
        <div className="p-6 border-b border-[#434656]">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#282934] flex items-center justify-center border border-[#434656]">
              <span className="material-symbols-outlined text-[#c3c5d9]">person</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-lg text-[#e1e1ef] truncate uppercase">{userName}</h2>
              <p className="text-xs font-bold tracking-widest text-[#c3c5d9]">STATUS: SECURE</p>
            </div>
          </div>
          <button 
            onClick={onNewSession}
            className="w-full bg-[#0052ff] hover:bg-[#0052ff]/80 text-[#dfe3ff] text-sm py-2 px-4 rounded-lg flex items-center justify-center space-x-1 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-medium">NEW UPLINK</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <h3 className="px-6 py-1 text-xs font-bold tracking-widest text-[#c3c5d9] mb-1">SESSION HISTORY</h3>
          <ul className="space-y-1">
            {sessions.map(session => {
              const isActive = session.id === activeSessionId;
              return (
                <li key={session.id}>
                  <button 
                    onClick={() => {
                      onSelectSession?.(session.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left flex items-center space-x-3 px-6 py-2 text-sm transition-colors ${
                      isActive 
                        ? 'bg-[#0052ff] text-[#dfe3ff] border-l-4 border-[#b7c4ff] rounded-r-lg' 
                        : 'text-[#c3c5d9] hover:bg-[#282934]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    <span className="truncate">{session.title}</span>
                  </button>
                </li>
              );
            })}
            {sessions.length === 0 && (
              <li className="px-6 py-2 text-xs text-[#c3c5d9]/50 italic">No previous sessions</li>
            )}
          </ul>
        </div>
        
        <div className="p-6 border-t border-[#434656] mt-auto">
          <ul className="space-y-1">
            <li>
              <button className="flex items-center space-x-3 w-full text-[#c3c5d9] hover:text-[#e1e1ef] transition-colors text-sm py-1">
                <span className="material-symbols-outlined text-[18px]">settings</span>
                <span>Settings</span>
              </button>
            </li>
            <li>
              <button className="flex items-center space-x-3 w-full text-[#c3c5d9] hover:text-[#e1e1ef] transition-colors text-sm py-1">
                <span className="material-symbols-outlined text-[18px]">help</span>
                <span>Support</span>
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
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#b7c4ff] truncate uppercase">
              PROFESSIONAL_CORE
            </h1>
          </div>
          <div className="flex items-center space-x-4 shrink-0">
            <div className="hidden sm:flex items-center space-x-2 bg-[#1d1f29] px-3 py-1 rounded-full border border-[#434656]">
              <span className="text-xs font-bold tracking-widest text-[#c3c5d9]">ACTIVE MODEL:</span>
              <span className="text-sm text-[#e1e1ef] font-medium">GPT-4 Turbo</span>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative">
          {messages.length > 0 && (
            <div className="flex justify-center mb-6">
              <span className="text-xs font-bold tracking-widest text-[#c3c5d9] bg-[#1d1f29] px-3 py-1 rounded-full uppercase">
                SESSION: {activeSessionTitle}
              </span>
            </div>
          )}

          {/* Empty State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#1d1f29] flex items-center justify-center border border-[#434656] mb-4">
                <span className="material-symbols-outlined text-[32px] text-[#b7c4ff]">chat_bubble</span>
              </div>
              <h3 className="text-xl font-bold text-[#e1e1ef] mb-2">How can I help you today?</h3>
              <p className="text-[#c3c5d9] mb-8">Initiate a query or upload a document to begin the analysis protocol.</p>
              
              <div className="flex flex-wrap justify-center gap-2">
                {["Summarize my latest report", "Explain quantum computing", "Draft an email to the team"].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => onSendMessage?.(suggestion)}
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
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex items-start space-x-3 w-full ${msg.role === 'user' ? 'justify-end' : ''}`}>
                
                {/* Avatar for Assistant */}
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#282934] flex items-center justify-center shrink-0 mt-1 border border-[#434656]">
                    <span className="material-symbols-outlined text-[16px] text-[#c3c5d9]">
                      {msg.role === 'system' ? 'settings' : 'memory'}
                    </span>
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`p-4 shadow-sm max-w-[85%] break-words whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-[#0052ff] rounded-2xl rounded-tr-sm text-white text-base font-medium' 
                    : 'bg-[#1d1f29] rounded-2xl rounded-tl-sm text-[#e1e1ef] text-base border border-[#434656]'
                }`}>
                  {msg.content}
                </div>

                {/* Avatar for User */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#b7c4ff] flex items-center justify-center shrink-0 mt-1 border border-[#434656]">
                    <span className="material-symbols-outlined text-[16px] text-[#001452]">person</span>
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start space-x-3 max-w-4xl mx-auto w-full">
                 <div className="w-8 h-8 rounded-full bg-[#282934] flex items-center justify-center shrink-0 mt-1 border border-[#434656]">
                    <span className="material-symbols-outlined text-[16px] text-[#c3c5d9] animate-pulse">memory</span>
                 </div>
                 <div className="bg-[#1d1f29] rounded-2xl rounded-tl-sm p-4 text-[#e1e1ef] text-base border border-[#434656] flex items-center space-x-2">
                    <span className="w-2 h-2 bg-[#b7c4ff] rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-[#b7c4ff] rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-[#b7c4ff] rounded-full animate-bounce delay-200"></span>
                 </div>
              </div>
            )}
          </div>

          {/* Suggestion Chips */}
          {suggestions.length > 0 && messages.length > 0 && (
            <div className="flex flex-wrap gap-2 max-w-4xl mx-auto pl-11 mt-4">
              {suggestions.map((sug, i) => (
                <button 
                  key={i}
                  onClick={() => onSendMessage?.(sug)}
                  className="px-4 py-2 rounded-full border border-[#434656] text-[#c3c5d9] text-sm hover:bg-[#282934] transition-colors bg-[#11131c]"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-[#11131c] border-t border-[#434656] shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
            <div className="flex items-center bg-[#1d1f29] border border-[#434656] rounded-xl shadow-sm focus-within:border-[#b7c4ff] focus-within:ring-1 focus-within:ring-[#b7c4ff] transition-all overflow-hidden p-1">
              <span className="material-symbols-outlined text-[#b7c4ff] ml-3 mr-1 shrink-0">chevron_right</span>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder="Enter command..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-[#e1e1ef] text-sm placeholder:text-[#c3c5d9]/50 py-3 min-w-0 focus:outline-none"
              />
              <div className="flex items-center space-x-1 pr-2 shrink-0">
                <button type="button" className="p-2 text-[#8d90a2] hover:text-[#b7c4ff] transition-colors rounded-full hover:bg-[#282934]">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-[#0052ff] hover:bg-[#0052ff]/80 text-[#dfe3ff] disabled:opacity-50 font-semibold text-sm py-1.5 px-4 rounded-lg flex items-center space-x-1 transition-colors shadow-sm ml-1"
                >
                  <span>EXECUTE</span>
                  <span className="material-symbols-outlined text-[18px]">keyboard_return</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

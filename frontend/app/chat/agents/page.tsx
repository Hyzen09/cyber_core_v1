'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { ArrowLeft, Plus, Cpu, Settings, Trash2 } from 'lucide-react';

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>('Loading...');
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const handleDeleteAgent = async (e: React.MouseEvent, agentId: string, agentName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the agent: ${agentName}?`)) return;
    
    try {
      const { error } = await supabase.from('agents').delete().eq('id', agentId);
      if (error) throw error;
      setAgents(prev => prev.filter(a => a.id !== agentId));
    } catch (err) {
      console.error("Failed to delete agent:", err);
      alert("Error deleting agent. Please try again.");
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      if (typeof window !== 'undefined' && window.localStorage.getItem('PLAYWRIGHT_TEST') === 'true') {
        setUserName('Test User (E2E)');
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
      setUserId(user.id);
      
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false });
        
      if (!agentsError && agentsData) {
        setAgents(agentsData);
      } else {
        console.error("Failed to load agents:", agentsError);
      }
      setIsLoading(false);
    };
    initializeApp();
  }, [router]);

  return (
    <div className="bg-[#11131c] text-[#e1e1ef] min-h-screen flex flex-col font-sans">
      <header className="bg-[#11131c] shadow-sm z-10 sticky top-0 flex justify-between items-center w-full px-4 md:px-6 py-4 h-16 border-b border-[#434656]">
        <div className="flex items-center space-x-4">
          <Link href="/chat" className="text-[#c3c5d9] hover:text-[#e1e1ef] transition-colors p-2 hover:bg-[#282934] rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-[#b7c4ff] uppercase">
            AGENT_MANAGEMENT
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="hidden sm:inline-block text-xs font-bold tracking-widest text-[#c3c5d9] uppercase">
            USER: {userName}
          </span>
          <Link href="/chat/agent/createAgent" className="bg-[#0052ff] hover:bg-[#0052ff]/80 text-[#dfe3ff] text-sm py-2 px-4 rounded-lg flex items-center space-x-1 transition-colors shadow-sm">
            <Plus className="w-[18px] h-[18px]" />
            <span className="font-medium">CREATE AGENT</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-8 h-8 border-4 border-[#0052ff] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[#c3c5d9] text-sm uppercase tracking-widest font-bold">Loading Agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-[#434656] rounded-2xl bg-[#1d1f29]/50">
            <Cpu className="w-12 h-12 text-[#434656] mb-4" />
            <h3 className="text-lg font-bold text-[#e1e1ef] mb-2">No Agents Online</h3>
            <p className="text-[#c3c5d9] text-sm max-w-md">You haven't initialized any custom agents yet. Create an agent to configure specialized capabilities and knowledge bases.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
                <div key={agent.id} className="bg-[#1d1f29] border border-[#434656] rounded-xl p-6 hover:border-[#b7c4ff] hover:bg-[#282934] transition-all group shadow-sm flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#0052ff]/10 flex items-center justify-center border border-[#0052ff]/30 group-hover:bg-[#0052ff] group-hover:text-white transition-colors relative">
                        <Cpu className="w-5 h-5 text-[#0052ff] group-hover:text-white" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-[#e1e1ef] uppercase tracking-wide">{agent.name}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-widest ${agent.is_public ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                            {agent.is_public ? 'PUBLIC' : 'PRIVATE'}
                          </span>
                        </div>
                        <p className="text-xs font-bold tracking-widest text-[#0052ff]">STATUS: {agent.status.toUpperCase()}</p>
                      </div>
                    </div>
                    {agent.user_id === userId && (
                      <button 
                        onClick={(e) => handleDeleteAgent(e, agent.id, agent.name)}
                        className="text-[#8d90a2] hover:text-[#ffb4ab] transition-colors p-1 z-10" 
                        title="Delete Agent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="text-xs font-bold tracking-widest text-[#c3c5d9] mb-1">AGENT PROFILE</p>
                      <p className="text-sm text-[#e1e1ef] line-clamp-2 leading-relaxed bg-[#11131c] p-2 rounded-md border border-[#434656]/50">
                        {agent.description || "Custom AI Agent"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#434656]/50 flex justify-end">
                    <Link href={`/chat?agent_id=${agent.id}&agent_name=${encodeURIComponent(agent.name)}`} className="text-[#0052ff] text-xs font-bold tracking-widest flex items-center group-hover:translate-x-1 transition-transform cursor-pointer hover:text-[#b7c4ff]">
                      CHAT WITH AGENT <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                    </Link>
                  </div>
                </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

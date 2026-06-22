'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { ArrowLeft, Cpu, UploadCloud, Loader2, Save, File, X } from 'lucide-react';

export default function CreateAgentPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('Loading...');
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    };
    initializeApp();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'text/csv', 'text/plain'];
      if (!validTypes.includes(selectedFile.type)) {
        alert('SYS_ERR: Invalid file type. Only PDF, CSV, and TXT allowed.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !prompt.trim() || !file) {
      alert("Please fill all fields and upload a knowledge base file.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('prompt', prompt);
      formData.append('user_id', user.id);
      formData.append('is_public', isPublic.toString());
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/agents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`Failed to initialize agent: ${errorDetail}`);
      }

      router.push('/chat/agents');
    } catch (error: any) {
      console.error("Agent creation error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#11131c] text-[#e1e1ef] min-h-screen flex flex-col font-sans">
      <header className="bg-[#11131c] shadow-sm z-10 sticky top-0 flex items-center w-full px-4 md:px-6 py-4 h-16 border-b border-[#434656]">
        <Link href="/chat/agents" className="text-[#c3c5d9] hover:text-[#e1e1ef] transition-colors p-2 hover:bg-[#282934] rounded-full mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-[#b7c4ff] uppercase">
          INITIALIZE_AGENT
        </h1>
      </header>

      <main className="flex-1 p-6 md:p-10 flex justify-center items-start">
        <div className="w-full max-w-2xl bg-[#1d1f29] border border-[#434656] rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#434656] bg-[#282934]/30 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-[#282934] flex items-center justify-center border border-[#434656]">
              <Cpu className="w-6 h-6 text-[#b7c4ff]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#e1e1ef]">Agent Configuration</h2>
              <p className="text-xs text-[#c3c5d9] tracking-widest uppercase">DEFINE PARAMETERS & KNOWLEDGE</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-xs font-bold tracking-widest text-[#c3c5d9] uppercase">
                Designation (Name)
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#11131c] border border-[#434656] rounded-xl px-4 py-3 text-sm text-[#e1e1ef] focus:outline-none focus:border-[#b7c4ff] focus:ring-1 focus:ring-[#b7c4ff] transition-all placeholder:text-[#c3c5d9]/50"
                placeholder="e.g. Threat Intelligence Analyst"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="prompt" className="block text-xs font-bold tracking-widest text-[#c3c5d9] uppercase">
                System Prompt (Directives)
              </label>
              <textarea
                id="prompt"
                required
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#11131c] border border-[#434656] rounded-xl px-4 py-3 text-sm text-[#e1e1ef] focus:outline-none focus:border-[#b7c4ff] focus:ring-1 focus:ring-[#b7c4ff] transition-all resize-none placeholder:text-[#c3c5d9]/50"
                placeholder="You are a strict code reviewer. Always respond in JSON format..."
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded border-[#434656] bg-[#11131c] text-[#0052ff] focus:ring-[#0052ff] focus:ring-offset-[#1d1f29] transition-colors cursor-pointer"
              />
              <label htmlFor="isPublic" className="text-sm font-bold tracking-wider text-[#e1e1ef] cursor-pointer">
                MAKE IT PUBLIC <span className="text-[#c3c5d9] font-normal text-xs ml-2 tracking-normal">(Visible to all users on the network)</span>
              </label>
            </div>

            <div className="space-y-2 pt-4">
              <label htmlFor="description" className="block text-xs font-bold tracking-widest text-[#c3c5d9] uppercase">
                Short Description
              </label>
              <input
                id="description"
                type="text"
                required
                maxLength={100}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#11131c] border border-[#434656] rounded-xl px-4 py-3 text-sm text-[#e1e1ef] focus:outline-none focus:border-[#b7c4ff] focus:ring-1 focus:ring-[#b7c4ff] transition-all placeholder:text-[#c3c5d9]/50"
                placeholder="e.g. Expert in identifying malware and network intrusions."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold tracking-widest text-[#c3c5d9] uppercase">
                Gold Dataset (Knowledge Base)
              </label>
              
              {!file ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#434656] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[#282934]/50 hover:border-[#b7c4ff] transition-all group"
                >
                  <UploadCloud className="w-8 h-8 text-[#8d90a2] group-hover:text-[#b7c4ff] mb-3 transition-colors" />
                  <p className="text-sm text-[#e1e1ef] font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-[#c3c5d9]">PDF, CSV, or TXT (Max 10MB)</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".pdf,.csv,.txt" 
                    className="hidden" 
                  />
                </div>
              ) : (
                <div className="w-full bg-[#11131c] border border-[#434656] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-[#282934] flex items-center justify-center shrink-0">
                      <File className="w-5 h-5 text-[#b7c4ff]" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-[#e1e1ef] truncate">{file.name}</p>
                      <p className="text-xs text-[#c3c5d9]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFile(null)}
                    className="p-2 text-[#8d90a2] hover:text-[#ffb4ab] transition-colors rounded-full hover:bg-[#282934] shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end border-t border-[#434656]">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !prompt.trim()}
                className="bg-[#0052ff] hover:bg-[#0052ff]/80 disabled:bg-[#282934] disabled:text-[#8d90a2] text-[#dfe3ff] text-sm py-2.5 px-6 rounded-lg flex items-center space-x-2 transition-all shadow-sm font-bold tracking-wide"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>INITIALIZING...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>INITIALIZE AGENT</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

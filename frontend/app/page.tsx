import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 font-sans text-gray-200 selection:bg-blue-500/30">
      
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            cyber_core <span className="text-blue-500">Studio</span>
          </h1>
          <p className="text-neutral-400 text-lg">
            Your private, locally hosted AI workspace. Log in to access your secure chat history.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link 
            href="/login" 
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-900/20"
          >
            Log In
          </Link>
          <Link 
            href="/register" 
            className="px-8 py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white font-medium rounded-xl transition-all"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
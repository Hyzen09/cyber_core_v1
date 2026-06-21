from supabase import create_client
import os

supabaseUrl = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://zuswmcqwudyhxbpxcoaw.supabase.co")
supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c3dtY3F3dWR5YnhicHhjb2F3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI0NTg4NCwiZXhwIjoyMDk2ODIxODg0fQ.L9GcPISzuZa8M8_5spid9XTu6dJjNEbcFdWNb7FYDwc"

supabase = create_client(supabaseUrl, supabaseKey)
res = supabase.table("chats").select("*").limit(1).execute()
if res.data:
    print(res.data[0].keys())
else:
    print("No chats")

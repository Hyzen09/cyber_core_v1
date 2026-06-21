import requests

url = "https://zuswmcqwudyhxbpxcoaw.supabase.co/rest/v1/agents?select=*"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c3dtY3F3dWR5YnhicHhjb2F3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI0NTg4NCwiZXhwIjoyMDk2ODIxODg0fQ.L9GcPISzuZa8M8_5spid9XTu6dJjNEbcFdWNb7FYDwc",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c3dtY3F3dWR5YnhicHhjb2F3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI0NTg4NCwiZXhwIjoyMDk2ODIxODg0fQ.L9GcPISzuZa8M8_5spid9XTu6dJjNEbcFdWNb7FYDwc"
}

r = requests.get(url, headers=headers)
print("Status Code:", r.status_code)
if r.status_code == 200:
    for a in r.json():
        print(f"Name: {a.get('name')}, user_id: {a.get('user_id')}, is_public: {a.get('is_public')}")
else:
    print(r.text)

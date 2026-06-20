'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase'; // Adjust this path if your supabase.ts is elsewhere

export default function TestSupabase() {
    const [status, setStatus] = useState<string>('Waiting to test...');
    const [testData, setTestData] = useState<any[]>([]);

    const testConnection = async () => {
        setStatus('Testing connection...');

        try {
            // 1. Try to insert a dummy chat session
            const { data: insertData, error: insertError } = await supabase
                .from('chats')
                .insert([{ title: 'Connection Test Chat' }])
                .select();

            if (insertError) throw insertError;

            // 2. Try to read it back from the database
            const { data: readData, error: readError } = await supabase
                .from('chats')
                .select('*')
                .limit(5);

            if (readError) throw readError;

            setTestData(readData);
            setStatus('✅ Connection Successful! Read & Write working.');
        } catch (error: any) {
            console.error(error);
            setStatus(`❌ Connection Failed: ${error.message}`);
        }
    };

    return (
        <div className="p-10 font-sans max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Supabase Connection Tester</h1>
            <button
                onClick={testConnection}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg mb-6 hover:bg-blue-700 font-medium"
            >
                Run Test
            </button>

            <div className="mb-6 text-lg font-medium">
                Status: <span className={status.includes('✅') ? 'text-green-600' : status.includes('❌') ? 'text-red-600' : 'text-gray-600'}>{status}</span>
            </div>

            {testData.length > 0 && (
                <div className="bg-gray-100 border p-4 rounded-lg">
                    <h2 className="font-bold mb-2 text-gray-700">Recent Chats in DB:</h2>
                    <pre className="text-sm overflow-auto text-gray-800">{JSON.stringify(testData, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
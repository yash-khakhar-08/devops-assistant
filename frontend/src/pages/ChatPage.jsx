import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, FileJson, Play, Settings } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5001/api';

export default function ChatPage() {
  const { envId: urlEnvId } = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentFiles, setCurrentFiles] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [envId, setEnvId] = useState(urlEnvId || null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const loadData = async (targetEnvId) => {
      try {
        const chatEndpoint = targetEnvId ? `${API_URL}/chat/${targetEnvId}` : `${API_URL}/chat`;
        const [accRes, chatRes] = await Promise.all([
          axios.get(`${API_URL}/accounts`),
          axios.get(chatEndpoint)
        ]);
        const accs = Array.isArray(accRes.data) ? accRes.data : [];
        setAccounts(accs);
        if (accs.length > 0 && !selectedAccountId) setSelectedAccountId(accs[0].id.toString());
        
        if (Array.isArray(chatRes.data)) {
            const msgs = chatRes.data.map(m => {
               let parsedFiles = null;
               try { parsedFiles = typeof m.files === 'string' ? JSON.parse(m.files) : m.files; } catch(e){}
               return {
                   role: m.role,
                   content: m.content,
                   files: parsedFiles,
                   plan: m.plan,
                   logs: m.logs
               };
            });
            setMessages(msgs);
            
            if (msgs.length > 0) {
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg.role === 'system' && lastMsg.files && !lastMsg.plan && !lastMsg.logs) {
                    setCurrentFiles(lastMsg.files);
                } else {
                    setCurrentFiles(null);
                }
            } else {
                setCurrentFiles(null);
            }
        }
      } catch (e) { console.error('Error loading chat/accounts', e); }
  };

  useEffect(() => {
    setEnvId(urlEnvId || null);
    loadData(urlEnvId || null);
  }, [urlEnvId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      await axios.post(`${API_URL}/chat/generate`, { prompt: userMsg.content, envId });
      await loadData(envId);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', content: 'Error generating terraform.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlan = async () => {
     if (loading) return;
     
     if (envId) {
         setLoading(true);
         try {
           const res = await axios.post(`${API_URL}/environments/replan/${envId}`, {
               tfFiles: currentFiles
           });
           setCurrentPlan(res.data.planDetails);
           // Refresh messages to show the plan
           await loadData(envId);
         } catch(err) {
           setMessages(prev => [...prev, { role: 'system', content: 'Error planning infrastructure.' }]);
         } finally {
           setLoading(false);
         }
     } else {
         if (!selectedAccountId) return alert('Please select a target AWS account.');
         const selectedAccount = accounts.find(a => a.id.toString() === selectedAccountId);
         if (!selectedAccount) return;
         
         setLoading(true);
         try {
           const res = await axios.post(`${API_URL}/environments/plan`, {
               name: `Env-${Date.now()}`,
               tfFiles: currentFiles,
               accountId: selectedAccount.id,
               region: selectedAccount.default_region
           });
           // Re-route to the newly created environment
           navigate(`/chat/${res.data.envId}`);
         } catch(err) {
           setMessages(prev => [...prev, { role: 'system', content: 'Error planning infrastructure.' }]);
         } finally {
           setLoading(false);
         }
     }
  };

  const handleApply = async () => {
    if (loading || !envId) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/environments/apply/${envId}`);
      setCurrentPlan(null);
      setCurrentFiles(null);
      await loadData(envId);
    } catch(err) {
      setMessages(prev => [...prev, { role: 'system', content: 'Error applying infrastructure.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      <div className="border-b border-gray-800 p-4 bg-gray-900 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-white font-bold">{envId ? `Modifying Environment: ${envId}` : 'New Deployment'}</span>
                <span className="text-gray-400 text-xs">{envId ? 'Direct integration with currently active deployment.' : 'Select an AWS account and provide your prompt.'}</span>
            </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-2xl p-4 ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 border border-gray-700 text-gray-200'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              
              {msg.files && (
                 <div className="mt-4 border border-gray-700 rounded-lg p-2 bg-gray-900">
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                      <FileJson className="w-4 h-4"/> Generated Files
                    </div>
                    {Object.keys(msg.files).map(filename => (
                        <div key={filename} className="mb-2">
                            <strong className="text-blue-400 text-xs">{filename}</strong>
                            <pre className="text-xs p-2 bg-black rounded overflow-x-auto text-green-400 mt-1">
                                {msg.files[filename]}
                            </pre>
                        </div>
                    ))}
                    {idx === messages.length - 1 && currentFiles && (
                        <div className="flex gap-2 mt-4">
                            <button disabled={loading} onClick={handlePlan} className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1 rounded text-sm transition">
                                {loading && !currentPlan && !msg.plan ? 'Running Plan...' : 'Run Terraform Plan'}
                            </button>
                        </div>
                    )}
                 </div>
              )}

              {msg.plan && (
                 <div className="mt-4 border border-blue-900 rounded-lg p-2 bg-black">
                     <p className="text-yellow-400 text-xs mb-2">Terraform Plan Preview:</p>
                     <pre className="text-xs text-gray-300 overflow-x-auto p-2">{msg.plan}</pre>
                     {idx === messages.length - 1 && !msg.logs && (
                         <div className="mt-4 flex gap-3">
                             <button disabled={loading} onClick={handleApply} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-2 rounded text-sm font-bold transition">
                                 {loading ? 'Applying...' : 'Confirm & Apply'}
                             </button>
                         </div>
                     )}
                 </div>
              )}

              {msg.logs && (
                  <div className="mt-4 border border-green-900 rounded-lg p-2 bg-black">
                     <p className="text-green-400 text-xs mb-2">Apply Logs:</p>
                     <pre className="text-xs text-gray-300 overflow-x-auto p-2">{msg.logs}</pre>
                 </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
            <div className="text-gray-500 text-sm animate-pulse">Processing...</div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900 flex flex-col gap-3">
        {!envId && accounts.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
             <span>Target AWS Account:</span>
             <select 
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none disabled:opacity-50"
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                disabled={loading}
             >
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.default_region})</option>)}
             </select>
          </div>
        )}
        <div className="flex bg-gray-800 rounded-lg border border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={envId ? "e.g. Add 1 more EC2 instance to this environment..." : "e.g. Create a VPC in ap-south-1 with 2 EC2 instances..."}
              className="flex-1 bg-transparent border-none p-4 text-white focus:outline-none disabled:opacity-50"
              disabled={loading}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition flex items-center justify-center"
            >
                <Send className="w-5 h-5"/>
            </button>
        </div>
      </div>
    </div>
  );
}

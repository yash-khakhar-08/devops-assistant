import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5001/api';

export default function EnvironmentsPage() {
  const [envs, setEnvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEnvs = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/environments`);
      setEnvs(data);
    } catch (error) {
      console.error('Failed to load envs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvs();
  }, []);

  const handleDestroy = async (envId) => {
      if(!window.confirm('Are you sure you want to destroy this environment?')) return;
      try {
          await axios.post(`${API_URL}/environments/destroy/${envId}`);
          fetchEnvs();
      } catch (err) {
          alert('Failed to destroy env');
      }
  };

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading Environments...</div>;

  return (
    <div className="p-8 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-8">
          Provisioned Environments
      </h2>
      
      {envs.length === 0 ? (
          <div className="text-gray-500 text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-800">
              No environments found. Go chat to create some infrastructure.
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {envs.map(env => (
                  <div key={env.env_id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg transition hover:border-gray-600">
                      <div 
                         className="p-5 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition flex items-center justify-between"
                         onClick={() => navigate(`/chat/${env.env_id}`)}
                      >
                          <div>
                              <h3 className="font-bold text-lg mb-1">{env.name}</h3>
                              <span className="text-xs text-blue-400 font-mono">{env.env_id}</span>
                          </div>
                          <ExternalLink className="w-5 h-5 text-gray-500"/>
                      </div>
                      <div className="p-5 space-y-3 text-sm text-gray-300">
                          <div className="flex justify-between">
                              <span className="text-gray-500">Account:</span>
                              <span>{env.account_name || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-500">Region:</span>
                              <span>{env.region}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                              <span className="text-gray-500">Status:</span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  env.status === 'applied' ? 'bg-green-900/50 text-green-400 border border-green-800' :
                                  env.status === 'destroyed' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                                  'bg-blue-900/50 text-blue-400 border border-blue-800'
                              }`}>
                                  {env.status.toUpperCase()}
                              </span>
                          </div>
                      </div>
                      <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex gap-2">
                          <button 
                              onClick={() => handleDestroy(env.env_id)}
                              disabled={['destroyed', 'destroying', 'applying', 'planning'].includes(env.status)}
                              className="flex items-center gap-2 justify-center flex-1 bg-red-900/50 hover:bg-red-900 text-red-300 py-2 rounded border border-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              <Trash2 className="w-4 h-4" />
                              Destroy
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}

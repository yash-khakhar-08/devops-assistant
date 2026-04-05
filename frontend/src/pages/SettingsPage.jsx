import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function SettingsPage() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ name: '', access_key: '', secret_key: '', default_region: 'us-east-1' });

  const fetchAccounts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/accounts`);
      setAccounts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/accounts`, form);
      setForm({ name: '', access_key: '', secret_key: '', default_region: 'us-east-1' });
      fetchAccounts();
    } catch (e) {
      alert('Error saving account');
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold mb-8">AWS Account Configuration</h2>
      
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 w-full max-w-2xl">
        <h3 className="text-xl font-semibold mb-4 text-blue-400">Add New Account</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm text-gray-400 mb-1">Account Name</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:ring-2 focus:border-transparent focus:ring-blue-500" placeholder="e.g. dev-account" />
              </div>
              <div>
                  <label className="block text-sm text-gray-400 mb-1">Default Region</label>
                  <input required value={form.default_region} onChange={e => setForm({...form, default_region: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:ring-2 focus:border-transparent focus:ring-blue-500" placeholder="e.g. ap-south-1" />
              </div>
          </div>
          <div>
              <label className="block text-sm text-gray-400 mb-1">Access Key ID</label>
              <input required value={form.access_key} onChange={e => setForm({...form, access_key: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:ring-2 focus:border-transparent focus:ring-blue-500 font-mono text-sm" />
          </div>
          <div>
              <label className="block text-sm text-gray-400 mb-1">Secret Access Key</label>
              <input type="password" required value={form.secret_key} onChange={e => setForm({...form, secret_key: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:ring-2 focus:border-transparent focus:ring-blue-500 font-mono text-sm" />
          </div>
          <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-medium flex items-center gap-2 transition">
              <Plus className="w-5 h-5"/> Save Account
          </button>
        </form>
      </div>

      <div className="w-full max-w-2xl">
          <h3 className="text-xl font-semibold mb-4 text-gray-300">Configured Accounts ({accounts.length})</h3>
          <div className="space-y-3">
              {accounts.map(acc => (
                  <div key={acc.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between border border-gray-700">
                      <div>
                          <div className="font-bold">{acc.name}</div>
                          <div className="text-xs text-gray-500 mt-1">Region: {acc.default_region}</div>
                      </div>
                      <div className="text-gray-500 text-sm">
                          Added: {new Date(acc.created_at).toLocaleDateString()}
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}

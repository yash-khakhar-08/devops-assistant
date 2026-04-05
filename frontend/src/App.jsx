import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home, Settings, Server, MessageSquare } from 'lucide-react';
import ChatPage from './pages/ChatPage';
import EnvironmentsPage from './pages/EnvironmentsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold text-blue-400 flex items-center gap-2">
              <Server className="w-5 h-5" />
              AI DevOps Copilot
            </h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link to="/" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-700 transition">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <span>Chat</span>
            </Link>
            <Link to="/environments" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-700 transition">
              <Server className="w-5 h-5 text-gray-400" />
              <span>Environments</span>
            </Link>
            <Link to="/settings" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-700 transition">
              <Settings className="w-5 h-5 text-gray-400" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/chat/:envId?" element={<ChatPage />} />
            <Route path="/environments" element={<EnvironmentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

import React from 'react';
import ChatWidget from './components/ai/ChatWidget';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">NexCore</h1>
        <p className="text-lg text-gray-600 mb-8">Plataforma de Gestão Inteligente</p>
      </div>
      <ChatWidget />
    </div>
  );
}
export default App;

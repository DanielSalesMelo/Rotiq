import React from 'react';
import { Button } from '@nexcore/ui-components';
import ChatWidget from './components/ai/ChatWidget'; // Importamos nosso novo componente

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">NexCore</h1>
        <p className="text-lg text-gray-600 mb-8">Sua plataforma de gestão 360°.</p>
        <Button>
          Botão do UI Components
        </Button>
      </div>

      {/* Adicionamos o Widget do Chat aqui */}
      {/* Ele será renderizado por cima de todo o conteúdo da aplicação */}
      <ChatWidget />
    </div>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { LayoutDashboard, LogOut, User } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('nexcore_user');
    const token = localStorage.getItem('nexcore_token');

    if (!storedUser || !token) {
      setLocation('/login');
      return;
    }

    setUser(JSON.parse(storedUser));
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('nexcore_token');
    localStorage.removeItem('nexcore_user');
    setLocation('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <LayoutDashboard className="h-6 w-6 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">NexCore</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <User className="h-4 w-4" />
            <span>{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </nav>

      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Login bem-sucedido!
            </h1>
            <p className="text-gray-600">
              Bem-vindo, <span className="font-semibold text-indigo-600">{user.name}</span> ao seu dashboard temporário.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Status</p>
                <p className="text-lg font-bold text-indigo-900">Ativo</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Perfil</p>
                <p className="text-lg font-bold text-green-900">Administrador</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Empresa</p>
                <p className="text-lg font-bold text-blue-900">Sede Global</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

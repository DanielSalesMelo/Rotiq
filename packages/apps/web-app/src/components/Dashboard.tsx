import { useEffect, useState } from 'react';
import { Card } from './Card';
import { Header } from './Header';

// Tipagem dos dados que virão das APIs
interface Ticket { id: string; title: string; status: string; }
interface Trip { id: string; origin: string; destination: string; status: string; }

// Ícones para os cards
const TicketIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 00-2-2H5z"></path></svg>;
const FleetIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1zM3 11h10"></path></svg>;

export function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    // Busca dados da API de TI
    fetch('http://localhost:3001/tickets' )
      .then(res => res.json())
      .then(data => setTickets(data))
      .catch(err => console.error("Falha ao buscar tickets de TI:", err));

    // Busca dados da API de Frota
    fetch('http://localhost:3002/trips' )
      .then(res => res.json())
      .then(data => setTrips(data))
      .catch(err => console.error("Falha ao buscar viagens:", err));
  }, []);

  const openTickets = tickets.filter(t => t.status === 'OPEN').length;
  const tripsInProgress = trips.filter(t => t.status === 'IN_PROGRESS').length;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Operacional</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card de TI Service Desk */}
          <Card title="TI Service Desk" count={tickets.length} icon={<TicketIcon />} buttonText="Novo Chamado">
            <p><strong>{openTickets}</strong> chamados em aberto.</p>
            <p>Último chamado: {tickets.length > 0 ? tickets[tickets.length - 1].title : 'N/A'}</p>
          </Card>

          {/* Card de Frota */}
          <Card title="Gestão de Frota" count={trips.length} icon={<FleetIcon />} buttonText="Nova Viagem">
             <p><strong>{tripsInProgress}</strong> viagens em andamento.</p>
             <p>Última viagem: {trips.length > 0 ? `${trips[trips.length - 1].origin} → ${trips[trips.length - 1].destination}` : 'N/A'}</p>
          </Card>

          {/* Card Placeholder para o próximo módulo */}
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-500">Próximo Módulo</h3>
            <p className="text-sm text-gray-400">(Ex: RH, Financeiro...)</p>
          </div>

        </div>
      </main>
    </div>
  );
}
export function Header() {
  return (
    <header className="bg-gray-800 text-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center">
        <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        <h1 className="text-2xl font-bold">NexCore</h1>
      </div>
      <div className="text-sm">
        <span>Bem-vindo, Daniel!</span>
      </div>
    </header>
   );
}
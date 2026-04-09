import React from 'react';

interface CardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  buttonText: string;
}

export function Card({ title, count, icon, children, buttonText }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
        <div className="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-4">{count}</p>
      <div className="flex-grow space-y-2 text-sm text-gray-600 mb-4">
        {children}
      </div>
      <button className="mt-auto bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
        {buttonText}
      </button>
    </div>
  );
}
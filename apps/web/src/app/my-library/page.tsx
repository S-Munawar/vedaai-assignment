'use client';

import { useState } from 'react';

export default function MyLibrary() {
  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold mb-4">My Library</h1>
      <p className="text-gray-600 mb-8">Browse and manage your resource library</p>
      
      <div className="mt-7">
        <input 
          type="text" 
          placeholder="Search library..." 
          className="px-4 py-2.5 rounded-md border border-gray-200 w-80 max-w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 mt-7">
        <ResourceCard category="Documents" count={0} />
        <ResourceCard category="Worksheets" count={0} />
        <ResourceCard category="Videos" count={0} />
        <ResourceCard category="Quizzes" count={0} />
        <ResourceCard category="Templates" count={0} />
        <ResourceCard category="Other Resources" count={0} />
      </div>
    </div>
  );
}

function ResourceCard({ category, count }: { category: string; count: number }) {
  return (
    <div className="p-5 border border-gray-200 rounded-lg bg-gray-50 text-center cursor-pointer transition-all duration-200 hover:shadow-lg">
      <h3 className="m-0 mb-2.5 text-gray-800 font-semibold text-base">{category}</h3>
      <p className="m-0 text-gray-400 text-2xl font-bold">{count}</p>
      <p className="mt-1 text-gray-400 text-xs">items</p>
    </div>
  );
}

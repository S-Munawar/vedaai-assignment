'use client';

import { useState } from 'react';

export default function Home() {
  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold mb-4">Welcome to VedaAI</h1>
      <p className="text-gray-600 mb-8">Your AI-powered teaching assistant platform</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-7">
        <Card title="My Groups" description="Manage and view your student groups" />
        <Card title="Assignments" description="View and manage assignments" />
        <Card title="Create Assignment" description="Create new assignments for your students" />
        <Card title="AI Teacher's Toolkit" description="Access AI-powered teaching tools" />
        <Card title="My Library" description="Browse your resource library" />
      </div>
    </div>
  );
}

function Card({ title, description }: { title: string; description: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="p-5 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 className="m-0 mb-2.5 text-gray-800 font-semibold">{title}</h3>
      <p className="m-0 text-gray-600 text-sm">{description}</p>
    </div>
  );
}

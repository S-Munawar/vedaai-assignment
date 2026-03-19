'use client';

import { useState } from 'react';

export default function AITeachersToolkit() {
  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold mb-4">AI Teacher's Toolkit</h1>
      <p className="text-gray-600 mb-8">Access powerful AI tools to enhance your teaching</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
        <ToolCard 
          title="Question Generator" 
          description="Generate questions and quizzes automatically"
        />
        <ToolCard 
          title="Content Assistant" 
          description="Create lesson plans and teaching materials"
        />
        <ToolCard 
          title="Grading Assistant" 
          description="Get AI-powered grading suggestions"
        />
        <ToolCard 
          title="Student Analytics" 
          description="Analyze student performance with AI insights"
        />
        <ToolCard 
          title="Feedback Generator" 
          description="Generate personalized feedback for students"
        />
        <ToolCard 
          title="Plagiarism Detector" 
          description="Check for originality in student work"
        />
      </div>
    </div>
  );
}

function ToolCard({ title, description }: { title: string; description: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="p-5 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 className="m-0 mb-2.5 text-gray-800 font-semibold text-base">{title}</h3>
      <p className="m-0 text-gray-600 text-sm">{description}</p>
      <button className="mt-3 px-3 py-1.5 bg-blue-600 text-white border-none rounded text-xs font-medium cursor-pointer w-full hover:bg-blue-700 transition-colors">
        Launch
      </button>
    </div>
  );
}

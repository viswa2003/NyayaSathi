import React from 'react';
import type { RelevantSection, NextSteps } from '../types';
import { BookOpenIcon, LightbulbIcon, ShieldIcon } from './icons'; // Assuming you have these icons

interface AIResponseCardProps {
  legalInformation: string;
  relevantSections: RelevantSection[];
  nextSteps: NextSteps;
}

const AIResponseCard: React.FC<AIResponseCardProps> = ({ legalInformation, relevantSections, nextSteps }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg max-w-xl text-gray-800">
      {/* Main Legal Information Summary */}
      <p className="mb-4 whitespace-pre-wrap">{legalInformation}</p>

      {/* Relevant Sections */}
      <div className="space-y-3 mb-4">
        <h3 className="font-bold text-lg flex items-center"><BookOpenIcon className="w-5 h-5 mr-2 text-blue-600"/>Relevant Sections</h3>
        {relevantSections.map((section, index) => (
          <details key={index} className="bg-white p-3 rounded-md shadow-sm">
            <summary className="font-semibold cursor-pointer text-blue-700">{`Section ${section.section_number}: ${section.section_title}`}</summary>
            <div className="mt-2 pt-2 border-t text-sm space-y-2">
              {/* Chapter removed: not present in current RelevantSection schema */}
              <p><strong className="text-gray-600">Simple Explanation:</strong> {section.simple_explanation}</p>
              <p className="font-mono text-xs bg-gray-50 p-2 rounded"><strong className="text-gray-600">Legal Text:</strong> {section.legal_text}</p>
              <p><strong className="text-gray-600">Punishment:</strong> {section.punishment}</p>
            </div>
          </details>
        ))}
      </div>

      {/* Next Steps */}
      <div className="space-y-3">
         <h3 className="font-bold text-lg flex items-center"><LightbulbIcon className="w-5 h-5 mr-2 text-yellow-500"/>Suggested Next Steps</h3>
         <p className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-3 rounded-r-lg text-sm">{nextSteps.suggestions}</p>

         <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-3 rounded-r-lg text-xs flex items-start">
            <ShieldIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"/>
            <p><strong className="font-semibold">Disclaimer:</strong> {nextSteps.disclaimer}</p>
         </div>
      </div>
    </div>
  );
};

export default AIResponseCard;
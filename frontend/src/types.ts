// src/types.ts

// Defines a user object, matching data from backend login/guest-login/GET /me
export interface User {
    id: string;
    username: string;
    email: string | null; // Email is null for guests
    role: 'user' | 'admin' | 'guest'; // Added guest role
}

// Defines a single legal section expected from the RAG API response.
// Match the keys in your backend's contextFromDB mapping and AI response schema.
export interface RelevantSection {
  // Optional identifiers for lookup/UI
  act_name?: string;
  law_code?: string;
  section_number: string;
  section_title: string;       // Matches 'title' from Law model / AI schema
  simple_explanation: string;  // Matches 'simplified_description' / AI schema
  legal_text?: string;          // Optional: present in some responses, else fetched via lookup
  punishment: string;
  // Optional fields if your backend includes them:
  // chapter?: string;
  // category?: string;
}

// Defines the complete RAG API response object expected by AdvicePage.
export interface AdviceData {
  legalInformation: string;
  relevantSections: RelevantSection[];
  nextSteps: {
    suggestions: string;
    disclaimer: string;
  };
}

// Interface for chat messages (if using ChatModal)
export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;           // For user messages and simple AI text
  // Optional structured data fields if chat uses RAG response directly
  legalInformation?: string;
  relevantSections?: RelevantSection[];
  nextSteps?: AdviceData['nextSteps']; // Use nested type for consistency
}

export type NextSteps = AdviceData['nextSteps'];
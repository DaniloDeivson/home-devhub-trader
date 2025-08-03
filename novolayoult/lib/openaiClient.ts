import OpenAI from 'openai';

// Check if OpenAI API key is available
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OpenAI API key not found. AI features will be disabled.');
}

// Create OpenAI client with v2 Assistants API header
export const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // Enable browser usage
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v2'
  }
}) : null;

// Configure default headers globally to ensure they're applied to all requests
if (openai) {
  openai.baseOptions = {
    headers: {
      'OpenAI-Beta': 'assistants=v2'
    }
  };
}
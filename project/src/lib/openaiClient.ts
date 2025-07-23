import OpenAI from 'openai';

// Create OpenAI client with v2 Assistants API header
export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Enable browser usage
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v2'
  }
});

// Configure default headers globally to ensure they're applied to all requests
openai.baseOptions = {
  headers: {
    'OpenAI-Beta': 'assistants=v2'
  }
};
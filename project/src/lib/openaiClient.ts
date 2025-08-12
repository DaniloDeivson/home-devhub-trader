// Frontend must not instantiate OpenAI client. All OpenAI calls should go through backend endpoints.
export const openai = null as unknown as never;
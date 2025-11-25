import dotenv from 'dotenv';

dotenv.config();

export const config = {
  groq: {
    apiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  },
  database: {
    path: process.env.DATABASE_PATH || './database.db'
  },
  port: process.env.PORT || 3000
};


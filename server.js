import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Proxy endpoint for OpenRouter to ensure server-side API calls
app.post('/api/chat', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let apiKey = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
    if (!apiKey) {
      apiKey = process.env.OPENROUTER_API_KEY || '';
    }

    if (!apiKey) {
      return res.status(401).json({
        error: {
          message: 'Missing OpenRouter API key. Please configure your OpenRouter API key in settings or set OPENROUTER_API_KEY.'
        }
      });
    }

    const { model, messages, max_tokens, temperature } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'VIVICA Voice Assistant'
      },
      body: JSON.stringify({
        model: model || 'deepseek/deepseek-chat:free',
        messages: messages || [],
        max_tokens: max_tokens || 300,
        temperature: temperature !== undefined ? temperature : 0.7
      })
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Server proxy error:', error);
    return res.status(500).json({
      error: {
        message: error.message || 'Internal server error while communicating with AI service'
      }
    });
  }
});

// Fallback to index.html for static routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

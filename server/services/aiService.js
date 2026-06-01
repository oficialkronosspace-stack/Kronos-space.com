const OpenAI = require('openai');

// Message returned to callers when AI is not configured
const AI_DISABLED_MSG = 'Las funciones de IA no estan disponibles. Configura OPENAI_API_KEY en el archivo .env para habilitar esta funcionalidad.';

class AIService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  init() {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('PENDIENTE')) {
      return;
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.initialized = true;
    console.log('✓ AI Service initialized');
  }

  // Internal: returns true when ready, false otherwise (caller handles gracefully)
  _isReady() {
    return this.initialized && this.client !== null;
  }

  async generateCaption(prompt, style = 'casual', language = 'es') {
    if (!this._isReady()) return AI_DISABLED_MSG;
    try {
      const styleMap = {
        casual: 'informal, amigable y cercano',
        professional: 'profesional y formal',
        funny: 'divertido y con humor',
        poetic: 'poetico y creativo',
        viral: 'viral, con hashtags y emojis'
      };
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `Eres un experto en redes sociales. Genera contenido en ${language === 'es' ? 'español' : 'inglés'} con estilo ${styleMap[style] || styleMap.casual}. Maximo 280 caracteres.` },
          { role: 'user', content: `Genera una publicacion para: ${prompt}` }
        ],
        max_tokens: 200,
        temperature: 0.8
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error('generateCaption error:', err.message);
      return AI_DISABLED_MSG;
    }
  }

  async generateImage(prompt, size = '1024x1024', quality = 'standard') {
    if (!this._isReady()) return null;
    try {
      const response = await this.client.images.generate({ model: 'dall-e-3', prompt, n: 1, size, quality });
      return response.data[0].url;
    } catch (err) {
      console.error('generateImage error:', err.message);
      return null;
    }
  }

  async generateImageVariants(prompt, count = 2) {
    if (!this._isReady()) return [];
    try {
      const response = await this.client.images.generate({ model: 'dall-e-2', prompt, n: count, size: '512x512' });
      return response.data.map(d => d.url);
    } catch (err) {
      console.error('generateImageVariants error:', err.message);
      return [];
    }
  }

  async analyzeSentiment(text) {
    if (!this._isReady()) {
      return { sentiment: 'neutral', toxicity: 0, emotions: [], safe: true };
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Analyzes text sentiment and toxicity. Respond ONLY in JSON: { "sentiment": "positive|neutral|negative", "toxicity": 0.0-1.0, "emotions": ["joy","anger",...], "safe": true|false }'
        },
        { role: 'user', content: text }
      ],
      max_tokens: 150,
      temperature: 0.1
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch {
      return { sentiment: 'neutral', toxicity: 0, emotions: [], safe: true };
    }
  }

  async generateProductDescription(productName, category, features = []) {
    if (!this._isReady()) return AI_DISABLED_MSG;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un copywriter experto en e-commerce. Genera descripciones de productos atractivas y persuasivas en español.'
        },
        {
          role: 'user',
          content: `Producto: ${productName}\nCategoria: ${category}\nCaracteristicas: ${features.join(', ')}\n\nGenera una descripcion de producto de 100-150 palabras.`
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });
    return response.choices[0].message.content;
  }

  async generateHashtags(content, count = 10) {
    if (!this._isReady()) return [];

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Generate trending hashtags. Respond ONLY with a JSON array of strings: ["#tag1", "#tag2"]' },
        { role: 'user', content: `Generate ${count} relevant hashtags for: ${content}` }
      ],
      max_tokens: 200,
      temperature: 0.6
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch {
      return [];
    }
  }

  async chatWithAssistant(messages, systemPrompt = null) {
    if (!this._isReady()) return AI_DISABLED_MSG;

    const systemMsg = systemPrompt || 'Eres KRONOS AI, el asistente inteligente de la plataforma KRONOS. Ayudas a los usuarios a crear contenido, gestionar su perfil y aprovechar al maximo la plataforma.';

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMsg },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  }

  // Generate story script (for Interactive Stories feature)
  async generateStoryScript(premise, genre, choices = 3) {
    if (!this._isReady()) {
      return {
        title: 'IA no disponible',
        scene: AI_DISABLED_MSG,
        choices: []
      };
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un escritor creativo. Genera una historia interactiva en español en formato JSON: { "title": "", "scene": "", "choices": [{"text": "", "consequence": ""}] }`
        },
        { role: 'user', content: `Genera una escena de historia con ${choices} opciones. Genero: ${genre}. Premisa: ${premise}` }
      ],
      max_tokens: 800,
      temperature: 0.9
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch {
      return { title: 'Historia', scene: response.choices[0].message.content, choices: [] };
    }
  }
}

const aiService = new AIService();
module.exports = aiService;

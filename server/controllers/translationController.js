const aiService = require('../services/aiService');

const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'ru', name: 'Русский' },
  { code: 'hi', name: 'हिन्दी' },
];

const callAI = async (systemPrompt, userContent) => {
  if (!aiService._isReady()) return null;
  const response = await aiService.client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    max_tokens: 1000,
    temperature: 0.1,
  });
  return response.choices[0].message.content.trim();
};

// GET /api/translation/languages
exports.getLanguages = (req, res) => {
  res.json({ success: true, languages: SUPPORTED_LANGUAGES });
};

// POST /api/translation/detect
exports.detectLanguage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text requerido' });

    if (!aiService._isReady()) {
      return res.json({ success: true, language: 'es', confidence: 0, aiDisabled: true });
    }

    const result = await callAI(
      'Detect the language of the following text. Respond ONLY with a JSON: {"language": "ISO-639-1 code", "name": "Language name in English", "confidence": 0.0-1.0}',
      text.slice(0, 500)
    );

    try {
      const parsed = JSON.parse(result);
      res.json({ success: true, ...parsed });
    } catch {
      res.json({ success: true, language: 'unknown', confidence: 0 });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/translation/translate
exports.translateText = async (req, res) => {
  try {
    const { text, targetLang, sourceLang } = req.body;
    if (!text || !targetLang) return res.status(400).json({ error: 'text y targetLang requeridos' });

    const target = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
    if (!target) return res.status(400).json({ error: `Idioma no soportado: ${targetLang}` });

    if (!aiService._isReady()) {
      return res.json({ success: true, translated: text, aiDisabled: true });
    }

    const systemPrompt = sourceLang
      ? `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. Return ONLY the translated text, no explanations.`
      : `You are a professional translator. Translate the following text to ${target.name} (${targetLang}). Return ONLY the translated text, no explanations.`;

    const translated = await callAI(systemPrompt, text);

    res.json({
      success: true,
      original: text,
      translated,
      sourceLang: sourceLang || 'auto',
      targetLang,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/translation/batch
exports.batchTranslate = async (req, res) => {
  try {
    const { texts, targetLang } = req.body;
    if (!Array.isArray(texts) || !targetLang) {
      return res.status(400).json({ error: 'texts (array) y targetLang requeridos' });
    }
    if (texts.length > 20) {
      return res.status(400).json({ error: 'Máximo 20 textos por batch' });
    }

    const target = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
    if (!target) return res.status(400).json({ error: `Idioma no soportado: ${targetLang}` });

    if (!aiService._isReady()) {
      return res.json({ success: true, results: texts.map(t => ({ original: t, translated: t })), aiDisabled: true });
    }

    const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join('\n');
    const systemPrompt = `Translate each numbered line to ${target.name} (${targetLang}). Return ONLY a JSON array of strings with the translations in order, no numbering: ["translation1", "translation2", ...]`;

    const result = await callAI(systemPrompt, numbered);

    let translations;
    try {
      translations = JSON.parse(result);
    } catch {
      translations = texts;
    }

    res.json({
      success: true,
      targetLang,
      results: texts.map((original, i) => ({
        original,
        translated: translations[i] || original,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/translation/history
exports.getHistory = async (req, res) => {
  // Translation history is not persisted (ephemeral by design)
  res.json({ success: true, history: [] });
};

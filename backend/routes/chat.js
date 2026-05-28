const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

router.post('/', async (req, res) => {
  const { systemPrompt, userMessage, message, events, mode, context } = req.body;

  // Legacy mode : frontend envoie message + events + mode + context
  const useLegacy = !systemPrompt && !userMessage;

  if (!useLegacy) {
    if (!systemPrompt) return res.status(400).json({ error: 'systemPrompt requis' });
    if (!userMessage) return res.status(400).json({ error: 'userMessage requis' });

    try {
      const groq = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      const { model = 'llama-3.3-70b-versatile', max_tokens = 800, temperature = 0.3 } = req.body.options || {};

      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens,
        temperature,
      });

      return res.json({ response: completion.choices[0].message.content });
    } catch (error) {
      console.error('Groq error:', error.message, error.status);
      if (error.status === 401) return res.status(500).json({ error: 'Clé API Groq invalide ou manquante' });
      if (error.status === 429) return res.status(500).json({ error: 'Quota API Groq dépassé. Réessaie plus tard.' });
      return res.status(500).json({ error: `Erreur IA (${error.status || '?'}) : ${error.message}` });
    }
  }

  // Legacy path — supprimé : le frontend utilise désormais llm.js
  return res.status(400).json({ error: 'Utilisez llm.js côté frontend avec systemPrompt + userMessage' });
});

module.exports = router;

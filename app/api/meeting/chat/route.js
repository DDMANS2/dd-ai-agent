import { NextResponse } from 'next/server';

function getLLMConfig() {
  if (process.env.CEREBRAS_API_KEY) {
    return { apiUrl: 'https://api.cerebras.ai/v1/chat/completions', apiKey: process.env.CEREBRAS_API_KEY, model: process.env.CEREBRAS_MODEL || 'llama-4-scout-17b-16e-instruct', format: 'openai' };
  }
  if (process.env.GROQ_API_KEY) {
    return { apiUrl: 'https://api.groq.com/openai/v1/chat/completions', apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', format: 'openai' };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return { apiUrl: 'https://api.anthropic.com/v1/messages', apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-sonnet-4-20250514', format: 'anthropic' };
  }
  if (process.env.OPENAI_API_KEY) {
    return { apiUrl: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1/chat/completions', apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-4o-mini', format: 'openai' };
  }
  return null;
}

export async function POST(request) {
  try {
    const { system, messages, max_tokens } = await request.json();
    const config = getLLMConfig();

    if (!config) {
      return NextResponse.json({ error: 'NO_SERVER_KEY' });
    }

    if (config.format === 'anthropic') {
      const res = await fetch(config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: config.model, max_tokens: max_tokens || 1500, system, messages }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); return NextResponse.json({ error: e?.error?.message || `API ${res.status}` }, { status: res.status }); }
      const data = await res.json();
      return NextResponse.json({ text: data.content.filter(c => c.type === 'text').map(c => c.text).join('\n') });
    } else {
      const res = await fetch(config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({ model: config.model, max_tokens: max_tokens || 1500, messages: [{ role: 'system', content: system }, ...messages] }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); return NextResponse.json({ error: e?.error?.message || `API ${res.status}` }, { status: res.status }); }
      const data = await res.json();
      return NextResponse.json({ text: data.choices?.[0]?.message?.content || '' });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const upstreams = [
  'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=ar&q=',
  'https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl=ar&q=',
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: { text?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const lang = typeof body.lang === 'string' ? body.lang : '';
  if (lang !== 'ar') return json({ error: 'unsupported_language' }, 400);
  if (!text) return json({ error: 'missing_text' }, 400);
  if (text.length > 220) return json({ error: 'text_too_long' }, 413);

  const encoded = encodeURIComponent(text);
  let lastStatus = 0;

  for (const base of upstreams) {
    try {
      const upstream = await fetch(base + encoded, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36',
          'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
          'Referer': 'https://translate.google.com/',
        },
      });
      lastStatus = upstream.status;
      if (!upstream.ok) continue;

      const bytes = await upstream.arrayBuffer();
      if (bytes.byteLength < 128) continue;

      return new Response(bytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      // Try the next upstream. The browser never talks to these hosts directly.
    }
  }

  return json({ error: 'tts_upstream_failed', status: lastStatus }, 502);
});

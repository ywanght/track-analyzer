export async function onRequest(context) {
  const { env } = context;
  const tiandituKey = (env.TIANDITU_KEY || '').trim();
  const thunderforestKey = (env.THUNDERFOREST_KEY || '').trim();

  return new Response(JSON.stringify({
    ok: true,
    tiandituKey,
    thunderforestKey
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  });
}

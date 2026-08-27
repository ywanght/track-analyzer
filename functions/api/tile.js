export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const service = url.searchParams.get('service');
  const z = url.searchParams.get('z');
  const x = url.searchParams.get('x');
  const y = url.searchParams.get('y');
  const r = url.searchParams.get('r') || '';
  const s = url.searchParams.get('s') || 'a';

  // 状态检测探针
  if (service === 'ping') {
    return new Response(JSON.stringify({
      ok: true,
      hasTianditu: !!env.TIANDITU_KEY,
      hasThunderforest: !!env.THUNDERFOREST_KEY,
      hasCarto: !!env.CARTO_KEY
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  if (!service || !z || !x || !y) {
    return new Response('Missing parameters (service, z, x, y)', { status: 400 });
  }

  let targetUrl = '';

  // Thunderforest 骑行 & 户外底图
  if (service === 'tf_cycle' && env.THUNDERFOREST_KEY) {
    targetUrl = `https://${s}.tile.thunderforest.com/cycle/${z}/${x}/${y}.png?apikey=${env.THUNDERFOREST_KEY}`;
  } else if (service === 'tf_outdoors' && env.THUNDERFOREST_KEY) {
    targetUrl = `https://${s}.tile.thunderforest.com/outdoors/${z}/${x}/${y}.png?apikey=${env.THUNDERFOREST_KEY}`;
  }
  // 天地图 影像 / 矢量 / 地形 + 注记
  else if (service === 'tdt_img' && env.TIANDITU_KEY) {
    targetUrl = `https://t${s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${env.TIANDITU_KEY}`;
  } else if (service === 'tdt_cia' && env.TIANDITU_KEY) {
    targetUrl = `https://t${s}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${env.TIANDITU_KEY}`;
  } else if (service === 'tdt_vec' && env.TIANDITU_KEY) {
    targetUrl = `https://t${s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${env.TIANDITU_KEY}`;
  } else if (service === 'tdt_cva' && env.TIANDITU_KEY) {
    targetUrl = `https://t${s}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${env.TIANDITU_KEY}`;
  } else if (service === 'tdt_ter' && env.TIANDITU_KEY) {
    targetUrl = `https://t${s}.tianditu.gov.cn/ter_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${env.TIANDITU_KEY}`;
  } else if (service === 'tdt_cta' && env.TIANDITU_KEY) {
    targetUrl = `https://t${s}.tianditu.gov.cn/cta_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${env.TIANDITU_KEY}`;
  }
  // CARTO
  else if (service === 'carto_voyager') {
    const keyParam = env.CARTO_KEY ? `?api_key=${env.CARTO_KEY}` : '';
    targetUrl = `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}${r}.png${keyParam}`;
  } else if (service === 'carto_dark') {
    const keyParam = env.CARTO_KEY ? `?api_key=${env.CARTO_KEY}` : '';
    targetUrl = `https://${s}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}${r}.png${keyParam}`;
  } else {
    return new Response('Service not found or corresponding API Key not set in Cloudflare Pages Environment Variables', { status: 404 });
  }

  try {
    const tileRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      cf: {
        cacheTtl: 604800, // 边缘缓存 7 天
        cacheEverything: true
      }
    });

    const headers = new Headers(tileRes.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');

    return new Response(tileRes.body, {
      status: tileRes.status,
      headers
    });
  } catch (err) {
    return new Response(`Tile Proxy Error: ${err.message}`, { status: 502 });
  }
}

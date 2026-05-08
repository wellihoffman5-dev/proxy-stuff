export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let targetUrl = searchParams.get('url');

  // Support direct path: /api/proxy/https://example.com
  if (!targetUrl) {
    const path = request.nextUrl.pathname.replace('/api/proxy/', '');
    if (path.startsWith('http')) targetUrl = path;
  }

  if (!targetUrl) {
    return new Response(`
      <h1>VaultX Proxy</h1>
      <p>Use: <code>?url=https://example.com</code></p>
    `, { 
      headers: { "Content-Type": "text/html" }
    });
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      redirect: "follow",
    });

    const newHeaders = new Headers(response.headers);

    // Remove headers that block iframe
    newHeaders.delete("X-Frame-Options");
    newHeaders.delete("Content-Security-Policy");
    newHeaders.delete("X-Content-Security-Policy");

    // Add CORS
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    newHeaders.set("Access-Control-Allow-Headers", "*");

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });

  } catch (err) {
    return new Response("Proxy Error: " + err.message, { status: 502 });
  }
}

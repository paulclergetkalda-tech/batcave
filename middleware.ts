import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Pas de cookie de session : inutile d'interroger Supabase
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  // Si Supabase ne répond pas (projet en pause, panne), on n'attend pas jusqu'à l'erreur 504 de Vercel :
  // on affiche une page claire.
  let user: { id: string } | null = null;
  if (hasSession) {
    const result = await Promise.race([
      supabase.auth.getUser().then((r) => ({ ok: true as const, user: r.data.user })),
      new Promise<{ ok: false }>((resolve) => setTimeout(() => resolve({ ok: false }), 6000)),
    ]).catch(() => ({ ok: false as const }));
    if (!result.ok) {
      console.error("[middleware] Supabase n'a pas répondu en 6 s");
      return new NextResponse(
        `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Batcav</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1220;color:#e4ebf5;font-family:system-ui,sans-serif;text-align:center;padding:24px">
<div><h1 style="font-weight:600;letter-spacing:-.03em">La Batcav fait une petite pause.</h1>
<p style="color:#8c9bb4">Le serveur met un peu de temps à répondre. Réessaie dans une minute.</p>
<p><a href="" style="color:#0b1220;background:#f4f7fb;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600">Réessayer</a></p></div></body></html>`,
        { status: 503, headers: { "content-type": "text/html; charset=utf-8", "retry-after": "30" } }
      );
    }
    user = result.user;
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

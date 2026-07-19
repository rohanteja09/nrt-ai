export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export interface WebSearchOutcome {
  formatted: string;
  results: SearchResult[];
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function formatResults(results: SearchResult[]): string {
  return results
    .map((r, i) => `${i + 1}. ${r.title}${r.url ? `\nURL: ${r.url}` : ""}${r.snippet ? `\n${r.snippet}` : ""}`)
    .join("\n\n");
}

/** DDG result hrefs are redirects like //duckduckgo.com/l/?uddg=<encoded-real-url>. */
function decodeDdgHref(href: string | null): string {
  if (!href) return "";
  try {
    const u = new URL(href, "https://duckduckgo.com");
    return u.searchParams.get("uddg") ?? u.toString();
  } catch {
    return "";
  }
}

/** Primary: DuckDuckGo HTML endpoint (sometimes blocks datacenter IPs). */
async function ddgHtml(query: string): Promise<SearchResult[]> {
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(6000),
  });
  // DDG returns 202 with a bot-challenge page instead of results; treat anything but 200 as a miss.
  if (res.status !== 200) return [];

  const results: SearchResult[] = [];
  let snippet = "";

  const rewriter = new HTMLRewriter()
    .on("a.result__a", {
      element(el) {
        results.push({ title: "", snippet: "", url: decodeDdgHref(el.getAttribute("href")) });
      },
      text(t) {
        if (results.length > 0) results[results.length - 1].title += t.text;
      },
    })
    .on("a.result__snippet", {
      text(t) {
        snippet += t.text;
        if (t.lastInTextNode) {
          if (results.length > 0) results[results.length - 1].snippet = snippet.trim();
          snippet = "";
        }
      },
    });

  await rewriter.transform(res).arrayBuffer();
  return results
    .map((r) => ({ ...r, title: r.title.trim() }))
    .filter((r) => r.title)
    .slice(0, 5);
}

/** Fallback 1: DuckDuckGo lite endpoint (different frontend, sometimes unblocked when html is). */
async function ddgLite(query: string): Promise<SearchResult[]> {
  const res = await fetch(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return [];

  const results: SearchResult[] = [];
  let snippet = "";

  const rewriter = new HTMLRewriter()
    .on("a.result-link", {
      element(el) {
        results.push({ title: "", snippet: "", url: decodeDdgHref(el.getAttribute("href")) });
      },
      text(t) {
        if (results.length > 0) results[results.length - 1].title += t.text;
      },
    })
    .on("td.result-snippet", {
      text(t) {
        snippet += t.text;
        if (t.lastInTextNode) {
          if (results.length > 0) results[results.length - 1].snippet = snippet.trim();
          snippet = "";
        }
      },
    });

  await rewriter.transform(res).arrayBuffer();
  return results
    .map((r) => ({ ...r, title: r.title.trim() }))
    .filter((r) => r.title)
    .slice(0, 5);
}

/** Fallback 2: Wikipedia search API (keyless, JSON, reliable from datacenter IPs). */
async function wikipedia(query: string): Promise<SearchResult[]> {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*" +
    `&srlimit=5&srsearch=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    query?: { search?: { title: string; snippet: string }[] };
  };
  return (data.query?.search ?? []).map((s) => ({
    title: `${s.title} (Wikipedia)`,
    snippet: s.snippet.replace(/<[^>]+>/g, ""),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/ /g, "_"))}`,
  }));
}

export async function webSearch(query: string): Promise<WebSearchOutcome> {
  const providers = [ddgHtml, ddgLite, wikipedia];
  for (const provider of providers) {
    try {
      const results = await provider(query);
      if (results.length > 0) return { formatted: formatResults(results), results };
    } catch {
      // try the next provider
    }
  }
  return { formatted: "No results found.", results: [] };
}

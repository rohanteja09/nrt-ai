export async function webSearch(query: string): Promise<string> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NRT-AI/1.0)" },
    });
  } catch {
    return "Web search failed: could not reach the search provider.";
  }
  if (!res.ok) return `Web search failed with status ${res.status}.`;

  const results: { title: string; snippet: string }[] = [];
  let title = "";
  let snippet = "";

  const rewriter = new HTMLRewriter()
    .on("a.result__a", {
      text(t) {
        title += t.text;
        if (t.lastInTextNode) {
          results.push({ title: title.trim(), snippet: "" });
          title = "";
        }
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

  const top = results.filter((r) => r.title).slice(0, 5);
  if (top.length === 0) return "No results found.";
  return top.map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}`).join("\n\n");
}

export async function browsePage(url: string): Promise<string> {
  let target: string;
  try {
    target = new URL(url).toString();
  } catch {
    return "That doesn't look like a valid URL.";
  }

  let res: Response;
  try {
    res = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NRT-AI/1.0)" },
    });
  } catch {
    return "Could not reach that URL.";
  }
  if (!res.ok) return `Failed to fetch page (status ${res.status}).`;

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return "That URL is not an HTML page.";

  let text = "";
  const rewriter = new HTMLRewriter()
    .on("script, style, nav, footer, header, noscript", {
      element(el) {
        el.remove();
      },
    })
    .on("body", {
      text(t) {
        text += t.text;
      },
    });

  await rewriter.transform(res).arrayBuffer();

  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.slice(0, 4000) || "No readable text found on that page.";
}

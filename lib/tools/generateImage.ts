export async function generateImage(env: CloudflareEnv, prompt: string): Promise<string> {
  const result = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
    prompt: prompt.slice(0, 2000),
    steps: 4,
  });
  const base64 = (result as { image?: string }).image;
  if (!base64) throw new Error("Image generation returned no data.");
  return `data:image/jpeg;base64,${base64}`;
}

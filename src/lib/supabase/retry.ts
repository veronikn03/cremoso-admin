export async function withRetry<T>(
  fn: () => Promise<{ data: T; error: { message?: string } | null }>,
  attempts = 3,
): Promise<{ data: T; error: { message?: string } | null }> {
  let result = await fn();
  for (let i = 1; i < attempts && result.error; i++) {
    await new Promise((r) => setTimeout(r, 250 * i));
    result = await fn();
  }
  return result;
}

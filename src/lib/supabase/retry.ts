export async function withRetry<T extends { error: { message?: string } | null }>(
  fn: () => PromiseLike<T>,
  attempts = 3,
): Promise<T> {
  let result = await fn();
  for (let i = 1; i < attempts && result.error; i++) {
    await new Promise((r) => setTimeout(r, 250 * i));
    result = await fn();
  }
  return result;
}

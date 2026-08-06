export const TEST_DB = "notes_app_test";

export function testDatabaseUrl(devUrl: string): string {
  const url = new URL(devUrl);
  url.pathname = `/${TEST_DB}`;
  return url.toString();
}

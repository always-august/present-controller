export type SearchParams = Record<string, string | string[] | undefined>;

export interface RoomPageProps {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<SearchParams>;
}

export function str(sp: SearchParams, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
}

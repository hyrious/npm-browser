
export const npmsSuggestions = new URL('https://api.npms.io/v2/search/suggestions');
npmsSuggestions.searchParams.set('q', ''); // query
npmsSuggestions.searchParams.set('size', '25'); // size

export type NpmsSuggestionsResponse = Array<{
  highlight: string; // @<em>vue</em>/reactivity
  package: { name: string; version: string; description: string };
}>;

export function isNpmsError(obj: unknown): string | undefined {
  if (obj && typeof obj === 'object' && 'code' in obj && 'message' in obj) {
    return (obj as { code: string; message: string }).message;
  }
}

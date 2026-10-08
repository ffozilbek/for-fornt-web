const cache = new Map<string, Intl.DisplayNames>();

export function countryName(
  code: string | undefined,
  lang: string,
  fallback: string,
): string {
  if (lang.startsWith("uz")) return fallback;
  if (!code) return fallback;
  try {
    let dn = cache.get(lang);
    if (!dn) {
      dn = new Intl.DisplayNames([lang], { type: "region" });
      cache.set(lang, dn);
    }
    const name = dn.of(code.toUpperCase());
    // Noma'lum kodda Intl kodning o'zini qaytaradi, u holda backend nomi yaxshiroq
    return !name || name === code.toUpperCase() ? fallback : name;
  } catch {
    return fallback;
  }
}

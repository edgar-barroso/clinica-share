/**
 * Decide se um item de menu está ativo dado o pathname atual.
 *
 * Regras:
 * 1. Match exato → ativo
 * 2. Pathname dentro do segmento (`startsWith("href/")`) → ativo
 *    ...mas só se nenhum outro item com href mais longo também bater.
 *
 * Sem (2 b), o item "raiz" de uma seção (ex: `/p`) ficaria ativo em
 * qualquer subrota como `/p/consultas`. Aqui o item mais específico vence.
 */
export function isNavItemActive(
  href: string,
  pathname: string,
  allHrefs: string[],
): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  return !allHrefs.some(
    (other) =>
      other !== href &&
      other.length > href.length &&
      (pathname === other || pathname.startsWith(`${other}/`)),
  );
}

// «Екатерина Волкова» → «ЕВ», «Демо-сотрудник» → «ДС» — для аватаров без фото
export function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

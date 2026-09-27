// Фон под стеклом: пять пятен света и тени и три наклонные линии скорости. Стили — .page-backdrop в globals.css
export function PageBackdrop() {
  return (
    <div aria-hidden className="page-backdrop">
      <i />
      <i />
      <i />
      <i />
      <i />
      <b />
      <b />
      <b />
    </div>
  );
}

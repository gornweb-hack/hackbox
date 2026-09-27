// Фон под стеклом: пять мягких пятен света и тени. Стили — .page-backdrop в globals.css
export function PageBackdrop() {
  return (
    <div aria-hidden className="page-backdrop">
      <i />
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}

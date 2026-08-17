/** Deterministic pseudo-QR shipping label rendered from an order id. */
export function QrLabel({ value, size = 84 }: { value: string; size?: number }) {
  const cells = 13;
  let hash = 7;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) % 100003;
  const bits: boolean[] = [];
  let h = hash;
  for (let i = 0; i < cells * cells; i++) {
    h = (h * 1103515245 + 12345) % 2147483648;
    bits.push((h >> 7) % 3 !== 0);
  }
  const isFinder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) =>
      r >= r0 && r < r0 + 3 && c >= c0 && c < c0 + 3;
    return inBox(0, 0) || inBox(0, cells - 3) || inBox(cells - 3, 0);
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${cells} ${cells}`} className="rounded-md bg-foreground p-0.5">
      {Array.from({ length: cells * cells }).map((_, i) => {
        const r = Math.floor(i / cells);
        const c = i % cells;
        const on = isFinder(r, c) ? true : bits[i];
        if (!on) return null;
        return <rect key={i} x={c} y={r} width={1} height={1} fill="currentColor" className="text-background" />;
      })}
    </svg>
  );
}

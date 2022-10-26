export function watchBoundingClientRect(el: HTMLElement, callback: (rect: DOMRect) => void) {
  let raf = 0;
  function update() {
    raf = requestAnimationFrame(update);
    callback(el.getBoundingClientRect());
  }
  update();
  return () => cancelAnimationFrame(raf);
}

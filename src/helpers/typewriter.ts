export function typewriter(node: HTMLInputElement, variants: string[]) {
  let timer = 0;
  let iter = generate();

  function update() {
    const { value, done } = iter.next();
    if (done) return;
    node.placeholder = value;
    timer = setTimeout(update, 50);
  }

  function* generate() {
    while (true) {
      for (const variant of variants) {
        for (let i = 1; i <= variant.length; i++) {
          const value = variant.slice(0, i);
          for (let j = 0; j < 3; ++j) {
            yield value;
          }
        }
        for (let i = 0; i < 30; ++i) {
          yield variant;
        }
        for (let i = variant.length; i >= 0; i--) {
          yield variant.slice(0, i);
        }
      }
    }
  }

  update();

  return () => {
    clearTimeout(timer);
  };
}

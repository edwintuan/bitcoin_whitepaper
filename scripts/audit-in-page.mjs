/**
 * The check behind `scripts/layout-audit.mjs` and the `audit:` action of
 * `scripts/shots.mjs`. The function is serialised and run inside the page, so
 * it must not use anything from this module's scope.
 */

/**
 * Runs in the page. Checks every piece of text under `rootSelector` against
 * the boxes around it and returns what is wrong.
 */
export function auditInPage(rootSelector) {
  const root = document.querySelector(rootSelector);
  if (!root) return [{ kind: 'missing', container: rootSelector, text: '' }];

  const found = [];
  const viewport = document.documentElement.clientWidth;
  const styles = new Map();
  const styleOf = (element) => {
    let style = styles.get(element);
    if (!style) styles.set(element, (style = getComputedStyle(element)));
    return style;
  };
  const nameOf = (element) => {
    const id = element.id ? `#${element.id}` : '';
    const classes =
      typeof element.className === 'string' && element.className.trim()
        ? `.${element.className.trim().split(/\s+/).slice(0, 3).join('.')}`
        : '';
    return `${element.tagName.toLowerCase()}${id}${classes}`;
  };
  const paints = (style) => {
    const background = style.backgroundColor;
    if (background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') return true;
    return ['Top', 'Right', 'Bottom', 'Left'].some(
      (side) => parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== 'none',
    );
  };
  const hidden = (element) => {
    for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
      const style = styleOf(node);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return true;
      if (node.classList.contains('visually-hidden') || node.inert) return true;
      // Clipped to nothing where it stands, as a skip link is until it has the focus.
      if (style.clipPath === 'inset(50%)') return true;
    }
    return false;
  };

  /* ---- contrast ---- */
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const pen = canvas.getContext('2d', { willReadFrequently: true });
  const colours = new Map();
  /** Any CSS colour as sRGB, alpha 0 to 1. */
  const rgba = (css) => {
    let colour = colours.get(css);
    if (!colour) {
      pen.clearRect(0, 0, 1, 1);
      pen.fillStyle = '#000';
      pen.fillStyle = css;
      pen.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = pen.getImageData(0, 0, 1, 1).data;
      colours.set(css, (colour = { r, g, b, a: a / 255 }));
    }
    return { ...colour };
  };
  const over = (top, under) => {
    const a = top.a + under.a * (1 - top.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    const mix = (x, y) => (x * top.a + y * under.a * (1 - top.a)) / a;
    return { r: mix(top.r, under.r), g: mix(top.g, under.g), b: mix(top.b, under.b), a };
  };
  const luminance = ({ r, g, b }) => {
    const linear = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };
  /**
   * The contrast of a piece of text with what is painted behind it, or null
   * where that cannot be told (a picture or gradient behind it).
   */
  const contrastOf = (element, rect) => {
    const style = styleOf(element);
    const svg = element.ownerSVGElement;
    let text = svg ? rgba(style.fill) : rgba(style.color);
    if (svg) text.a *= parseFloat(style.fillOpacity || '1');
    let ground = { r: 0, g: 0, b: 0, a: 0 };
    const fade = (alpha) => {
      text.a *= alpha;
      ground.a *= alpha;
    };
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    let box = element;
    if (svg) {
      // Up to the drawing: only opacity matters, then the last shape painted under the words.
      for (; box && box !== svg; box = box.parentElement) fade(parseFloat(styleOf(box).opacity));
      let under = null;
      for (const shape of svg.querySelectorAll('rect, circle, ellipse, path, polygon')) {
        if (!(shape.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        const shapeStyle = styleOf(shape);
        if (shapeStyle.fill === 'none' || shapeStyle.display === 'none' || shapeStyle.visibility === 'hidden') continue;
        const matrix = shape.getScreenCTM();
        if (!matrix) continue;
        const point = new DOMPoint(x, y).matrixTransform(matrix.inverse());
        if (shape.isPointInFill(point)) under = shape;
      }
      if (under) {
        const shapeStyle = styleOf(under);
        const fill = rgba(shapeStyle.fill);
        fill.a *= parseFloat(shapeStyle.fillOpacity || '1');
        for (let node = under; node && node !== svg; node = node.parentElement) fill.a *= parseFloat(styleOf(node).opacity);
        text = over(text, fill);
        ground = over(ground, fill);
      }
    }
    for (; box && box !== document.documentElement; box = box.parentElement) {
      const boxStyle = styleOf(box);
      if (boxStyle.backgroundImage !== 'none') return null;
      // A backdrop laid behind the words by a sibling: a sliding pill, a bar, a band.
      for (const child of box.children) {
        if (child.contains(element)) continue;
        const childStyle = styleOf(child);
        if (childStyle.position !== 'absolute' || childStyle.display === 'none' || childStyle.visibility === 'hidden') continue;
        const area = child.getBoundingClientRect();
        if (x < area.left || x > area.right || y < area.top || y > area.bottom) continue;
        const backdrop = rgba(childStyle.backgroundColor);
        backdrop.a *= parseFloat(childStyle.opacity);
        text = over(text, backdrop);
        ground = over(ground, backdrop);
      }
      const background = rgba(boxStyle.backgroundColor);
      text = over(text, background);
      ground = over(ground, background);
      fade(parseFloat(boxStyle.opacity));
    }
    const page = rgba(getComputedStyle(document.body).backgroundColor);
    const white = { r: 255, g: 255, b: 255, a: 1 };
    text = over(over(text, page), white);
    ground = over(over(ground, page), white);
    const [light, dark] = [luminance(text), luminance(ground)].sort((a, b) => b - a);
    return (light + 0.05) / (dark + 0.05);
  };

  // Something fading or popping in is measured once it has arrived, not on the way.
  const moving = new Set(
    document
      .getAnimations()
      .filter((animation) => animation.playState === 'running')
      .map((animation) => animation.effect?.target)
      .filter(Boolean),
  );
  const inMotion = (element) => {
    for (let node = element; node; node = node.parentElement) if (moving.has(node)) return true;
    return false;
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue.replace(/\s+/g, ' ').trim();
    const element = node.parentElement;
    if (!text || !element || element.closest('script, style, title, desc') || hidden(element)) continue;

    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((rect) => rect.width > 0.5 && rect.height > 0.5);
    if (rects.length === 0) continue;
    const left = Math.min(...rects.map((rect) => rect.left));
    const right = Math.max(...rects.map((rect) => rect.right));
    const top = Math.min(...rects.map((rect) => rect.top));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    const report = (kind, container, extra = '') =>
      found.push({ kind, container, text: text.slice(0, 48), by: extra, element: nameOf(element) });

    // Size as shown: words in a drawing are scaled with it.
    const style = styleOf(element);
    const matrix = element.ownerSVGElement && element.getScreenCTM ? element.getScreenCTM() : null;
    const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 1;
    const size = parseFloat(style.fontSize) * scale;
    const shifted = element.closest('sup, sub') || (element.tagName === 'tspan' && (element.hasAttribute('dy') || element.hasAttribute('baseline-shift')));
    const floor = shifted ? 9 : 11;
    if (size < floor - 0.05) report('small', nameOf(element), `${size.toFixed(1)}px`);

    // WCAG AA: 4.5 to 1, or 3 to 1 for large text. A control that is switched off is exempt.
    if (!element.closest('[aria-disabled="true"], :disabled, [data-disabled]') && !inMotion(element)) {
      const ratio = contrastOf(element, rects[0]);
      const heavy = Number(style.fontWeight) >= 700 || /^"?Anton/.test(style.fontFamily);
      const large = size >= 24 || (size >= 18.66 && heavy);
      if (ratio !== null && ratio < (large ? 3 : 4.5) - 0.01) {
        report('contrast', nameOf(element), `${ratio.toFixed(2)}:1${large ? ' (large)' : ''}`);
      }
    }

    let inScroller = false;
    let clipped = false;
    for (let box = element; box && box !== document.documentElement; box = box.parentElement) {
      const boxStyle = styleOf(box);
      if (boxStyle.display === 'inline' || boxStyle.display === 'contents') continue;
      const overflowX = boxStyle.overflowX;
      if (overflowX === 'auto' || overflowX === 'scroll') {
        inScroller = true;
        break; // content of a sideways scroller may be wider than it
      }
      const rect = box.getBoundingClientRect();
      const outX = Math.max(right - rect.right, rect.left - left);
      const outY = Math.max(bottom - rect.bottom, rect.top - top);
      const clipsX = overflowX === 'hidden' || overflowX === 'clip';
      const clipsY = boxStyle.overflowY === 'hidden' || boxStyle.overflowY === 'clip';
      if (clipsX && outX > 1) {
        const ellipsis = boxStyle.textOverflow === 'ellipsis' || styleOf(element).textOverflow === 'ellipsis';
        report(ellipsis ? 'ellipsis' : 'cut-off', nameOf(box), `${outX.toFixed(0)}px`);
        clipped = true;
        break;
      }
      if (clipsY && outY > 2) {
        report('cut-off', nameOf(box), `${outY.toFixed(0)}px down`);
        clipped = true;
        break;
      }
      if (!clipsX && paints(boxStyle) && outX > 1) {
        report('sticks-out', nameOf(box), `${outX.toFixed(0)}px`);
        break;
      }
    }
    if (!inScroller && !clipped && (right > viewport + 1 || left < -1)) report('off-screen', 'viewport', `${(right - viewport).toFixed(0)}px`);
  }
  return found;
}

/**
 * Runs in the page. When the page is wider than the window, names what makes
 * it so: the innermost elements that reach past the right edge and are not
 * inside something that scrolls sideways by design.
 */
export function widestInPage() {
  const viewport = document.documentElement.clientWidth;
  const past = [];
  for (const element of document.body.querySelectorAll('*')) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.right <= viewport + 1) continue;
    let scrolls = false;
    for (let box = element.parentElement; box; box = box.parentElement) {
      const overflow = getComputedStyle(box).overflowX;
      if (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden' || overflow === 'clip') {
        scrolls = box !== document.body && box !== document.documentElement;
        if (scrolls) break;
      }
    }
    if (scrolls || getComputedStyle(element).position === 'fixed') continue;
    past.push(element);
  }
  // Keep the innermost: an element whose child is also past the edge is only its container.
  return past
    .filter((element) => !past.some((other) => other !== element && element.contains(other)))
    .slice(0, 4)
    .map((element) => {
      const classes = typeof element.className === 'string' && element.className.trim() ? `.${element.className.trim().split(/\s+/).slice(0, 3).join('.')}` : '';
      return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${classes} +${Math.round(element.getBoundingClientRect().right - viewport)}px`;
    });
}

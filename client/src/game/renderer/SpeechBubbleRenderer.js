/**
 * SpeechBubbleRenderer - Pure canvas drawing for on-map entity speech bubbles.
 *
 * Bubbles are anchored to a world tile (x, y) and drawn ABOVE that tile with a
 * downward tail pointing at it. Drawing happens inside the same camera-translated
 * context used by EffectRenderer, so tileSize is the already-zoom/DPR-scaled
 * physical tile size and world coords map straight to on-screen pixels.
 */
export const SpeechBubbleRenderer = {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x:number,y:number,speaker?:string,text:string}} bubble
   * @param {number} tileSize - physical px per tile (zoom * dpr already applied)
   * @param {number} currentTime - performance.now(), for the pop-in animation
   */
  renderBubble: (ctx, bubble, tileSize, currentTime) => {
    const text = (bubble.text || '').trim();
    if (!text) return;

    // Pop-in: scale/fade over the first 160ms after the bubble becomes active.
    const appearedAt = bubble.appearedAt || currentTime;
    const progress = Math.min(1, (currentTime - appearedAt) / 160);
    const ease = 1 - Math.pow(1 - progress, 3);
    const scale = 0.85 + 0.15 * ease;
    const alpha = ease;

    const anchorX = bubble.x * tileSize + tileSize / 2;
    const anchorTop = bubble.y * tileSize; // top edge of the anchor tile

    // Typography scales with tile size but is clamped so it stays legible when
    // zoomed way out and doesn't get comically huge when zoomed in.
    const fontSize = Math.max(11, Math.min(20, Math.round(tileSize * 0.34)));
    const speakerSize = Math.max(10, Math.round(fontSize * 0.82));
    const pad = Math.round(fontSize * 0.6);
    const lineH = Math.round(fontSize * 1.28);
    const tail = Math.round(fontSize * 0.7);
    const gap = Math.round(fontSize * 0.35); // gap between tail tip and tile
    const maxTextWidth = Math.max(tileSize * 3, fontSize * 16);

    ctx.save();

    // Wrap text.
    ctx.font = `${fontSize}px sans-serif`;
    const lines = SpeechBubbleRenderer._wrap(ctx, text, maxTextWidth);

    // Measure widest content line (body + speaker).
    let contentW = 0;
    for (const l of lines) contentW = Math.max(contentW, ctx.measureText(l).width);
    let speaker = (bubble.speaker || '').trim();
    if (speaker) {
      ctx.font = `bold ${speakerSize}px sans-serif`;
      contentW = Math.max(contentW, ctx.measureText(speaker).width);
    }

    const boxW = Math.ceil(contentW + pad * 2);
    const speakerH = speaker ? Math.round(speakerSize * 1.4) : 0;
    const boxH = speakerH + lines.length * lineH + pad * 2;

    // Position: bubble sits above the tile, its tail tip just above the tile top.
    const tipX = anchorX;
    const tipY = anchorTop - gap;
    const boxBottom = tipY - tail;
    let boxLeft = Math.round(tipX - boxW / 2);
    const boxTop = Math.round(boxBottom - boxH);

    // Apply pop-in transform around the tail tip so it grows from the entity.
    ctx.globalAlpha = alpha;
    ctx.translate(tipX, tipY);
    ctx.scale(scale, scale);
    ctx.translate(-tipX, -tipY);

    // Bubble body (rounded rect) + tail as a single filled path.
    const r = Math.min(8, boxH / 3);
    ctx.beginPath();
    ctx.moveTo(boxLeft + r, boxTop);
    ctx.lineTo(boxLeft + boxW - r, boxTop);
    ctx.arcTo(boxLeft + boxW, boxTop, boxLeft + boxW, boxTop + r, r);
    ctx.lineTo(boxLeft + boxW, boxBottom - r);
    ctx.arcTo(boxLeft + boxW, boxBottom, boxLeft + boxW - r, boxBottom, r);
    // Right side of tail base
    ctx.lineTo(tipX + tail * 0.6, boxBottom);
    ctx.lineTo(tipX, tipY); // tail tip
    ctx.lineTo(tipX - tail * 0.6, boxBottom); // left side of tail base
    ctx.lineTo(boxLeft + r, boxBottom);
    ctx.arcTo(boxLeft, boxBottom, boxLeft, boxBottom - r, r);
    ctx.lineTo(boxLeft, boxTop + r);
    ctx.arcTo(boxLeft, boxTop, boxLeft + r, boxTop, r);
    ctx.closePath();

    ctx.fillStyle = 'rgba(250, 250, 245, 0.97)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = Math.round(tileSize * 0.12);
    ctx.shadowOffsetY = Math.round(tileSize * 0.04);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = Math.max(1, Math.round(tileSize * 0.03));
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
    ctx.stroke();

    // Text.
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let ty = boxTop + pad;
    if (speaker) {
      ctx.font = `bold ${speakerSize}px sans-serif`;
      ctx.fillStyle = '#7a3b12';
      ctx.fillText(speaker, boxLeft + pad, ty);
      ty += speakerH;
    }
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = '#111';
    for (const l of lines) {
      ctx.fillText(l, boxLeft + pad, ty);
      ty += lineH;
    }

    ctx.restore();
  },

  /** Greedy word-wrap against a pixel width. Assumes ctx.font is already set. */
  _wrap: (ctx, text, maxWidth) => {
    const words = text.split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [text];
  }
};

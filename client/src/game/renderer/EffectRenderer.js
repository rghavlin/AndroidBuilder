/**
 * EffectRenderer - Pure functions for visual effect rendering (damage, flashes, text)
 */
export const EffectRenderer = {
  /**
   * High-level entry point for drawing a visual effect
   */
  renderEffect: (ctx, effect, tileSize, currentTime) => {
    const elapsed = currentTime - effect.startTime;
    const progress = Math.min(1, elapsed / effect.duration);
    const screenX = effect.x * tileSize;
    const screenY = effect.y * tileSize;

    ctx.save();
    switch (effect.type) {
      case 'damage':
        EffectRenderer.renderDamageText(ctx, effect, screenX, screenY, tileSize, progress);
        break;
      case 'tile_flash':
        EffectRenderer.renderTileFlash(ctx, effect, screenX, screenY, tileSize, progress);
        break;
      case 'heal':
        EffectRenderer.renderHealText(ctx, effect, screenX, screenY, tileSize, progress);
        break;
      default:
        console.warn(`[EffectRenderer] Unknown effect type: ${effect.type}`);
    }
    ctx.restore();
  },

  /**
   * Render floating damage text
   */
  renderDamageText: (ctx, effect, x, y, tileSize, progress) => {
    const easeProgress = 1 - Math.pow(1 - progress, 2); // Quad Ease Out
    const driftY = -tileSize * 0.8 * easeProgress;
    const opacity = 1 - progress;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = effect.color || '#f00';
    ctx.font = `bold ${Math.floor(tileSize * 0.4)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(effect.value, x + tileSize / 2, y + tileSize / 2 + driftY);
  },

  /**
   * Render tile flash (e.g., from smashing window)
   */
  renderTileFlash: (ctx, effect, x, y, tileSize, progress) => {
    const opacity = 1 - progress;
    ctx.fillStyle = effect.color || 'rgba(255, 255, 255, 0.5)';
    ctx.globalAlpha = opacity;
    ctx.fillRect(x, y, tileSize, tileSize);
  },

  /**
   * Render floating heal text
   */
  renderHealText: (ctx, effect, x, y, tileSize, progress) => {
    const easeProgress = 1 - Math.pow(1 - progress, 2);
    const driftY = -tileSize * 0.8 * easeProgress;
    const opacity = 1 - progress;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#0f0';
    ctx.font = `bold ${Math.floor(tileSize * 0.4)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`+${effect.value}`, x + tileSize / 2, y + tileSize / 2 + driftY);
  }
};

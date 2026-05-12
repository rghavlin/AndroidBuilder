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
      case 'projectile':
        EffectRenderer.renderProjectile(ctx, effect, tileSize, progress);
        break;
      case 'flicker':
        EffectRenderer.renderFlicker(ctx, effect, screenX, screenY, tileSize, progress);
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
  },

  /**
   * Render moving projectile (e.g. Spitter spit)
   */
  renderProjectile: (ctx, effect, tileSize, progress) => {
    const { x, y, targetX, targetY, color = '#a855f7' } = effect;
    
    // Interpolate position
    const curX = x + (targetX - x) * progress;
    const curY = y + (targetY - y) * progress;
    
    // Convert to screen space
    const sx = curX * tileSize + tileSize / 2;
    const sy = curY * tileSize + tileSize / 2;
    
    // Add a slight arc (parabola)
    const arcHeight = tileSize * 0.5;
    const arcY = -Math.sin(progress * Math.PI) * arcHeight;
    
    // Draw projectile
    ctx.fillStyle = color;
    ctx.shadowBlur = 4;
    ctx.shadowColor = color;
    
    ctx.beginPath();
    ctx.arc(sx, sy + arcY, tileSize / 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw trail
    if (progress > 0.1) {
        ctx.globalAlpha = 0.4;
        const prevX = x + (targetX - x) * (progress - 0.05);
        const prevY = y + (targetY - y) * (progress - 0.05);
        const psx = prevX * tileSize + tileSize / 2;
        const psy = prevY * tileSize + tileSize / 2;
        const parcY = -Math.sin((progress - 0.05) * Math.PI) * arcHeight;
        
        ctx.beginPath();
        ctx.arc(psx, psy + parcY, tileSize / 10, 0, Math.PI * 2);
        ctx.fill();
    }
  },

  /**
   * Render flickering overlay (used when an entity attacks)
   */
  renderFlicker: (ctx, effect, x, y, tileSize, progress) => {
    // 3 blinks in the duration
    const blinkCount = 3;
    const isVisible = Math.floor(progress * blinkCount * 2) % 2 === 0;
    
    if (isVisible) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }
};

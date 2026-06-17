/**
 * RoadNetwork - roads as data, not pixels.
 *
 * Holds an axis-aligned segment list that mixes deterministic "authored"
 * segments (a fixed spine you pin per map) with procedurally "grown" branch
 * segments coming off them. Rasterizing runs the existing MapBuilder.drawRoad
 * per segment; because drawRoad is additive and self-merging, junctions form
 * automatically and branches connect to whatever they grow from.
 *
 * Design notes:
 *  - Segments are axis-aligned only (horizontal or vertical) so buildings keep
 *    their cardinal `frontage` when zoning runs along them later.
 *  - Branch growth takes an injected `random` fn so layouts are reproducible and
 *    tests are deterministic (the rest of the codebase uses bare Math.random()).
 *  - Branch growth reads the builder's painted terrain to enforce spacing and to
 *    stop at (or connect into) existing roads, so it never needs a separate
 *    geometry model to detect collisions.
 */

/** Small deterministic PRNG (mulberry32). Returns a function in [0, 1). */
export function makeSeededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RoadNetwork {
  constructor(width, height, { random = Math.random, roadThickness = 5, sidewalkThickness = 1 } = {}) {
    this.width = width;
    this.height = height;
    this.random = random;
    this.roadThickness = roadThickness;
    this.sidewalkThickness = sidewalkThickness;
    /** @type {Array<{x1,y1,x2,y2,kind,orientation,depth}>} normalized (x1<=x2, y1<=y2) */
    this.segments = [];
  }

  /** Half-width (road+sidewalk) on each side of a centerline for a given thickness. */
  _halfSpanFor(thickness, sidewalkThickness) {
    return Math.floor(thickness / 2) + sidewalkThickness;
  }

  /** Default branch half-width (road+sidewalk) on each side of a centerline. */
  get halfSpan() {
    return this._halfSpanFor(this.roadThickness, this.sidewalkThickness);
  }

  /**
   * Record an axis-aligned segment. Does not paint; call rasterize() for that.
   * Per-segment thickness lets a wide central road coexist with thinner branches.
   * @param {Object} [opts] { thickness, sidewalkThickness } overrides for this segment
   * @returns the stored segment object.
   */
  addSegment(p1, p2, kind = 'authored', depth = 0, opts = {}) {
    if (p1.x !== p2.x && p1.y !== p2.y) {
      throw new Error(`[RoadNetwork] segment must be axis-aligned: (${p1.x},${p1.y})->(${p2.x},${p2.y})`);
    }
    const seg = {
      x1: Math.min(p1.x, p2.x),
      y1: Math.min(p1.y, p2.y),
      x2: Math.max(p1.x, p2.x),
      y2: Math.max(p1.y, p2.y),
      kind,
      orientation: p1.x === p2.x ? 'vertical' : 'horizontal',
      depth,
      thickness: opts.thickness ?? this.roadThickness,
      sidewalkThickness: opts.sidewalkThickness ?? this.sidewalkThickness
    };
    this.segments.push(seg);
    return seg;
  }

  /** Paint every recorded segment onto the builder via drawRoad. Idempotent. */
  rasterize(builder) {
    for (const s of this.segments) this._paintSegment(builder, s);
  }

  /** Paint a single segment using its own thickness. */
  _paintSegment(builder, s) {
    builder.drawRoad({ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }, s.thickness, s.sidewalkThickness);
  }

  _randInt(min, max) {
    return min + Math.floor(this.random() * (max - min + 1));
  }

  /**
   * Grow branch roads off existing segments. Requires the builder to already
   * have the current segments painted (so collision/spacing checks see them).
   * Accepted branches are painted and recorded immediately so later branches
   * space off them too.
   *
   * @param {MapBuilder} builder
   * @param {Object} opts
   * @param {number} opts.count        target number of branches to add
   * @param {[number,number]} opts.lengthRange  [min,max] centerline length beyond the source road
   * @param {number} [opts.spacing=3]   min grass tiles required beside a branch
   * @param {number} [opts.maxDepth=2]  how many generations of branches-off-branches
   * @param {boolean} [opts.allowLoops=true]  let a branch connect into a road it runs into
   * @param {number} [opts.margin=2]    keep branches this far from the map border
   * @returns {number} branches actually placed
   */
  growBranches(builder, opts = {}) {
    const {
      count = 6,
      lengthRange = [6, 16],
      spacing = 3,
      maxDepth = 2,
      allowLoops = true,
      margin = 2
    } = opts;

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 40 + 50;

    while (placed < count && attempts < maxAttempts) {
      attempts++;
      const sources = this.segments.filter(s => s.depth < maxDepth);
      if (sources.length === 0) break;
      const source = sources[Math.floor(this.random() * sources.length)];

      const branch = this._tryBranch(builder, source, { lengthRange, spacing, allowLoops, margin });
      if (branch) {
        this.segments.push(branch);
        this._paintSegment(builder, branch);
        placed++;
      }
    }
    return placed;
  }

  /**
   * Attempt to grow one branch off `source`. Returns a segment object (already
   * normalized) on success, or null. Does not record/paint — caller does.
   */
  _tryBranch(builder, source, { lengthRange, spacing, allowLoops, margin }) {
    // The branch uses the network's default thickness; the walk must start
    // outside the SOURCE road's (possibly wider) footprint so we don't mistake
    // the source's own pavement for a head-on collision.
    const branchHalf = this.halfSpan;
    const sourceHalf = this._halfSpanFor(source.thickness, source.sidewalkThickness);
    const minLen = lengthRange[0];
    const maxLen = this._randInt(lengthRange[0], lengthRange[1]);

    // Pick a point along the source centerline, kept clear of its ends.
    const inset = Math.max(sourceHalf, branchHalf) + 1;
    let sx, sy;
    if (source.orientation === 'horizontal') {
      const lo = source.x1 + inset, hi = source.x2 - inset;
      if (hi < lo) return null;
      sx = this._randInt(lo, hi);
      sy = source.y1;
    } else {
      const lo = source.y1 + inset, hi = source.y2 - inset;
      if (hi < lo) return null;
      sy = this._randInt(lo, hi);
      sx = source.x1;
    }

    // Perpendicular direction (two choices), chosen at random.
    const dirs = source.orientation === 'horizontal'
      ? [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }]
      : [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
    const dir = dirs[Math.floor(this.random() * dirs.length)];
    const branchVertical = dir.dx === 0;

    // Walk outward starting beyond the source road. Stop at grass-blocked tiles
    // (parallel road / fence / too close) or connect into a road we hit head-on.
    let reach = 0;        // achieved centerline length beyond the source road edge
    let connected = false;
    for (let step = 1; step <= maxLen; step++) {
      const cx = sx + dir.dx * (sourceHalf + step);
      const cy = sy + dir.dy * (sourceHalf + step);

      if (cx < margin || cx > this.width - 1 - margin || cy < margin || cy > this.height - 1 - margin) {
        break;
      }

      const headOn = builder.getTerrain(cx, cy);
      if (headOn === 'road' || headOn === 'sidewalk') {
        if (allowLoops && step >= minLen) { reach = step; connected = true; }
        break;
      }

      if (!this._crossSectionClear(builder, cx, cy, branchVertical, branchHalf, spacing)) break;
      reach = step;
    }

    if (!connected && reach < minLen) return null;

    const ex = sx + dir.dx * (sourceHalf + reach);
    const ey = sy + dir.dy * (sourceHalf + reach);
    const seg = {
      x1: Math.min(sx, ex), y1: Math.min(sy, ey),
      x2: Math.max(sx, ex), y2: Math.max(sy, ey),
      kind: 'branch',
      orientation: branchVertical ? 'vertical' : 'horizontal',
      depth: source.depth + 1,
      thickness: this.roadThickness,
      sidewalkThickness: this.sidewalkThickness
    };
    return seg;
  }

  /**
   * True if the full cross-section (road + sidewalk + spacing buffer) at a
   * centerline point is grass — i.e. nothing crowds the branch here.
   */
  _crossSectionClear(builder, cx, cy, branchVertical, half, spacing) {
    const reachOut = half + spacing;
    for (let o = -reachOut; o <= reachOut; o++) {
      const tx = branchVertical ? cx + o : cx;
      const ty = branchVertical ? cy : cy + o;
      if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return false;
      if (builder.getTerrain(tx, ty) !== 'grass') return false;
    }
    return true;
  }

  /** Authored segment endpoints lying on a given map border ('north'|'south'|'east'|'west'). */
  getBorderEndpoints(border) {
    const out = [];
    for (const s of this.segments) {
      if (s.kind !== 'authored') continue;
      const ends = [{ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }];
      for (const e of ends) {
        if (border === 'north' && e.y === 0) out.push(e);
        else if (border === 'south' && e.y === this.height - 1) out.push(e);
        else if (border === 'west' && e.x === 0) out.push(e);
        else if (border === 'east' && e.x === this.width - 1) out.push(e);
      }
    }
    return out;
  }

  /** Serializable segment list for map metadata (zoning + debugging). */
  toMetadata() {
    return this.segments.map(({ x1, y1, x2, y2, kind, orientation }) => ({ x1, y1, x2, y2, kind, orientation }));
  }
}

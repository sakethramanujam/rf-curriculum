import type { C } from './complex';
import { palette, alpha } from './theme';

export interface SmithGeom { cx: number; cy: number; R: number }

export const toXY = (g: SmithGeom, G: C): [number, number] => [g.cx + G.re * g.R, g.cy - G.im * g.R];
export const fromXY = (g: SmithGeom, x: number, y: number): C => ({ re: (x - g.cx) / g.R, im: -(y - g.cy) / g.R });

/** Impedance grid (and optionally the admittance grid, rotated 180°). */
export function drawSmithGrid(ctx: CanvasRenderingContext2D, g: SmithGeom, opts: { admittance?: boolean; labels?: boolean } = {}) {
  const P = palette();
  const { cx, cy, R } = g;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.fillStyle = alpha(P.acc, P.dark ? 0.04 : 0.03); ctx.fill();
  ctx.clip();
  const grid = (sign: 1 | -1, col: string, w: number) => {
    ctx.strokeStyle = col; ctx.lineWidth = w;
    for (const r of [0.2, 0.5, 1, 2, 5]) {
      const ccx = r / (1 + r), rr = 1 / (1 + r);
      ctx.beginPath(); ctx.arc(cx + sign * ccx * R, cy, rr * R, 0, 2 * Math.PI); ctx.stroke();
    }
    for (const x of [0.2, 0.5, 1, 2, 5]) {
      for (const s of [1, -1]) {
        ctx.beginPath(); ctx.arc(cx + sign * R, cy - s * R / x, R / x, 0, 2 * Math.PI); ctx.stroke();
      }
    }
  };
  if (opts.admittance) grid(-1, alpha(P.h, 0.22), 1);
  grid(1, P.grid, 1.1);
  ctx.strokeStyle = P.grid; ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = alpha(P.muted, 0.6); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
  if (opts.labels) {
    ctx.fillStyle = P.faint; ctx.font = '11px ui-sans-serif, system-ui'; ctx.textAlign = 'center';
    for (const r of [0.2, 0.5, 1, 2, 5]) ctx.fillText(String(r), cx + ((r - 1) / (r + 1)) * R + 9, cy - 4);
    ctx.fillText('short', cx - R + 2, cy + 16); ctx.fillText('open', cx + R - 4, cy + 16);
    ctx.fillText('+jx (inductive)', cx, cy - R - 8); ctx.fillText('−jx (capacitive)', cx, cy + R + 16);
    ctx.textAlign = 'start';
  }
}

export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, ring?: string) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = fill; ctx.fill();
  if (ring) { ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.stroke(); }
}

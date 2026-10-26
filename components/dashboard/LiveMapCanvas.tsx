"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldData from "world-atlas/countries-110m.json";

export type MapPoint = {
  code: string; // "us", "de"... (public/flags/<code>.svg bilan bir xil)
  name: string;
  lat: number;
  lon: number;
  packets: number;
};
export type MapTarget = { lat: number; lon: number };

const topology = worldData as unknown as Topology<{
  countries: GeometryCollection;
}>;

// Antarktidani (id "010") olib tashlaymiz: xaritaning pastki qismi bo'sh qolmasin
const land = {
  type: "FeatureCollection" as const,
  features: feature(topology, topology.objects.countries).features.filter(
    (f) => f.id !== "010",
  ),
};

// Ko'rinadigan hudud. Land'ning o'zi bilan moslasak, antimeridianni kesib o'tuvchi
// Rossiya va Fiji tufayli xarita hamma tomondan bo'sh joy bilan chiqadi.
const VISIBLE = {
  type: "MultiPoint" as const,
  coordinates: [
    [-170, 83],
    [-170, -56],
    [180, 83],
    [180, -56],
    [0, 83],
    [0, -56],
  ],
};

const TAU = Math.PI * 2;
type XY = [number, number];

function quad(a: XY, c: XY, b: XY, t: number): XY {
  const u = 1 - t;
  return [
    u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
  ];
}

// Quruqlikni vaqtincha canvasga chizib, piksellarini nuqta to'riga aylantiramiz.
// Bu bir marta (o'lcham o'zgarganda) bajariladi, har kadrda emas.
function buildBase(
  w: number,
  h: number,
  dpr: number,
  projection: GeoProjection,
  color: string,
) {
  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const mctx = mask.getContext("2d", { willReadFrequently: true })!;
  mctx.beginPath();
  geoPath(projection, mctx)(land);
  mctx.fill();
  const px = mctx.getImageData(0, 0, w, h).data;

  const base = document.createElement("canvas");
  base.width = w * dpr;
  base.height = h * dpr;
  const bctx = base.getContext("2d")!;
  bctx.scale(dpr, dpr);
  bctx.fillStyle = color;
  bctx.globalAlpha = 0.24;

  const gap = Math.max(6, Math.round(w / 150)); // nuqtalar orasi
  let row = 0;
  for (let y = gap / 2; y < h; y += gap * 0.866, row++) {
    const shift = row % 2 ? gap / 2 : 0; // arining qopqog'idek siljigan qatorlar
    for (let x = gap / 2 + shift; x < w; x += gap) {
      if (px[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 100) {
        bctx.beginPath();
        bctx.arc(x, y, gap * 0.22, 0, TAU);
        bctx.fill();
      }
    }
  }
  return base;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  base: HTMLCanvasElement,
  w: number,
  h: number,
  projection: GeoProjection,
  points: MapPoint[],
  target: MapTarget,
  time: number,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(base, 0, 0, w, h);

  const T = projection([target.lon, target.lat]);
  if (!T) return;
  const max = Math.max(1, ...points.map((p) => p.packets));

  points.forEach((p, i) => {
    const P = projection([p.lon, p.lat]);
    if (!P) return;
    const n = p.packets / max; // 0..1: hajmga qarab yorqinlik va tezlik
    const dist = Math.hypot(T[0] - P[0], T[1] - P[1]);
    const C: XY = [(P[0] + T[0]) / 2, (P[1] + T[1]) / 2 - dist * 0.28];

    // yoy
    ctx.strokeStyle = `rgba(239,68,68,${0.12 + 0.3 * n})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(P[0], P[1]);
    ctx.quadraticCurveTo(C[0], C[1], T[0], T[1]);
    ctx.stroke();

    // yoy bo'ylab harakatlanuvchi paketlar
    const period = 2800 - 1300 * n;
    for (let j = 0; j < 2; j++) {
      const t = (time / period + i * 0.173 + j * 0.5) % 1;
      const [x, y] = quad(P, C, T, t);
      ctx.fillStyle = "rgba(254,202,202,0.95)";
      ctx.beginPath();
      ctx.arc(x, y, 1.3 + n, 0, TAU);
      ctx.fill();
    }

    // manba: pulsatsiya halqasi + nuqta
    const ph = (time / 1800 + i * 0.21) % 1;
    ctx.strokeStyle = `rgba(239,68,68,${(1 - ph) * 0.6})`;
    ctx.beginPath();
    ctx.arc(P[0], P[1], 3 + ph * (7 + 8 * n), 0, TAU);
    ctx.stroke();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(P[0], P[1], 2 + 1.5 * n, 0, TAU);
    ctx.fill();
  });

  // nishon (zonalar joylashgan nuqta)
  const tp = (time / 2200) % 1;
  ctx.strokeStyle = `rgba(34,197,94,${(1 - tp) * 0.7})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(T[0], T[1], 4 + tp * 16, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(T[0], T[1], 4, 0, TAU);
  ctx.fill();
}

type Props = { points: MapPoint[]; target: MapTarget };

export default function LiveMapCanvas({ points, target }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef(points);
  const targetRef = useRef(target);
  const [width, setWidth] = useState(0);

  // konteyner kengligini kuzatamiz
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // proyeksiya va balandlik: toza hisob-kitob, DOM kerak emas
  const { projection, height } = useMemo(() => {
    const p = geoNaturalEarth1().fitWidth(Math.max(width, 1), VISIBLE);
    const bottom = geoPath(p).bounds(VISIBLE)[1][1];
    return { projection: p, height: Math.ceil(bottom) };
  }, [width]);

  // animatsiya halqasi yangi ma'lumotni ref orqali o'qiydi
  useEffect(() => {
    pointsRef.current = points;
    targetRef.current = target;
  }, [points, target]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width < 50) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = buildBase(
      width,
      height,
      dpr,
      projection,
      getComputedStyle(canvas).color,
    );
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      drawFrame(
        ctx,
        base,
        width,
        height,
        projection,
        pointsRef.current,
        targetRef.current,
        reduced ? 0 : now - start,
      );
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [width, height, projection]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="block text-foreground"
        style={{ width, height }}
      />
    </div>
  );
}

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 2,
});
export const formatNumber = (n: number) => compact.format(n);

export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export function formatBitrate(v: number) {
  const units = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

// "YYYY-MM-DD HH:MM:SS" -> "DD/MM/YYYY HH:MM:SS"
export function formatDateTime(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2}:\d{2})/.exec(s);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}` : s;
}

// const durationFormatter = new Intl.DurationFormat("en", { style: "short" });

// export function formatDuration(seconds: number) {
//   const minutes = Math.floor(seconds / 60);
//   const remainingSeconds = seconds % 60;

//   return durationFormatter.format({
//     minutes,
//     seconds: remainingSeconds,
//   });
// }

// soniyalar -> "45s", "5m 12s", "2h 3m"
export function formatDuration(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

// jami hajm (tezlik emas): 1234567 -> "1.23 Mbit"
export function formatBits(v: number) {
  const units = ["bit", "Kbit", "Mbit", "Gbit", "Tbit", "Pbit"];
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

// datetime-local uchun lokal vaqt: YYYY-MM-DDTHH:MM
export const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

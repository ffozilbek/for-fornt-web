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

// const durationFormatter = new Intl.DurationFormat("en", { style: "short" });

// export function formatDuration(seconds: number) {
//   const minutes = Math.floor(seconds / 60);
//   const remainingSeconds = seconds % 60;

//   return durationFormatter.format({
//     minutes,
//     seconds: remainingSeconds,
//   });
// }

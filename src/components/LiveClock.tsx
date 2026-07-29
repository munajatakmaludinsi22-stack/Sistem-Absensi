import React, { useEffect, useState } from "react";

interface LiveClockProps {
  className?: string;
}

// Jam digital yang benar-benar berdetak setiap detik — relevan untuk sistem
// presensi karena admin/guru sering perlu tahu waktu saat ini persis ketika
// mencatat kehadiran.
export default function LiveClock({ className = "" }: LiveClockProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <span className={`tabular-nums ${className}`}>
      {time}
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 ml-2 align-middle animate-pulse" />
    </span>
  );
}

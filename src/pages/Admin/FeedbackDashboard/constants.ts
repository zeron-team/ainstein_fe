import { SECTION_LABELS as _SECTION_LABELS } from "@/types/epc";

export const SECTION_LABELS: Record<string, string> = _SECTION_LABELS as Record<string, string>;

export function formatDate(iso: string | null): string {
    if (!iso) return "N/A";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

export function timeAgo(iso: string | null): string {
    if (!iso) return "N/A";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    
    const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
    const intervals = [
        { label: 'año', seconds: 31536000 },
        { label: 'mes', seconds: 2592000 },
        { label: 'día', seconds: 86400 },
        { label: 'hora', seconds: 3600 },
        { label: 'minuto', seconds: 60 }
    ];

    for (let i = 0; i < intervals.length; i++) {
        const interval = intervals[i];
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `Hace ${count} ${interval.label}${count !== 1 ? 's' : ''}`;
        }
    }
    return "Recién";
}

import { ReactNode } from "react";
import "./kpi.css";

export type KpiCardProps = {
  label: string;
  value: number | string;
  icon?: ReactNode;
  subtitle?: string;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  variant?: "primary" | "warning" | "success" | "neutral";
};

export default function KPI({
  label,
  value,
  icon,
  subtitle,
  trend = "flat",
  trendLabel,
  variant = "primary",
}: KpiCardProps) {
  const variantClass = `kpi-card kpi-${variant}`;
  const trendIcon =
    trend === "up" ? "↑" : trend === "down" ? "↓" : "•";

  return (
    <div className={variantClass}>
      <div className="kpi-header">
        <div className="kpi-label">{label}</div>
        {icon && <div className="kpi-icon">{icon}</div>}
      </div>

      <div className="kpi-value-row">
        <div className="kpi-value">{value}</div>
      </div>

      {(subtitle || trendLabel) && (
        <div className="kpi-footer">
          {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
          {trendLabel && (
            <span className={`kpi-trend kpi-trend-${trend}`}>
              <span className="kpi-trend-icon">{trendIcon}</span>
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
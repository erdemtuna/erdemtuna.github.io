export interface AnalyticsSettings {
  measurementId: string;
  origin: string;
}

export function resolveAnalyticsSettings(
  origin: string,
  measurementId: string | undefined,
  enabled: boolean | undefined
): AnalyticsSettings | undefined {
  if (measurementId && !/^G-[A-Z0-9]{6,}$/.test(measurementId)) {
    throw new Error(
      "Analytics configuration: PUBLIC_GA_MEASUREMENT_ID must be a GA4 G-... Measurement ID"
    );
  }
  if (!enabled) return;
  if (!measurementId) {
    throw new Error(
      "Analytics configuration: PUBLIC_GA_ENABLED requires PUBLIC_GA_MEASUREMENT_ID"
    );
  }
  return { measurementId, origin: new URL(origin).origin };
}

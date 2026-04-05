import dayjs from "dayjs";

/**
 * Hash email address for use as a non-PII identifier in analytics.
 * Uses a simple deterministic hash function that can work in both Node.js and React Native.
 * Note: This is not cryptographically secure, but suitable for analytics purposes.
 */
export const hashEmail = (email: string): string => {
    const normalizedEmail = email.toLowerCase();
    let hash = 0;

    for (let i = 0; i < normalizedEmail.length; i++) {
        const char = normalizedEmail.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Convert to hex string
    return Math.abs(hash).toString(16);
};

export const formatCurrency = (value: number, currency = "USD"): string => {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return value.toFixed(2);
    }
};

export const formatSubscriptionDateTime = (value?: string): string => {
    if (!value) return "Not provided";
    const parsedDate = dayjs(value);
    return parsedDate.isValid() ? parsedDate.format("MM/DD/YYYY") : "Not provided";
};

export const formatStatusLabel = (value?: string): string => {
    if (!value) return "Unknown";
    return value.charAt(0).toUpperCase() + value.slice(1);
};
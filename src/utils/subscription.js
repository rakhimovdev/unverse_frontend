export const TELEGRAM_USERNAME = "Rakhimov_dev23";
export const TELEGRAM_UPGRADE_MESSAGE =
    "Hello, I want to upgrade my BandUp account to PRO.";

export const buildTelegramUpgradeLink = (
    message = TELEGRAM_UPGRADE_MESSAGE
) =>
    `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(message)}`;

export const isProPlanActive = (user) => {
    if (!user) return false;
    if (user.plan !== "pro") return false;
    if (!user.proExpiresAt) return true;

    const expiresAt = new Date(user.proExpiresAt);
    if (Number.isNaN(expiresAt.getTime())) return false;

    return expiresAt.getTime() > Date.now();
};

export const formatPlanExpiry = (value, locale = "en-GB") => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
};

export const getPlanSummary = (user) => {
    if (isProPlanActive(user)) {
        return {
            label: "PRO",
            detail: user?.proExpiresAt
                ? `PRO until: ${formatPlanExpiry(user.proExpiresAt)}`
                : "PRO plan active",
            isPro: true,
        };
    }

    return {
        label: "Free",
        detail: "Free Plan",
        isPro: false,
    };
};

export const PRO_DURATION_OPTIONS = [
    { value: "one_week", label: "1 week PRO" },
    { value: "two_weeks", label: "2 weeks PRO" },
    { value: "three_weeks", label: "3 weeks PRO" },
    { value: "one_month", label: "1 month PRO" },
];

export const formatBand = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "—";
    return Number.isInteger(num) ? String(num) : num.toFixed(1);
};

export const RESULT_MODULE_OPTIONS = [
    { value: "all", label: "All" },
    { value: "reading", label: "Reading" },
    { value: "listening", label: "Listening" },
    { value: "writing", label: "Writing" },
    { value: "speaking", label: "Speaking" }
];

const MODULE_KEY_TO_TYPE = {
    reading: "Reading",
    listening: "Listening",
    writing: "Writing",
    speaking: "Speaking"
};

export const normalizeModuleKey = (value) => {
    const key = String(value || "")
        .trim()
        .toLowerCase();

    if (!key || key === "all") return "all";
    return MODULE_KEY_TO_TYPE[key] ? key : "all";
};

export const getModuleKeyFromType = (moduleType) => {
    const key = String(moduleType || "")
        .trim()
        .toLowerCase();

    return MODULE_KEY_TO_TYPE[key] ? key : "";
};

export const getModuleTypeFromKey = (moduleKey) => {
    const safeKey = normalizeModuleKey(moduleKey);
    return MODULE_KEY_TO_TYPE[safeKey] || "";
};

export const sortResultsNewestFirst = (results = []) =>
    [...(Array.isArray(results) ? results : [])].sort(
        (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
    );

export const filterResultsByModule = (results = [], moduleKey = "all") => {
    const safeModuleKey = normalizeModuleKey(moduleKey);

    if (safeModuleKey === "all") {
        return Array.isArray(results) ? results : [];
    }

    return (Array.isArray(results) ? results : []).filter(
        (result) => getModuleKeyFromType(result?.moduleType) === safeModuleKey
    );
};

export const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
};

export const roundToHalfBand = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return Math.round(num * 2) / 2;
};

export const averageBands = (bands = []) => {
    const values = bands.map(Number).filter(Number.isFinite);
    if (!values.length) return null;
    return roundToHalfBand(
        values.reduce((sum, value) => sum + value, 0) / values.length
    );
};

export const getUserDisplayName = (user) =>
    user?.fullname ||
    [user?.name, user?.lastname].filter(Boolean).join(" ").trim() ||
    user?.username ||
    user?.email ||
    "Candidate";

const toBandNumber = (value) => {
    if (value == null || value === "") return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

export const getReadingBand = (result) =>
    toBandNumber(result?.reading?.academicBand ?? result?.overallBand);

export const getReadingGeneralBand = (result) =>
    toBandNumber(result?.reading?.generalBand ?? result?.overallBand);

export const getListeningBand = (result) =>
    toBandNumber(
        result?.listening?.academicBand ??
            result?.listening?.generalBand ??
            result?.overallBand
    );

export const getWritingBand = (result) =>
    toBandNumber(result?.writing?.overallBand ?? result?.overallBand);

export const getSpeakingBand = (result) =>
    toBandNumber(result?.speaking?.overallBand ?? result?.overallBand);

export const getPrimaryBand = (result) => {
    if (!result) return null;

    switch (result.moduleType) {
        case "Reading":
            return getReadingBand(result);
        case "Listening":
            return getListeningBand(result);
        case "Writing":
            return getWritingBand(result);
        case "Speaking":
            return getSpeakingBand(result);
        default:
            return toBandNumber(result.overallBand);
    }
};

export const getLatestResultByModule = (results = [], moduleType) =>
    (Array.isArray(results) ? results : []).find(
        (result) => result?.moduleType === moduleType
    ) || null;

export const buildDashboardBands = (results = []) => {
    const latestReading = getLatestResultByModule(results, "Reading");
    const latestListening = getLatestResultByModule(results, "Listening");
    const latestWriting = getLatestResultByModule(results, "Writing");
    const latestSpeaking = getLatestResultByModule(results, "Speaking");

    const readingAcademic = getReadingBand(latestReading);
    const readingGeneral = getReadingGeneralBand(latestReading);
    const listeningBand = getListeningBand(latestListening);
    const writingBand = getWritingBand(latestWriting);
    const speakingBand = getSpeakingBand(latestSpeaking);

    return {
        readingBand: Number.isFinite(readingAcademic) ? readingAcademic : null,
        listeningBand: Number.isFinite(listeningBand) ? listeningBand : null,
        writingBand: Number.isFinite(writingBand) ? writingBand : null,
        speakingBand: Number.isFinite(speakingBand) ? speakingBand : null,
        overallAcademicBand: averageBands([
            readingAcademic,
            listeningBand,
            writingBand,
            speakingBand
        ]),
        overallGeneralBand: averageBands([
            readingGeneral,
            listeningBand,
            writingBand,
            speakingBand
        ])
    };
};

export const buildHistoryPoints = (results = []) =>
    (Array.isArray(results) ? results : [])
        .map((result) => {
            const band = getPrimaryBand(result);
            if (!Number.isFinite(band) || !result?.createdAt) return null;

            const date = new Date(result.createdAt);
            if (Number.isNaN(date.getTime())) return null;

            return {
                id: result._id,
                label: new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short"
                }).format(date),
                band,
                createdAt: result.createdAt,
                moduleType: result.moduleType
            };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

export const getResultToggleLabel = (moduleType) => {
    if (moduleType === "Writing") return "View Criterion Feedback";
    if (moduleType === "Speaking") return "View Detailed Feedback";
    return "View Mistakes";
};

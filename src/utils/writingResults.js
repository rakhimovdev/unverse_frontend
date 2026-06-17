const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const normalizeText = (value, fallback = "") =>
    typeof value === "string" ? value.trim() : fallback;

const normalizeList = (value) =>
    Array.isArray(value)
        ? value
              .map((item) => normalizeText(item))
              .filter(Boolean)
        : [];

export const formatBand = (value) => {
    const num = toNumber(value);
    if (num == null) return "—";
    return Number.isInteger(num) ? String(num) : num.toFixed(1);
};

export const formatWritingDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString();
};

export const formatWritingText = (value) => {
    if (!value) return "—";
    if (Array.isArray(value)) {
        const list = value.map((item) => normalizeText(item)).filter(Boolean);
        return list.length ? list.join(" ") : "—";
    }
    const clean = normalizeText(value);
    return clean || "—";
};

export const normalizeWritingRecord = (record) => {
    const legacy = record?.result || {};
    const scores = {
        taskResponse:
            toNumber(record?.scores?.taskResponse) ??
            toNumber(record?.taskResponseScore),
        coherenceCohesion:
            toNumber(record?.scores?.coherenceCohesion) ??
            toNumber(record?.coherenceCohesionScore),
        lexicalResource:
            toNumber(record?.scores?.lexicalResource) ??
            toNumber(record?.lexicalResourceScore),
        grammarRangeAccuracy:
            toNumber(record?.scores?.grammarRangeAccuracy) ??
            toNumber(record?.grammarRangeAccuracyScore),
        overall:
            toNumber(record?.scores?.overall) ??
            toNumber(legacy?.band_score ?? legacy?.estimated_band)
    };

    return {
        ...record,
        testName: normalizeText(record?.testName) || "Writing Test",
        question: normalizeText(record?.question || record?.prompt),
        essay: normalizeText(record?.essay || record?.essayText),
        wordCount:
            toNumber(record?.wordCount) ??
            normalizeText(record?.essay || record?.essayText)
                .split(/\s+/)
                .filter(Boolean).length,
        scores,
        feedback: {
            strengths: normalizeList(record?.feedback?.strengths),
            weaknesses: normalizeList(record?.feedback?.weaknesses || legacy?.weaknesses),
            improvementTips: normalizeList(
                record?.feedback?.improvementTips || legacy?.improvement_tips
            )
        },
        criterionFeedback: {
            taskResponse:
                normalizeText(record?.criterionFeedback?.taskResponse) ||
                normalizeText(legacy?.final_summary),
            coherenceCohesion:
                normalizeText(record?.criterionFeedback?.coherenceCohesion) ||
                normalizeList(legacy?.coherence_feedback).join(" "),
            lexicalResource:
                normalizeText(record?.criterionFeedback?.lexicalResource) ||
                normalizeList(legacy?.vocabulary_feedback).join(" "),
            grammarRangeAccuracy:
                normalizeText(record?.criterionFeedback?.grammarRangeAccuracy) ||
                normalizeList(legacy?.grammar_feedback).join(" ")
        },
        result: {
            ...legacy,
            band_score:
                toNumber(legacy?.band_score ?? legacy?.estimated_band) ??
                toNumber(record?.scores?.overall),
            estimated_band:
                toNumber(legacy?.estimated_band ?? legacy?.band_score) ??
                toNumber(record?.scores?.overall)
        }
    };
};

const getAttemptIdentifier = (record) =>
    normalizeText(record?.attemptKey) ||
    normalizeText(record?.writingId) ||
    normalizeText(record?._id);

export const getLatestWritingAttempt = (results = []) => {
    const normalized = (Array.isArray(results) ? results : [])
        .map((item) => normalizeWritingRecord(item))
        .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

    if (!normalized.length) {
        return {
            items: [],
            overall: null,
            task1: null,
            task2: null,
            latestTask: null,
            criteriaSource: null
        };
    }

    const latest = normalized[0];
    const attemptId = getAttemptIdentifier(latest);
    const items = normalized.filter(
        (item) => getAttemptIdentifier(item) === attemptId
    );

    const overall = items.find((item) => item.taskType === "overall") || null;
    const task1 = items.find((item) => item.taskType === "task1") || null;
    const task2 = items.find((item) => item.taskType === "task2") || null;
    const latestTask =
        items.find((item) => item.taskType !== "overall") ||
        normalized.find((item) => item.taskType !== "overall") ||
        null;

    return {
        items,
        overall,
        task1,
        task2,
        latestTask,
        criteriaSource:
            (overall &&
                overall.scores &&
                overall.scores.taskResponse != null &&
                overall.scores.coherenceCohesion != null &&
                overall.scores.lexicalResource != null &&
                overall.scores.grammarRangeAccuracy != null &&
                overall) ||
            latestTask ||
            task2 ||
            task1 ||
            overall
    };
};

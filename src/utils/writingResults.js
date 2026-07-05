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

const uniqueList = (items = []) => {
    const seen = new Set();
    const list = [];

    for (const item of items) {
        const clean = normalizeText(item);
        const key = clean.toLowerCase();
        if (!clean || seen.has(key)) continue;
        seen.add(key);
        list.push(clean);
    }

    return list;
};

const normalizeGrammarCorrections = (value) =>
    Array.isArray(value)
        ? value
              .map((item) => ({
                  original: normalizeText(item?.original),
                  correct: normalizeText(item?.correct),
                  reason: normalizeText(item?.reason)
              }))
              .filter((item) => item.original && item.correct && item.reason)
        : [];

const normalizeVocabularySuggestions = (value) =>
    Array.isArray(value)
        ? value
              .map((item) => ({
                  original: normalizeText(item?.original),
                  alternatives: uniqueList(item?.alternatives || [])
              }))
              .filter((item) => item.original && item.alternatives.length)
        : [];

const normalizeCriterionEntry = (value, fallbackBand = null) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return {
            band: toNumber(value.band) ?? fallbackBand,
            analysis: normalizeText(value.analysis || value.comment || value.feedback),
            evidence: normalizeList(value.evidence)
        };
    }

    const analysis = normalizeText(value);
    if (!analysis && fallbackBand == null) return null;

    return {
        band: fallbackBand,
        analysis,
        evidence: []
    };
};

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

const getTaskTypeLabel = (taskType) => {
    if (taskType === "task1") return "Task 1";
    if (taskType === "task2") return "Task 2";
    return "Overall";
};

export const getWritingScoreItems = (task = {}) => {
    const taskType = normalizeText(task?.taskType);
    const scores = task?.scores || {};

    const common = [
        { key: "coherence", label: "Coherence & Cohesion", value: scores.coherence },
        { key: "lexical", label: "Lexical Resource", value: scores.lexical },
        { key: "grammar", label: "Grammar", value: scores.grammar }
    ];

    if (taskType === "task1") {
        return [
            {
                key: "taskAchievement",
                label: "Task Achievement",
                value: scores.taskAchievement
            },
            ...common
        ];
    }

    if (taskType === "task2") {
        return [
            {
                key: "taskResponse",
                label: "Task Response",
                value: scores.taskResponse
            },
            ...common
        ];
    }

    return [
        {
            key: "taskAchievement",
            label: "Task 1 Task Achievement",
            value: scores.taskAchievement
        },
        {
            key: "taskResponse",
            label: "Task 2 Task Response",
            value: scores.taskResponse
        },
        ...common
    ];
};

export const normalizeWritingRecord = (record) => {
    const legacy = record?.result || {};
    const taskType = normalizeText(record?.taskType);
    const scores = {
        taskAchievement:
            toNumber(record?.scores?.taskAchievement) ??
            (taskType === "task1"
                ? toNumber(record?.scores?.taskResponse ?? record?.taskResponseScore)
                : null),
        taskResponse:
            toNumber(record?.scores?.taskResponse) ??
            (taskType === "task2" ? toNumber(record?.taskResponseScore) : null),
        coherence:
            toNumber(record?.scores?.coherence) ??
            toNumber(record?.scores?.coherenceCohesion ?? record?.coherenceCohesionScore),
        lexical:
            toNumber(record?.scores?.lexical) ??
            toNumber(record?.scores?.lexicalResource ?? record?.lexicalResourceScore),
        grammar:
            toNumber(record?.scores?.grammar) ??
            toNumber(record?.scores?.grammarRangeAccuracy ?? record?.grammarRangeAccuracyScore),
        overall:
            toNumber(record?.scores?.overall) ??
            toNumber(legacy?.band_score ?? legacy?.estimated_band)
    };

    const criterionFeedback = {
        taskAchievement:
            taskType === "task1" || record?.criterionFeedback?.taskAchievement
                ? normalizeCriterionEntry(
                      record?.criterionFeedback?.taskAchievement ??
                          record?.criterionFeedback?.taskResponse,
                      scores.taskAchievement
                  )
                : null,
        taskResponse:
            taskType === "task2" || record?.criterionFeedback?.taskResponse
                ? normalizeCriterionEntry(
                      record?.criterionFeedback?.taskResponse,
                      scores.taskResponse
                  )
                : null,
        coherence: normalizeCriterionEntry(
            record?.criterionFeedback?.coherence ??
                record?.criterionFeedback?.coherenceCohesion,
            scores.coherence
        ),
        lexical: normalizeCriterionEntry(
            record?.criterionFeedback?.lexical ??
                record?.criterionFeedback?.lexicalResource,
            scores.lexical
        ),
        grammar: normalizeCriterionEntry(
            record?.criterionFeedback?.grammar ??
                record?.criterionFeedback?.grammarRangeAccuracy,
            scores.grammar
        )
    };

    const strengths = normalizeList(
        record?.strengths || record?.feedback?.strengths
    );
    const weaknesses = normalizeList(
        record?.weaknesses || record?.feedback?.weaknesses || legacy?.weaknesses
    );
    const improvementTips = uniqueList(
        record?.improvementTips ||
            record?.feedback?.improvementTips ||
            legacy?.improvement_tips ||
            []
    );

    return {
        ...record,
        taskType,
        taskTypeLabel: normalizeText(record?.taskTypeLabel) || getTaskTypeLabel(taskType),
        testName: normalizeText(record?.testName) || "Writing Test",
        question: normalizeText(record?.question || record?.prompt),
        essay: normalizeText(record?.essay || record?.essayText),
        wordCount:
            toNumber(record?.wordCount) ??
            normalizeText(record?.essay || record?.essayText)
                .split(/\s+/)
                .filter(Boolean).length,
        scores,
        strengths,
        weaknesses,
        improvementTips,
        criterionFeedback,
        grammarCorrections: normalizeGrammarCorrections(record?.grammarCorrections),
        vocabularySuggestions: normalizeVocabularySuggestions(
            record?.vocabularySuggestions
        ),
        estimatedExaminerComment:
            normalizeText(record?.estimatedExaminerComment) ||
            normalizeText(legacy?.final_summary),
        feedback: {
            strengths,
            weaknesses,
            improvementTips
        },
        result: {
            ...legacy,
            band_score: toNumber(legacy?.band_score ?? scores.overall) ?? null,
            estimated_band: toNumber(legacy?.estimated_band ?? scores.overall) ?? null
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
            displayTasks: []
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

    const displayTasks =
        [task1, task2].filter(Boolean).length > 0
            ? [task1, task2].filter(Boolean)
            : latestTask
                ? [latestTask]
                : [];

    return {
        items,
        overall,
        task1,
        task2,
        latestTask,
        displayTasks
    };
};

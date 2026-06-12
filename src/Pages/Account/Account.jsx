import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchResultDetail, fetchUserResults } from "../../Api/results";
import BandCard from "../../components/results/BandCard";
import HistoryChart from "../../components/results/HistoryChart";
import ResultCard from "../../components/results/ResultCard";
import "../../components/results/ResultsCenter.css";
import { useAuth } from "../../context/AuthContext";
import {
    buildDashboardBands,
    buildHistoryPoints,
    filterResultsByModule,
    getUserDisplayName,
    RESULT_MODULE_OPTIONS,
    sortResultsNewestFirst
} from "../../utils/ieltsResults";
import { getPlanSummary } from "../../utils/subscription";

function Account() {
    const { user, loading: authLoading, refreshCurrentUser } = useAuth();
    const [results, setResults] = useState([]);
    const [detailCache, setDetailCache] = useState({});
    const [expandedId, setExpandedId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedModule, setSelectedModule] = useState("all");
    const [searchValue, setSearchValue] = useState("");

    useEffect(() => {
        let isActive = true;

        const loadResults = async () => {
            setLoading(true);
            setError("");

            try {
                if (!user) {
                    await refreshCurrentUser();
                }

                const payload = await fetchUserResults();
                if (!isActive) return;

                setResults(sortResultsNewestFirst(payload));
            } catch (err) {
                if (!isActive) return;
                setError(err.response?.data?.message || "Failed to load results.");
            } finally {
                if (isActive) setLoading(false);
            }
        };

        loadResults();

        return () => {
            isActive = false;
        };
    }, [refreshCurrentUser, user]);

    const planSummary = useMemo(() => getPlanSummary(user), [user]);
    const bands = useMemo(() => buildDashboardBands(results), [results]);
    const historyPoints = useMemo(() => buildHistoryPoints(results), [results]);
    const moduleResults = useMemo(
        () => filterResultsByModule(results, selectedModule),
        [results, selectedModule]
    );

    const displayedResults = useMemo(() => {
        const safeSearch = searchValue.trim().toLowerCase();

        return moduleResults.filter((result) => {
            if (!safeSearch) return true;

            const haystack = [
                result.testName,
                result.moduleType,
                result.userId?.email,
                result.userId?.username
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(safeSearch);
        });
    }, [moduleResults, searchValue]);

    const emptyStateMessage = useMemo(() => {
        if (selectedModule !== "all" && !moduleResults.length) {
            return "No results found for this section.";
        }

        if (searchValue.trim()) {
            return selectedModule === "all"
                ? "No results match your search."
                : "No results match your search in this section.";
        }

        return "No test results yet.";
    }, [moduleResults.length, searchValue, selectedModule]);

    const handleToggle = async (resultId) => {
        const nextExpanded = expandedId === resultId ? "" : resultId;
        setExpandedId(nextExpanded);

        if (!nextExpanded || detailCache[resultId]) return;

        try {
            const detail = await fetchResultDetail(resultId);
            setDetailCache((prev) => ({ ...prev, [resultId]: detail }));
        } catch (err) {
            console.error("Failed to load result detail:", err);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="results-page">
                <div className="results-shell">
                    <div className="results-empty">Loading your IELTS result center...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="results-page">
            <div className="results-shell">
                <section className="results-hero">
                    <div className="results-hero__copy">
                        <p className="results-hero__eyebrow">Official Result Center</p>
                        <h1>{getUserDisplayName(user)}</h1>
                        <p>
                            Every completed Reading, Listening, Writing and Speaking
                            attempt is stored here in an IELTS-style format, newest first.
                        </p>

                        <div className="results-hero__actions">
                            <span className="results-plan-chip">{planSummary.detail}</span>
                            {!planSummary.isPro && (
                                <Link className="results-pill-link results-pill-link--light" to="/upgrade">
                                    Upgrade to PRO
                                </Link>
                            )}
                        </div>
                    </div>

                    <aside className="results-plan">
                        <h2>Result Archive</h2>
                        <p>
                            Permanent history, expandable feedback, and a progress chart are
                            all available in one place.
                        </p>
                        <Link className="results-pill-link" to="/read">
                            Take Another Test
                        </Link>
                    </aside>
                </section>

                <section className="results-score-grid">
                    <BandCard
                        title="Reading Band"
                        value={bands.readingBand}
                        subtitle="Latest academic reading score"
                    />
                    <BandCard
                        title="Listening Band"
                        value={bands.listeningBand}
                        subtitle="Latest listening score"
                    />
                    <BandCard
                        title="Writing Band"
                        value={bands.writingBand}
                        subtitle="Latest writing score"
                    />
                    <BandCard
                        title="Speaking Band"
                        value={bands.speakingBand}
                        subtitle="Latest speaking score"
                    />
                    <BandCard
                        title="Overall Academic"
                        value={bands.overallAcademicBand}
                        subtitle="Based on latest available modules"
                    />
                    <BandCard
                        title="Overall General"
                        value={bands.overallGeneralBand}
                        subtitle="Based on latest available modules"
                    />
                </section>

                <section className="results-body">
                    <div className="results-main">
                        <div className="results-panel-head">
                            <div>
                                <p className="results-hero__eyebrow">Test History</p>
                                <h2>Saved Results</h2>
                                <p>
                                    {results.length
                                        ? `${results.length} result${results.length > 1 ? "s" : ""} stored permanently.`
                                        : "No test results yet."}
                                </p>
                            </div>
                        </div>

                        <div className="results-toolbar">
                            <div className="results-toolbar__filters">
                                {RESULT_MODULE_OPTIONS.map((filter) => (
                                    <button
                                        key={filter.value}
                                        type="button"
                                        className={
                                            selectedModule === filter.value ? "is-active" : ""
                                        }
                                        onClick={() => setSelectedModule(filter.value)}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>

                            <div className="results-toolbar__search">
                                <input
                                    type="search"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder="Search inside this section"
                                />
                            </div>
                        </div>

                        {error ? (
                            <div className="results-empty">{error}</div>
                        ) : displayedResults.length ? (
                            displayedResults.map((result) => (
                                <ResultCard
                                    key={result._id}
                                    result={result}
                                    detail={detailCache[result._id]}
                                    expanded={expandedId === result._id}
                                    loadingDetail={
                                        expandedId === result._id && !detailCache[result._id]
                                    }
                                    onToggle={() => handleToggle(result._id)}
                                />
                            ))
                        ) : (
                            <div className="results-empty">{emptyStateMessage}</div>
                        )}
                    </div>

                    <HistoryChart points={historyPoints} />
                </section>
            </div>
        </div>
    );
}

export default Account;

import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminResults } from "../../Api/results";
import ResultCard from "../../components/results/ResultCard";
import "../../components/results/ResultsCenter.css";
import {
    filterResultsByModule,
    RESULT_MODULE_OPTIONS,
    sortResultsNewestFirst
} from "../../utils/ieltsResults";

function AdminResultsPanel({ active }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [selectedModule, setSelectedModule] = useState("all");
    const [expandedId, setExpandedId] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadResults = async () => {
            if (!active) return;

            setLoading(true);
            setError("");

            try {
                const payload = await fetchAdminResults();
                if (!isMounted) return;
                setResults(sortResultsNewestFirst(payload));
            } catch (err) {
                if (!isMounted) return;
                setError(err.response?.data?.message || "Results could not be loaded.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadResults();

        return () => {
            isMounted = false;
        };
    }, [active]);

    const summary = useMemo(() => {
        const uniqueUsers = new Set(
            results.map((result) => result.userId?._id || result.userId).filter(Boolean)
        );

        return {
            total: results.length,
            users: uniqueUsers.size,
            reading: filterResultsByModule(results, "reading").length,
            listening: filterResultsByModule(results, "listening").length,
            writing: filterResultsByModule(results, "writing").length,
            speaking: filterResultsByModule(results, "speaking").length
        };
    }, [results]);

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
                result.userId?.fullname,
                result.userId?.name,
                result.userId?.lastname,
                result.userId?.username,
                result.userId?.email
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

    if (!active) return null;

    return (
        <div className="results-shell">
            <div className="results-panel-head">
                <div>
                    <p className="results-hero__eyebrow">Admin Monitoring</p>
                    <h2>All Saved Results</h2>
                    <p>Newest submissions across every module are shown first.</p>
                </div>
            </div>

            <div className="results-summary-grid">
                <div className="results-summary-tile">
                    Total Results
                    <strong>{summary.total}</strong>
                </div>
                <div className="results-summary-tile">
                    Unique Users
                    <strong>{summary.users}</strong>
                </div>
                <div className="results-summary-tile">
                    Reading
                    <strong>{summary.reading}</strong>
                </div>
                <div className="results-summary-tile">
                    Listening
                    <strong>{summary.listening}</strong>
                </div>
                <div className="results-summary-tile">
                    Writing
                    <strong>{summary.writing}</strong>
                </div>
                <div className="results-summary-tile">
                    Speaking
                    <strong>{summary.speaking}</strong>
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

            {loading ? (
                <div className="results-empty">Loading all saved results...</div>
            ) : error ? (
                <div className="results-empty">{error}</div>
            ) : displayedResults.length ? (
                displayedResults.map((result) => (
                    <ResultCard
                        key={result._id}
                        result={result}
                        detail={result}
                        expanded={expandedId === result._id}
                        loadingDetail={false}
                        onToggle={() =>
                            setExpandedId((prev) => (prev === result._id ? "" : result._id))
                        }
                        adminMode
                    />
                ))
            ) : (
                <div className="results-empty">{emptyStateMessage}</div>
            )}
        </div>
    );
}

export default AdminResultsPanel;

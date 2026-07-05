import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ResultCard from "./ResultCard";

describe("ResultCard writing details", () => {
    it("shows the new writing fields and hides legacy writing note blocks", () => {
        render(
            <ResultCard
                expanded
                loadingDetail={false}
                onToggle={() => {}}
                result={{
                    _id: "result-1",
                    moduleType: "Writing",
                    testName: "Writing Test",
                    createdAt: "2026-07-05T10:00:00.000Z",
                    userId: {
                        fullname: "Student Example",
                        email: "student@example.com"
                    },
                    writing: {
                        overallBand: 7.5,
                        finalSummary: "A balanced overall writing performance.",
                        task1: {
                            taskType: "task1",
                            bandScore: 7,
                            question: "Summarise the chart.",
                            strengths: ["Clear overview."],
                            weaknesses: ["One comparison is brief."],
                            improvementTips: ["Develop the final comparison more fully."],
                            scores: {
                                taskAchievement: 7,
                                coherence: 7,
                                lexical: 7,
                                grammar: 7,
                                overall: 7
                            },
                            criterionFeedback: {
                                taskAchievement: {
                                    band: 7,
                                    analysis: "The key features are covered.",
                                    evidence: ["The overview identifies the main rise and fall."]
                                },
                                coherence: {
                                    band: 7,
                                    analysis: "Paragraphing is clear.",
                                    evidence: ["Overview and details are separated."]
                                },
                                lexical: {
                                    band: 7,
                                    analysis: "Vocabulary is accurate overall.",
                                    evidence: ["The report uses 'declined' appropriately."]
                                },
                                grammar: {
                                    band: 7,
                                    analysis: "Sentence forms are varied.",
                                    evidence: ["There are accurate complex comparison clauses."]
                                }
                            },
                            grammarCorrections: [
                                {
                                    original: "people was",
                                    correct: "people were",
                                    reason: "Plural subject agreement."
                                }
                            ],
                            vocabularySuggestions: [
                                {
                                    original: "big increase",
                                    alternatives: ["sharp rise", "significant growth"]
                                }
                            ],
                            estimatedExaminerComment: "A competent Task 1 response."
                        },
                        task2: {
                            taskType: "task2",
                            bandScore: 8,
                            question: "Discuss both views and give your opinion.",
                            strengths: ["Clear opinion and strong support."],
                            weaknesses: ["The opposing view is shorter."],
                            improvementTips: ["Add one more developed counterargument."],
                            scores: {
                                taskResponse: 8,
                                coherence: 8,
                                lexical: 8,
                                grammar: 8,
                                overall: 8
                            },
                            criterionFeedback: {
                                taskResponse: {
                                    band: 8,
                                    analysis: "The essay answers all parts clearly.",
                                    evidence: ["The position is stated in both the introduction and conclusion."]
                                },
                                coherence: {
                                    band: 8,
                                    analysis: "Ideas progress logically.",
                                    evidence: ["Each paragraph has one main controlling idea."]
                                },
                                lexical: {
                                    band: 8,
                                    analysis: "Vocabulary is varied and precise.",
                                    evidence: ["The essay uses 'detrimental' and 'feasible' naturally."]
                                },
                                grammar: {
                                    band: 8,
                                    analysis: "Complex forms are generally accurate.",
                                    evidence: ["Relative clauses and conditionals are handled well."]
                                }
                            },
                            grammarCorrections: [],
                            vocabularySuggestions: [],
                            estimatedExaminerComment: "A strong Task 2 response."
                        }
                    }
                }}
            />
        );

        expect(screen.queryByText("Legacy Vocabulary Notes")).not.toBeInTheDocument();
        expect(screen.queryByText("Legacy Coherence Notes")).not.toBeInTheDocument();
        expect(screen.getAllByText("Grammar Corrections").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Vocabulary Suggestions").length).toBeGreaterThan(0);
        expect(screen.getByText("A competent Task 1 response.")).toBeInTheDocument();
        expect(screen.getByText("A strong Task 2 response.")).toBeInTheDocument();
    });
});

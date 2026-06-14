import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    buildTelegramUpgradeLink,
    getPlanSummary,
    PRO_DURATION_OPTIONS,
} from "../../utils/subscription";
import "./Pricing.css";

const PLAN_BENEFITS = [
    "Unlimited AI writing checks while PRO is active",
    "Priority access to premium practice flow",
    "Manual activation by admin after payment",
];

function Pricing() {
    const { user } = useAuth();
    const planSummary = getPlanSummary(user);

    return (
        <div className="upgrade-page">
            <section className="upgrade-hero">
                <div className="upgrade-hero__copy">
                    <span className="upgrade-hero__eyebrow">BandUp PRO</span>
                    <h1>Upgrade your account without online payment checkout</h1>
                    <p>
                        Choose a duration, message us on Telegram, and the admin will
                        manually activate your PRO subscription after payment.
                    </p>

                    <div className={`upgrade-status ${planSummary.isPro ? "is-pro" : ""}`}>
                        <strong>Current plan:</strong> {planSummary.detail}
                    </div>
                </div>

                <div className="upgrade-hero__note">
                    <h2>How it works</h2>
                    <ol>
                        <li>Pick the PRO duration you want.</li>
                        <li>Tap the Telegram button and send the prefilled message.</li>
                        <li>After payment, admin will manually activate your PRO account.</li>
                    </ol>
                </div>
            </section>

            <section className="upgrade-grid">
                {PRO_DURATION_OPTIONS.map((plan) => (
                    <article className="upgrade-card" key={plan.value}>
                        <div className="upgrade-card__top">
                            <span className="upgrade-card__badge">Manual activation</span>
                            <h2>{plan.label}</h2>
                            <p className="upgrade-card__price">Price: contact on Telegram</p>
                        </div>

                        <ul className="upgrade-card__benefits">
                            {PLAN_BENEFITS.map((benefit) => (
                                <li key={`${plan.value}-${benefit}`}>{benefit}</li>
                            ))}
                        </ul>

                        <a
                            className="upgrade-card__button"
                            href={buildTelegramUpgradeLink()}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Contact on Telegram
                        </a>
                    </article>
                ))}
            </section>

            <section className="upgrade-footer">
                <p>
                    Telegram: <strong>@Rakhimov_dev23</strong>
                </p>
                <p>After payment, admin will manually activate your PRO account.</p>
                <Link className="upgrade-footer__link" to={user ? "/account" : "/sign_in"}>
                    Back to account
                </Link>
            </section>
        </div>
    );
}

export default Pricing;

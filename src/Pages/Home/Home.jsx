import React from 'react';
import { Link } from 'react-router-dom';
import "./Home.css";

function Home() {
    return (
        <main className="home">
            <section className="hero">
                <div className="hero__content">
                    <p className="eyebrow">Universe Language School</p>
                    <h1>Train for band 9 with a system that builds every skill.</h1>
                    <p className="lead">
                        Short, focused practice. Clear feedback. Real progress you can see. Build reading, listening,
                        and writing confidence with a path designed for momentum.
                    </p>
                    <div className="hero__actions">
                        <Link className="btn btn-primary" to="/read">Start IELTS test</Link>
                        <Link className="btn btn-ghost" to="/sign_up">Create account</Link>
                    </div>
                    <div className="hero__stats">
                        <div className="stat">
                            <span className="stat__value">120+</span>
                            <span className="stat__label">Practice sets</span>
                        </div>
                        <div className="stat">
                            <span className="stat__value">4 Skills</span>
                            <span className="stat__label">One system</span>
                        </div>
                        <div className="stat">
                            <span className="stat__value">9-Step</span>
                            <span className="stat__label">Feedback loop</span>
                        </div>
                    </div>
                </div>

                <div className="hero__visual">
                    <div className="nine-card">
                        <div className="nine-mark" aria-hidden="true"></div>
                        <div className="nine-caption">
                            <span className="nine-caption__title">Band 9</span>
                            <span className="nine-caption__subtitle">Target score</span>
                        </div>
                    </div>
                    <div className="hero-tile hero-tile--reading">Reading Lab</div>
                    <div className="hero-tile hero-tile--listening">Listening Studio</div>
                    <div className="hero-tile hero-tile--writing">Writing Clinic</div>
                </div>
            </section>

            <section className="section">
                <div className="section__heading">
                    <h2>Four skills, one rhythm</h2>
                    <p>Every module is designed for clarity: diagnose, practice, review, repeat.</p>
                </div>
                <div className="track-grid">
                    <Link className="track-card" to="/read">
                        <span className="track-card__icon">R</span>
                        <h3>Reading</h3>
                        <p>Build speed, accuracy, and strategy with timed passages.</p>
                    </Link>
                    <Link className="track-card" to="/audio">
                        <span className="track-card__icon">L</span>
                        <h3>Listening</h3>
                        <p>Train your ear with realistic audio and smart checkpoints.</p>
                    </Link>
                    <Link className="track-card" to="/writingform">
                        <span className="track-card__icon">W</span>
                        <h3>Writing</h3>
                        <p>Get guided structures, examples, and scoring insights.</p>
                    </Link>
                    <Link className="track-card" to="/account">
                        <span className="track-card__icon">A</span>
                        <h3>Analytics</h3>
                        <p>Track progress, streaks, and weak spots in one view.</p>
                    </Link>
                </div>
            </section>

            <section className="section process">
                <div className="section__heading">
                    <h2>How the 9-step loop works</h2>
                    <p>Move from baseline to band 9 with a repeatable routine.</p>
                </div>
                <div className="steps">
                    <div className="step">
                        <span className="step__num">01</span>
                        <h3>Diagnose</h3>
                        <p>Start with a quick baseline to see your current band.</p>
                    </div>
                    <div className="step">
                        <span className="step__num">02</span>
                        <h3>Focus</h3>
                        <p>Work in short, targeted sessions that isolate weak areas.</p>
                    </div>
                    <div className="step">
                        <span className="step__num">03</span>
                        <h3>Review</h3>
                        <p>Instant feedback and model answers keep you on track.</p>
                    </div>
                </div>
            </section>

            <section className="section testimonials">
                <div className="section__heading">
                    <h2>Students who made the jump</h2>
                    <p>Real practice, real confidence. Here is what they say.</p>
                </div>
                <div className="testimonial-grid">
                    <article className="testimonial">
                        <p>
                            “The reading drills finally felt structured. I went from 6.5 to 8 in two months.”
                        </p>
                        <span>Aziza, Tashkent</span>
                    </article>
                    <article className="testimonial">
                        <p>
                            “Short lessons kept me consistent. The writing feedback was the turning point.”
                        </p>
                        <span>Jasur, Samarkand</span>
                    </article>
                    <article className="testimonial">
                        <p>
                            “The analytics showed exactly what to fix. My listening score jumped.”
                        </p>
                        <span>Kamola, Bukhara</span>
                    </article>
                </div>
            </section>

            <section className="cta">
                <div className="cta__inner">
                    <div>
                        <h2>Ready to build your band 9 routine?</h2>
                        <p>Start with a free diagnostic, then follow your personalized plan.</p>
                    </div>
                    <div className="cta__actions">
                        <Link className="btn btn-primary" to="/sign_up">Join free</Link>
                        <Link className="btn btn-ghost" to="/sign_in">Sign in</Link>
                    </div>
                </div>
            </section>

            <footer className="home-footer">
                <div>
                    <h3>Universe Language School</h3>
                    <p>Focused practice for ambitious learners.</p>
                </div>
                <div className="home-footer__links">
                    <a href="/read">Reading</a>
                    <a href="/audio">Listening</a>
                    <a href="/writingform">Writing</a>
                    <a href="/sign_up">Join</a>
                </div>
            </footer>
        </main>
    );
}

export default Home;

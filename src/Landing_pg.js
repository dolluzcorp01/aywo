import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaGoogle, FaSlack, FaBolt, FaRegStickyNote, FaDatabase,
    FaWpforms, FaEnvelope, FaCog, FaChartBar, FaLock, FaCloud
} from "react-icons/fa";
import "./Landing_pg.css";

const LandingPage = () => {
    const [showTemplates, setShowTemplates] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            {/* Header / Navbar */}
            <nav className="landing-navbar">
                <div className="landing-logo">dForms</div>

                <ul className="landing-nav-links">
                    <li><a href="#features">Products</a></li>
                    <li
                        className="landing-dropdown"
                        onMouseEnter={() => setShowTemplates(true)}
                        onMouseLeave={() => setShowTemplates(false)}
                    >
                        <span
                            onClick={() => {
                                document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Templates ▾
                        </span>
                        {showTemplates && (
                            <ul className="landing-dropdown-menu">
                                <li><a href="#templates">Survey Form</a></li>
                                <li><a href="#templates">Registration Form</a></li>
                                <li><a href="#templates">Feedback Form</a></li>
                            </ul>
                        )}
                    </li>
                    <li><a href="#integrations">Integrations</a></li>
                    <li><a href="#howitworks">Resources</a></li>
                    <li><a href="#pricing">Pricing</a></li>
                </ul>

                <div className="landing-nav-right">
                    <a className="landing-login" onClick={() => navigate("/login")}>Login</a>
                    <button className="landing-btn-primary" onClick={() => navigate("/signup")}>Sign Up</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-left">
                    <h1>Build forms that do more</h1>
                    <p>
                        Automate workflows, integrate with your favorite tools, and collect
                        better insights.
                    </p>
                    <button className="landing-btn-primary">Get started — it’s free</button>
                </div>

                <div className="landing-hero-right">
                    <div className="landing-floating-icons">
                        <div className="landing-icon"><FaWpforms /></div>
                        <div className="landing-icon"><FaEnvelope /></div>
                        <div className="landing-icon"><FaCog /></div>
                        <div className="landing-icon"><FaChartBar /></div>
                        <div className="landing-icon"><FaLock /></div>
                        <div className="landing-icon"><FaCloud /></div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="landing-features">
                <h2>Why Choose dForms?</h2>
                <div className="landing-feature-grid">
                    <div className="landing-feature-card">
                        <h3>🛠 Smart Form Builder</h3>
                        <p>Design forms easily with drag-and-drop functionality.</p>
                    </div>
                    <div className="landing-feature-card">
                        <h3>⚡ Workflow Automation</h3>
                        <p>Save time by automating your workflows seamlessly.</p>
                    </div>
                    <div className="landing-feature-card">
                        <h3>📈 Data Insights</h3>
                        <p>Analyze responses in real time with advanced reporting.</p>
                    </div>
                    <div className="landing-feature-card">
                        <h3>🔒 Secure Integrations</h3>
                        <p>Connect safely with trusted third-party tools.</p>
                    </div>
                </div>
            </section>

            {/* Integrations */}
            <section id="integrations" className="landing-integrations">
                <h2>Integrations</h2>
                <div className="landing-integrations-row">
                    <span><FaGoogle size={20} /> Google Sheets</span>
                    <span><FaSlack size={20} /> Slack</span>
                    <span><FaBolt size={20} /> Zapier</span>
                    <span><FaRegStickyNote size={20} /> Notion</span>
                    <span><FaDatabase size={20} /> Airtable</span>
                </div>
            </section>

            {/* How It Works */}
            <section id="howitworks" className="landing-howitworks">
                <h2>How It Works</h2>
                <div className="landing-steps">
                    <div className="landing-step">
                        <div className="landing-step-icon">📝</div>
                        <p>Step 1: Build your form.</p>
                    </div>
                    <div className="landing-step">
                        <div className="landing-step-icon">⚙️</div>
                        <p>Step 2: Automate workflows.</p>
                    </div>
                    <div className="landing-step">
                        <div className="landing-step-icon">📊</div>
                        <p>Step 3: Analyze results.</p>
                    </div>
                </div>
            </section>

            {/* Templates */}
            <section id="templates" className="landing-templates">
                <h2>Templates</h2>
                <div className="landing-template-grid">
                    <div className="landing-template-card">
                        <div className="landing-template-preview">📋 Survey Form</div>
                        <button className="landing-btn-secondary">Use Template</button>
                    </div>
                    <div className="landing-template-card">
                        <div className="landing-template-preview">📝 Registration Form</div>
                        <button className="landing-btn-secondary">Use Template</button>
                    </div>
                    <div className="landing-template-card">
                        <div className="landing-template-preview">💬 Feedback Form</div>
                        <button className="landing-btn-secondary">Use Template</button>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="landing-testimonials">
                <h2>What Our Users Say</h2>
                <div className="landing-testimonial-grid">
                    <div className="landing-testimonial-card">
                        <div className="landing-avatar">👩‍💼</div>
                        <h4>Alice, Product Manager</h4>
                        <p>"dForms made collecting feedback a breeze! Our whole team adopted it within days."</p>
                    </div>
                    <div className="landing-testimonial-card">
                        <div className="landing-avatar">👨‍💻</div>
                        <h4>Bob, Developer</h4>
                        <p>"The Slack integration saves us hours every week. It feels like forms finally work with us."</p>
                    </div>
                    <div className="landing-testimonial-card">
                        <div className="landing-avatar">👩‍🎨</div>
                        <h4>Clara, Designer</h4>
                        <p>"I love the templates! They look clean, modern, and I barely have to customize anything."</p>
                    </div>
                    <div className="landing-testimonial-card">
                        <div className="landing-avatar">👨‍🔧</div>
                        <h4>David, Startup Founder</h4>
                        <p>"We built our onboarding form in 10 minutes and connected it to Airtable—game changer!"</p>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="landing-pricing">
                <h2>Pricing</h2>
                <div className="landing-pricing-grid">
                    <div className="landing-pricing-card">
                        <h3>Free Plan</h3>
                        <p>$0/month</p>
                        <ul>
                            <li>Basic form builder</li>
                            <li>100 responses/month</li>
                        </ul>
                    </div>
                    <div className="landing-pricing-card landing-pricing-highlight">
                        <h3>Pro Plan</h3>
                        <p>$19/month</p>
                        <ul>
                            <li>Unlimited responses</li>
                            <li>Advanced integrations</li>
                            <li>Priority support</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="landing-cta-banner">
                <h2>Start building with dForms today.</h2>
                <button className="landing-btn-outline">Sign Up Free</button>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-footer-links">
                    <a href="#about">About</a>
                    <a href="#blog">Blog</a>
                    <a href="#careers">Careers</a>
                    <a href="#privacy">Privacy Policy</a>
                    <a href="#terms">Terms</a>
                </div>
                <div className="landing-socials">
                    <span>🔗 LinkedIn</span>
                    <span>🐦 Twitter</span>
                    <span>💻 GitHub</span>
                </div>
                <p>© {new Date().getFullYear()} dForms. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;

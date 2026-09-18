import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('metricheck_token');
    setIsAuthenticated(!!token);
  }, []);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      <style>{`
        .landing-page {
          --navy: #0e2148;
          --navy-2: #16315f;
          --ink: #121a2b;
          --body: #48546b;
          --saffron: #e07b1f;
          --saffron-soft: #fff1e0;
          --green: #137a4d;
          --green-soft: #e6f4ec;
          --line: #dde3ee;
          --paper: #ffffff;
          --wash: #f5f7fb;
          --radius: 14px;
          --shadow: 0 18px 44px -28px rgba(14,33,72,.45);
          background: var(--paper);
          color: var(--ink);
          font-family: Inter, "Noto Sans Devanagari", system-ui, sans-serif;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }
        .landing-page * { box-sizing: border-box; }
        .landing-page h1, .landing-page h2, .landing-page h3 {
          font-family: "Source Serif 4", Georgia, serif;
          line-height: 1.15;
          margin: 0;
          letter-spacing: -.01em;
        }
        .landing-page a { color: inherit; }
        .landing-page .wrap { max-width: 1140px; margin: 0 auto; padding: 0 22px; }
        .landing-page .hi { font-family: "Noto Sans Devanagari", sans-serif; color: var(--body); font-weight: 600; }

        /* top strip */
        .landing-page .gov-strip { background: var(--navy); color: #cfd9ee; font-size: 12.5px; padding: 7px 0; letter-spacing: .02em; }
        .landing-page .gov-strip .wrap { display: flex; gap: 14px; justify-content: space-between; flex-wrap: wrap; }
        .landing-page .tri { display: inline-flex; gap: 4px; vertical-align: middle; margin-right: 8px; }
        .landing-page .tri i { width: 12px; height: 8px; display: block; border-radius: 1px; }
        .landing-page .tri i:nth-child(1) { background: #e07b1f; }
        .landing-page .tri i:nth-child(2) { background: #fff; }
        .landing-page .tri i:nth-child(3) { background: #137a4d; }

        .landing-page header { position: sticky; top: 0; z-index: 40; background: rgba(255,255,255,.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
        .landing-page nav { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 14px 0; }
        .landing-page .brand { display: flex; align-items: center; gap: 11px; font-weight: 700; font-size: 18px; text-decoration: none; cursor: pointer; }
        .landing-page .seal { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(140deg,var(--navy),#28477f); color: #fff; display: grid; place-items: center; font-family: "Source Serif 4",serif; font-size: 17px; box-shadow: var(--shadow); }
        .landing-page .brand small { display: block; font-size: 11px; font-weight: 500; color: var(--body); letter-spacing: .06em; text-transform: uppercase; }
        .landing-page .links { display: flex; gap: 26px; font-size: 14.5px; font-weight: 500; color: var(--body); }
        .landing-page .links a { text-decoration: none; transition: color .15s ease; cursor: pointer; }
        .landing-page .links a:hover { color: var(--navy); }
        
        .landing-page .btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 9px !important;
          border-radius: 12px !important;
          padding: 12px 24px !important;
          font-weight: 700 !important;
          font-size: 14.5px !important;
          text-decoration: none !important;
          border: 1.5px solid transparent !important;
          cursor: pointer !important;
          height: auto !important;
          min-height: 44px !important;
          line-height: normal !important;
          text-transform: none !important;
          transition: all .2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .landing-page .btn:active {
          transform: scale(0.98) !important;
        }
        .landing-page .btn-primary {
          background: linear-gradient(135deg, #e07b1f 0%, #c96a15 100%) !important;
          color: #ffffff !important;
          border-color: #b75e0e !important;
          box-shadow: 0 10px 25px -5px rgba(224,123,31,0.45), 0 4px 10px -2px rgba(224,123,31,0.3) !important;
        }
        .landing-page .btn-primary:hover {
          background: linear-gradient(135deg, #ea8528 0%, #d4731b 100%) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 14px 28px -6px rgba(224,123,31,0.55), 0 6px 12px -3px rgba(224,123,31,0.35) !important;
        }
        .landing-page .btn-ghost {
          border-color: #cbd5e1 !important;
          color: var(--navy) !important;
          background: #ffffff !important;
          box-shadow: 0 2px 6px -1px rgba(15, 23, 42, 0.08) !important;
        }
        .landing-page .btn-ghost:hover {
          border-color: var(--navy) !important;
          background: var(--wash) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.12) !important;
        }
        @media(max-width:880px){.landing-page .links{display:none}}

        /* hero */
        .landing-page .hero {
          background:
            radial-gradient(900px 420px at 88% -12%, #eaf0fb 0%, transparent 60%),
            linear-gradient(180deg,#fbfcfe,#fff);
          border-bottom: 1px solid var(--line);
        }
        .landing-page .hero .wrap {
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: 56px;
          align-items: center;
          padding: 72px 22px 78px;
        }
        .landing-page .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: var(--saffron-soft);
          color: #a75a10;
          border: 1px solid #f4d8ba;
          font-size: 12.5px;
          font-weight: 600;
          padding: 6px 13px;
          border-radius: 999px;
        }
        .landing-page h1 {
          font-size: clamp(34px,4.6vw,54px);
          margin: 20px 0 6px;
          color: var(--ink);
        }
        .landing-page .h1-hi {
          font-family: "Noto Sans Devanagari",sans-serif;
          font-size: clamp(17px,2vw,22px);
          color: var(--navy-2);
          font-weight: 600;
          margin-bottom: 18px;
        }
        .landing-page .lede {
          color: var(--body);
          font-size: 17px;
          max-width: 52ch;
          margin: 0;
        }
        .landing-page .cta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin: 28px 0 22px;
        }
        .landing-page .trust {
          display: flex;
          gap: 22px;
          flex-wrap: wrap;
          font-size: 13px;
          color: var(--body);
        }
        .landing-page .trust span {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .landing-page .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--green);
          display: inline-block;
        }

        /* phone mock */
        .landing-page .phone {
          width: 300px;
          margin-inline: auto;
          border-radius: 34px;
          border: 1px solid var(--line);
          background: #fff;
          box-shadow: 0 40px 70px -40px rgba(14,33,72,.6);
          padding: 12px;
          position: relative;
        }
        .landing-page .phone:before {
          content: "";
          position: absolute;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          width: 86px;
          height: 6px;
          border-radius: 99px;
          background: #e7ebf3;
        }
        .landing-page .screen {
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid #eef1f7;
          background: var(--wash);
        }
        .landing-page .sc-top {
          background: var(--navy);
          color: #fff;
          padding: 26px 16px 14px;
          font-size: 13px;
        }
        .landing-page .sc-top b {
          display: block;
          font-size: 15px;
        }
        .landing-page .sc-body {
          padding: 14px;
          display: grid;
          gap: 10px;
        }
        .landing-page .card {
          background: #fff !important;
          border: 1px solid var(--line) !important;
          border-radius: 12px !important;
          padding: 12px !important;
          box-shadow: none !important;
        }
        .landing-page .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          color: var(--body);
        }
        .landing-page .pill {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 99px;
        }
        .landing-page .pill.bad {
          background: #fdeaea;
          color: #b12727;
        }
        .landing-page .pill.ok {
          background: var(--green-soft);
          color: var(--green);
        }
        .landing-page .bar {
          height: 7px;
          border-radius: 99px;
          background: #eef1f7;
          overflow: hidden;
          margin-top: 9px;
        }
        .landing-page .bar i {
          display: block;
          height: 100%;
          width: 72%;
          background: linear-gradient(90deg,var(--saffron),#f2a95a);
        }
        .landing-page .mini {
          font-size: 11px;
          color: #8792a6;
        }
        .landing-page .shot {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 6px;
          margin-top: 9px;
        }
        .landing-page .shot i {
          aspect-ratio: 1;
          border-radius: 7px;
          background: linear-gradient(135deg,#dde5f3,#c8d5ea);
          display: block;
        }

        /* stats */
        .landing-page .stats {
          background: var(--navy) !important;
          color: #fff !important;
          border-radius: 0 !important;
          border: none !important;
          box-shadow: none !important;
          display: block !important;
        }
        .landing-page .stats .wrap {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 20px;
          padding: 34px 22px;
        }
        .landing-page .stat {
          display: block !important;
          padding: 0 !important;
          border: none !important;
        }
        .landing-page .stat b {
          font-family: "Source Serif 4",serif;
          font-size: 30px;
          display: block;
          color: #fff;
        }
        .landing-page .stat span {
          font-size: 13px;
          color: #b9c6e2;
        }

        .landing-page section {
          padding: 78px 0;
        }
        .landing-page .sec-head {
          max-width: 640px;
          margin-bottom: 38px;
        }
        .landing-page .sec-head h2 {
          font-size: clamp(26px,3vw,36px);
          color: var(--ink);
        }
        .landing-page .sec-head p {
          color: var(--body);
          margin-top: 12px;
        }
        .landing-page .kicker {
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--saffron);
        }

        .landing-page .grid3 {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 20px;
        }
        .landing-page .feat {
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 24px;
          background: #fff;
          transition: .18s ease;
        }
        .landing-page .feat:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow);
          border-color: #c8d3e8;
        }
        .landing-page .ico {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: var(--wash);
          border: 1px solid var(--line);
          display: grid;
          place-items: center;
          font-size: 19px;
          margin-bottom: 14px;
        }
        .landing-page .feat h3 {
          font-size: 18px;
          margin-bottom: 6px;
          color: var(--ink);
        }
        .landing-page .feat p {
          color: var(--body);
          font-size: 14.5px;
          margin: 0;
        }

        .landing-page .steps {
          background: var(--wash) !important;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          border-radius: 0 !important;
          display: block !important;
        }
        .landing-page .step {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 24px;
          position: relative;
          display: block !important;
          text-align: left !important;
        }
        .landing-page .step b.num {
          position: absolute;
          top: -14px;
          left: 22px;
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: var(--navy);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 14px;
          font-family: Inter, sans-serif;
        }
        .landing-page .step h3 {
          font-size: 17px;
          margin: 10px 0 6px;
          color: var(--ink);
        }
        .landing-page .step p {
          color: var(--body);
          font-size: 14.5px;
          margin: 0;
        }

        .landing-page .split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .landing-page ul.check {
          list-style: none;
          padding: 0;
          margin: 20px 0 0;
          display: grid;
          gap: 12px;
        }
        .landing-page ul.check li {
          display: flex;
          gap: 11px;
          font-size: 15px;
          color: var(--body);
        }
        .landing-page ul.check b {
          color: var(--ink);
        }
        .landing-page .tick {
          flex: none;
          width: 21px;
          height: 21px;
          border-radius: 50%;
          background: var(--green-soft);
          color: var(--green);
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 700;
          margin-top: 2px;
        }
        .landing-page .panel {
          border: 1px solid var(--line);
          border-radius: var(--radius);
          background: #fff;
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .landing-page .panel .ph {
          background: var(--wash);
          border-bottom: 1px solid var(--line);
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          color: var(--navy);
        }
        .landing-page .panel .pb {
          padding: 16px;
          display: grid;
          gap: 10px;
        }
        .landing-page .lrow {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 13.5px;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 10px;
        }
        .landing-page .lrow span {
          color: var(--body);
        }

        .landing-page .quote {
          border-left: 3px solid var(--saffron);
          padding-left: 20px;
          font-family: "Source Serif 4", serif;
          font-size: 19px;
          line-height: 1.5;
          color: var(--ink);
        }
        .landing-page .who {
          margin-top: 14px;
          font-size: 13.5px;
          color: var(--body);
          font-family: Inter, sans-serif;
        }

        .landing-page .cta-band {
          background: linear-gradient(120deg,var(--navy),#23417a);
          color: #fff;
          border-radius: 18px;
          padding: 46px;
          display: flex;
          justify-content: space-between;
          gap: 28px;
          align-items: center;
          flex-wrap: wrap;
        }
        .landing-page .cta-band h2 {
          font-size: 30px;
          color: #fff;
        }
        .landing-page .cta-band p {
          color: #c3d0ea;
          margin: 10px 0 0;
          max-width: 46ch;
        }

        .landing-page footer {
          border-top: 1px solid var(--line);
          padding: 38px 0;
          font-size: 13.5px;
          color: var(--body);
          background: #fff;
        }
        .landing-page .fgrid {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .landing-page .fgrid a {
          text-decoration: none;
          display: block;
          margin-bottom: 7px;
          color: var(--body);
          transition: color .15s ease;
        }
        .landing-page .fgrid a:hover {
          color: var(--navy);
        }
        .landing-page .fcol b {
          display: block;
          color: var(--ink);
          margin-bottom: 10px;
          font-size: 13px;
        }

        @media(max-width:900px){
          .landing-page .hero .wrap { grid-template-columns: 1fr; gap: 40px; padding: 52px 22px; }
          .landing-page .grid3 { grid-template-columns: 1fr; }
          .landing-page .split { grid-template-columns: 1fr; gap: 30px; }
          .landing-page .stats .wrap { grid-template-columns: repeat(2,1fr); }
          .landing-page .cta-band { padding: 32px; }
          .landing-page section { padding: 56px 0; }
        }
        @media(max-width:560px){
          .landing-page nav { flex-wrap: wrap; gap: 10px; }
          .landing-page .brand { font-size: 16px; }
          .landing-page .btn { padding: 9px 14px !important; font-size: 13.5px !important; }
          .landing-page .stats .wrap { grid-template-columns: 1fr; }
          .landing-page .cta-band h2 { font-size: 25px; }
        }
      `}</style>

      {/* ── GOV STRIP ── */}
      <div className="gov-strip">
        <div className="wrap">
          <span>
            <span className="tri">
              <i />
              <i />
              <i />
            </span>
            For Legal Metrology Departments · विधिक माप विज्ञान विभाग
          </span>
          <span>Helpdesk 1800-11-4000 · support@metricheck.ai</span>
        </div>
      </div>

      {/* ── STICKY HEADER ── */}
      <header>
        <div className="wrap">
          <nav>
            <a className="brand" href="#top" onClick={scrollTo('top')}>
              <span className="seal">M</span>
              <span>
                MetriCheck AI<small>Inspection Platform</small>
              </span>
            </a>

            <div className="links">
              <a href="#features" onClick={scrollTo('features')}>Features</a>
              <a href="#how" onClick={scrollTo('how')}>How it works</a>
              <a href="#compliance" onClick={scrollTo('compliance')}>Compliance</a>
              <a href="#voices" onClick={scrollTo('voices')}>Officers</a>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {isAuthenticated ? (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/inspector/dashboard')}
                >
                  Go to Dashboard →
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-ghost"
                    onClick={() => navigate('/login')}
                  >
                    Officer login
                  </button>
                  <a className="btn btn-primary" href="#demo" onClick={scrollTo('demo')}>
                    Request a demo
                  </a>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main id="top">
        {/* ── HERO ── */}
        <section className="hero">
          <div className="wrap">
            <div>
              <span className="eyebrow">● Built for field inspections under the Legal Metrology Act, 2009</span>
              <h1>Every inspection, documented to the letter of the law.</h1>
              <p className="h1-hi">हर निरीक्षण — प्रमाणित, द्विभाषी और कानून-सम्मत।</p>
              <p className="lede">
                MetriCheck AI guides Legal Metrology officers through declaration checks, captures tamper-proof photo evidence,
                flags violations against the exact rule, and files a signed report before you leave the shop.
              </p>
              <div className="cta">
                <a className="btn btn-primary" href="#demo" onClick={scrollTo('demo')}>
                  Request a department demo →
                </a>
                <a className="btn btn-ghost" href="#how" onClick={scrollTo('how')}>
                  See the inspection flow
                </a>
              </div>
              <div className="trust">
                <span>
                  <i className="dot" />
                  Works offline in the field
                </span>
                <span>
                  <i className="dot" />
                  Hindi + English throughout
                </span>
                <span>
                  <i className="dot" />
                  Data hosted in India
                </span>
              </div>
            </div>

            {/* ── PHONE MOCK ── */}
            <div className="phone" aria-hidden="true">
              <div className="screen">
                <div className="sc-top">
                  <span style={{ opacity: 0.75 }}>Inspection · निरीक्षण</span>
                  <b>Shree Traders, Sector 14</b>
                  <span style={{ opacity: 0.75 }}>ID: LM-2026-04812</span>
                </div>
                <div className="sc-body">
                  <div className="card">
                    <div className="row">
                      <b style={{ color: 'var(--ink)' }}>Packaged Atta 5 kg</b>
                      <span className="pill bad">3 violations</span>
                    </div>
                    <div className="mini" style={{ marginTop: '6px' }}>
                      MRP not legible · Net qty font undersized · Missing consumer care
                    </div>
                    <div className="bar">
                      <i />
                    </div>
                    <div className="mini" style={{ marginTop: '6px' }}>
                      AI confidence 92% · Rule 6(1), LMPC 2011
                    </div>
                    <div className="shot">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                  <div className="card">
                    <div className="row">
                      <b style={{ color: 'var(--ink)' }}>Edible Oil 1 L</b>
                      <span className="pill ok">Compliant</span>
                    </div>
                    <div className="mini" style={{ marginTop: '6px' }}>
                      सभी घोषणाएँ सत्यापित
                    </div>
                  </div>
                  <div
                    className="card"
                    style={{ background: 'var(--navy)', borderColor: 'var(--navy)', color: '#fff', cursor: 'pointer' }}
                    onClick={() => navigate('/login')}
                  >
                    <div className="row" style={{ color: '#c9d5ee' }}>
                      <span>Report ready</span>
                      <b style={{ color: '#fff' }}>Submit →</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="stats" style={{ padding: 0 }}>
          <div className="wrap">
            <div className="stat">
              <b>18 min</b>
              <span>Average inspection time, down from 55</span>
            </div>
            <div className="stat">
              <b>96%</b>
              <span>Declaration errors caught automatically</span>
            </div>
            <div className="stat">
              <b>12</b>
              <span>Guided screens from login to filed report</span>
            </div>
            <div className="stat">
              <b>0</b>
              <span>Paper forms carried to the field</span>
            </div>
          </div>
        </section>

        {/* ── FEATURES / CAPABILITIES ── */}
        <section id="features">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">Capabilities</span>
              <h2>Field tools that hold up in a hearing.</h2>
              <p>Each module maps to a statutory requirement, so the evidence you collect is the evidence a court expects.</p>
            </div>
            <div className="grid3">
              <div className="feat">
                <div className="ico">◎</div>
                <h3>AI declaration scan</h3>
                <p>
                  Point the camera at a package. MetriCheck reads MRP, net quantity, manufacturer and date, then compares each
                  declaration against the applicable rule.
                </p>
              </div>
              <div className="feat">
                <div className="ico">⚖</div>
                <h3>Rule-linked violations</h3>
                <p>
                  Every flag cites the exact section — LMPC Rule 6, 9 or 18 — with suggested action, penalty range and precedent notes.
                </p>
              </div>
              <div className="feat">
                <div className="ico">◧</div>
                <h3>Tamper-proof evidence</h3>
                <p>
                  Photos are stamped with GPS, time and officer ID at capture, hashed on device, and locked to the case file.
                </p>
              </div>
              <div className="feat">
                <div className="ico">⌁</div>
                <h3>Offline-first</h3>
                <p>
                  Godowns and rural markets rarely have signal. Inspections run fully offline and sync the moment you are back on network.
                </p>
              </div>
              <div className="feat">
                <div className="ico">अ</div>
                <h3>True bilingual interface</h3>
                <p>
                  Hindi and English on every label, notice and printed report — switchable mid-inspection without losing entered data.
                </p>
              </div>
              <div className="feat">
                <div className="ico">↗</div>
                <h3>One-tap filing</h3>
                <p>
                  Generate the signed report, push it to the department portal, and hand the shopkeeper a QR-verifiable copy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── INSPECTION FLOW ── */}
        <section className="steps" id="how">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">Inspection flow</span>
              <h2>Login to filed report in four steps.</h2>
              <p className="hi">निरीक्षण की पूरी प्रक्रिया — चार चरणों में।</p>
            </div>
            <div className="grid3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              <div className="step">
                <b className="num">1</b>
                <h3>Verify &amp; open case</h3>
                <p>Officer signs in with Employee ID and OTP, then registers the premises and licence details.</p>
              </div>
              <div className="step">
                <b className="num">2</b>
                <h3>Scan products</h3>
                <p>Capture each package. The assistant extracts declarations and prompts for anything unreadable.</p>
              </div>
              <div className="step">
                <b className="num">3</b>
                <h3>Review violations</h3>
                <p>Confirm or dismiss each AI flag, add observations, and attach supporting photographs.</p>
              </div>
              <div className="step">
                <b className="num">4</b>
                <h3>Submit &amp; serve</h3>
                <p>Sign digitally, file to the portal, and share the PDF with the trader on the spot.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPLIANCE & GOVERNANCE ── */}
        <section id="compliance">
          <div className="wrap">
            <div className="split">
              <div>
                <span className="kicker">Governance</span>
                <h2 style={{ fontSize: '34px', marginTop: '8px' }}>
                  Built to departmental standards, not startup shortcuts.
                </h2>
                <ul className="check">
                  <li>
                    <i className="tick">✓</i>
                    <span>
                      <b>Role-based access</b> — inspector, senior officer and controller views with separate approval rights.
                    </span>
                  </li>
                  <li>
                    <i className="tick">✓</i>
                    <span>
                      <b>Full audit trail</b> — every edit, override and submission is time-stamped and attributable.
                    </span>
                  </li>
                  <li>
                    <i className="tick">✓</i>
                    <span>
                      <b>Data residency in India</b> — encrypted at rest, retained per departmental policy.
                    </span>
                  </li>
                  <li>
                    <i className="tick">✓</i>
                    <span>
                      <b>Portal integration</b> — reports flow straight into existing state Legal Metrology systems.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="panel">
                <div className="ph">Case file · LM-2026-04812</div>
                <div className="pb">
                  <div className="lrow">
                    <b>Products inspected</b>
                    <span>14</span>
                  </div>
                  <div className="lrow">
                    <b>Violations confirmed</b>
                    <span style={{ color: '#b12727', fontWeight: 600 }}>6</span>
                  </div>
                  <div className="lrow">
                    <b>Rules cited</b>
                    <span>Rule 6(1), 9(2), 18(4)</span>
                  </div>
                  <div className="lrow">
                    <b>Evidence photos</b>
                    <span>27 (hash-verified)</span>
                  </div>
                  <div className="lrow">
                    <b>Recommended action</b>
                    <span>Compounding notice</span>
                  </div>
                  <div className="lrow" style={{ background: 'var(--green-soft)', borderColor: '#bfe3cf' }}>
                    <b style={{ color: 'var(--green)' }}>Status</b>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>Filed · 11:42 IST</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── VOICES / OFFICERS ── */}
        <section id="voices" className="steps">
          <div className="wrap">
            <div className="split">
              <div>
                <div className="quote">
                  “We used to spend the evening writing up what we saw in the morning. Now the report is filed before I reach the next market.”
                </div>
                <p className="who">— Senior Inspector, Legal Metrology, Uttar Pradesh</p>
              </div>
              <div>
                <div className="quote">
                  “The rule reference on every flag is what convinced our controller. Nothing goes out without the section attached.”
                </div>
                <p className="who">— Controller of Legal Metrology, Maharashtra (pilot district)</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── DEMO CTA ── */}
        <section id="demo">
          <div className="wrap">
            <div className="cta-band">
              <div>
                <h2>Bring MetriCheck AI to your district.</h2>
                <p>Pilot deployments include officer training, portal integration and on-site support for the first inspection cycle.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a className="btn btn-primary" href="mailto:demo@metricheck.ai">
                  Request a demo
                </a>
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate('/login')}
                  style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.35)' }}
                >
                  Officer login
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer>
        <div className="wrap fgrid">
          <div style={{ maxWidth: '300px' }}>
            <a className="brand" href="#top" onClick={scrollTo('top')} style={{ marginBottom: '10px' }}>
              <span className="seal">M</span>
              <span>
                MetriCheck AI<small>Inspection Platform</small>
              </span>
            </a>
            <p style={{ margin: 0 }}>
              Compliance software for Legal Metrology enforcement. Not an official Government of India portal.
            </p>
          </div>
          <div className="fcol">
            <b>Platform</b>
            <a href="#features" onClick={scrollTo('features')}>Features</a>
            <a href="#how" onClick={scrollTo('how')}>Inspection flow</a>
            <a href="#compliance" onClick={scrollTo('compliance')}>Governance</a>
          </div>
          <div className="fcol">
            <b>Support</b>
            <a href="mailto:support@metricheck.ai">support@metricheck.ai</a>
            <a href="#demo" onClick={scrollTo('demo')}>Training &amp; onboarding</a>
            <a href="#top" onClick={scrollTo('top')}>Helpdesk 1800-11-4000</a>
          </div>
          <div className="fcol">
            <b>Legal</b>
            <a href="#top" onClick={scrollTo('top')}>Privacy policy</a>
            <a href="#top" onClick={scrollTo('top')}>Data retention</a>
            <a href="#top" onClick={scrollTo('top')}>Accessibility</a>
          </div>
        </div>
        <div className="wrap" style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid var(--line)', fontSize: '12.5px' }}>
          © 2026 MetriCheck AI · सर्वाधिकार सुरक्षित
        </div>
      </footer>
    </div>
  );
};

export default Landing;

import React, { useEffect, useMemo, useRef, useState } from "react";
import profileImg from "./assets/profile.jpg";
import GitHubProjects from "./GitHubProjects.jsx";
import BlogSection from "./blog/BlogSection.jsx";
import HackerNewsSection from "./HackerNewsSection.jsx";

const NAME = "KAJAN SIVARAJA";
const ROLE = "Cyber Security | Blue Team • Pentesting • Secure Coding";
const TAGLINE =
  "I build secure systems, break insecure ones, and translate risk into action.";
const CV_VIEW_URL = "https://drive.google.com/file/d/1IHY9_GvKuRiv4J3V6woCxJVla9xi1q2u/view?usp=sharing";
const CV_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=1IHY9_GvKuRiv4J3V6woCxJVla9xi1q2u";

const LINKS = [
  { label: "GitHub", href: "https://github.com/sksivakajan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/sivakajan/" },
  { label: "Email", href: "mailto:sivakajan0725@gmail.com" },
];
const HACK_TOOLS = ["Nmap", "Burp Suite", "Wireshark", "Metasploit", "OWASP ZAP", "Kali Linux"];

const SKILLS = [
  {
    group: "Security",
    items: ["SOC", "SIEM", "Threat Hunting", "Incident Response", "Vulnerability Management"],
  },
  { group: "Offense", items: ["Web Pentest", "Recon", "Burp Suite", "OWASP Top 10", "Nmap"] },
  { group: "Dev", items: ["Secure Coding", "React", "Node.js", "Python", "API Security"] },
  { group: "Tools", items: ["Wireshark", "ELK/Splunk", "Git", "Docker", "Linux"] },
];

const CERTS = [
  { name: "BSc (Hons) IT", meta: "Specializing in Cyber Security" },
  { name: "eJPT", meta: "Junior Penetration Tester" },
  { name: "ICCA", meta: "Cybersecurity Certification" },
];

function useRevealOnScroll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-visible")),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function formatPrompt(cmd) {
  return `kaju@security-lab:~$ ${cmd}`;
}

/** ✅ NEW: Connectivity panel (Public IP + Online/Offline + RTT) */
function ConnectivityPanel() {
  const [info, setInfo] = useState({
    online: navigator.onLine,
    publicIP: "Loading…",
    rtt: null,
    note: "",
  });

  useEffect(() => {
    const on = () => setInfo((s) => ({ ...s, online: true }));
    const off = () => setInfo((s) => ({ ...s, online: false }));
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        if (!alive) return;
        setInfo((s) => ({ ...s, publicIP: data?.ip || "Unknown" }));
      } catch {
        if (!alive) return;
        setInfo((s) => ({ ...s, publicIP: "Blocked / Failed", note: "Public IP fetch failed" }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      try {
        const t0 = performance.now();
        // no-cors allows measuring RTT-ish without reading response
        await fetch("https://www.google.com/generate_204", { mode: "no-cors" });
        const t1 = performance.now();
        if (!alive) return;
        setInfo((s) => ({ ...s, rtt: Math.round(t1 - t0) }));
      } catch {
        if (!alive) return;
        setInfo((s) => ({ ...s, rtt: null }));
      }
    };

    tick();
    const id = setInterval(tick, 6000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="card netCard" data-reveal>
      <div className="cardTitle">Connectivity</div>

      <div className="netRow">
        <span className={`netDot ${info.online ? "on" : "off"}`} />
        <span className="netLabel">{info.online ? "Online" : "Offline"}</span>
      </div>

      <div className="netGrid">
        <div className="netItem">
          <div className="netK">Public IP</div>
          <div className="netV">{info.publicIP}</div>
        </div>

        <div className="netItem">
          <div className="netK">RTT</div>
          <div className="netV">{info.rtt !== null ? `${info.rtt} ms` : "—"}</div>
        </div>
      </div>

      {info.note ? <div className="netNote">{info.note}</div> : null}
      <div className="netFoot">Auto updates • client-side</div>
    </div>
  );
}

function Terminal() {
  const [history, setHistory] = useState([
    { type: "out", text: "KAJU Terminal v2.6 — Type: help" },
    { type: "out", text: "Tip: try `skills`, `projects`, `certs`, `blog`, `contact`" },
  ]);
  const [value, setValue] = useState("");
  const endRef = useRef(null);

  const commands = useMemo(
    () => ({
      help: () => [
        "Available commands:",
        " - about",
        " - skills",
        " - projects",
        " - certs",
        " - blog",
        " - contact",
        " - clear",
      ],
      about: () => [TAGLINE, "Focus: security engineering, detection, and practical pentesting."],
      skills: () => SKILLS.flatMap((g) => [`${g.group}: ${g.items.join(", ")}`]),
      projects: () => ["Projects are auto-loaded from GitHub in the Projects section."],
      certs: () => CERTS.map((c) => `• ${c.name} — ${c.meta}`),
      blog: () => ["Blog posts live in src/blog/posts/*.md"],
      contact: () => [
        "Email: sivakajan0725@gmail.com",
        "GitHub: https://github.com/sksivakajan",
        "LinkedIn: https://www.linkedin.com/in/sivakajan/",
      ],
      clear: () => "__CLEAR__",
    }),
    []
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const run = (cmdRaw) => {
    const cmd = cmdRaw.trim();
    if (!cmd) return;

    setHistory((h) => [...h, { type: "in", text: formatPrompt(cmd) }]);

    const key = cmd.split(" ")[0].toLowerCase();
    const fn = commands[key];

    if (!fn) {
      setHistory((h) => [...h, { type: "out", text: `Command not found: ${key} (try help)` }]);
      return;
    }

    const res = fn();
    if (res === "__CLEAR__") {
      setHistory([{ type: "out", text: "KAJU Terminal v2.6 — Type: help" }]);
      return;
    }

    setHistory((h) => [...h, ...res.map((t) => ({ type: "out", text: t }))]);
  };

  return (
    <div className="terminal" data-reveal>
      <div className="terminalTop">
        <div className="dots">
          <span className="dot r" />
          <span className="dot y" />
          <span className="dot g" />
        </div>
        <div className="termTitle">interactive_shell</div>
        <div className="termMeta">secure • fast • minimal</div>
      </div>

      <div className="terminalBody" role="log" aria-live="polite">
        {history.map((line, idx) => (
          <div key={idx} className={`termLine ${line.type}`}>
            {line.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="terminalInput"
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
          setValue("");
        }}
      >
        <span className="prompt">›</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="type a command…"
          spellCheck={false}
        />
        <button type="submit" className="btn mini">
          Run
        </button>
      </form>
    </div>
  );
}

function HackBanner() {
  return (
    <div className="hackBanner" data-reveal>
      <div className="hackBannerHead">
        <div className="hackLogo" aria-hidden="true">
          <span />
        </div>
        <div className="hackTitle">Hacking Tools</div>
      </div>

      <div className="hackToolsRow">
        {HACK_TOOLS.map((tool) => (
          <span key={tool} className="hackTag">
            <span className="hackTagDot" />
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
}
/** ✅ FIXED: smoother radar movement */
function ThreatRadar() {
  const [level, setLevel] = useState(72);

  useEffect(() => {
    const t = setInterval(() => {
      setLevel((v) => {
        const drift = (Math.random() * 2 - 1) * 1.6; // smooth drift
        return clamp(v + drift, 35, 96);
      });
    }, 350);
    return () => clearInterval(t);
  }, []);

  const status =
    level > 80 ? "ELEVATED" : level > 60 ? "MONITORING" : level > 45 ? "STABLE" : "LOW";

  return (
    <div className="radarCard" data-reveal>
      <div className="radarHeader">
        <div>
          <div className="radarTitle">Threat Radar</div>
          <div className="radarSub">signal integrity • anomaly awareness</div>
        </div>
        <div className="radarStat">
          <div className="radarNum">{Math.round(level)}%</div>
          <div className={`radarBadge ${status.toLowerCase()}`}>{status}</div>
        </div>
      </div>

      <div className="radar">
        <div className="radarGrid" />
        <div className="radarSweep" />
        <div className="radarBlips">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className={`blip b${i + 1}`} />
          ))}
        </div>
        <div className="radarCenter" />
      </div>

      <div className="radarFooter">
        <div className="miniLine">
          <span className="k">Mode:</span> Adaptive Scan
        </div>
        <div className="miniLine">
          <span className="k">Telemetry:</span> Active
        </div>
        <div className="miniLine">
          <span className="k">Last update:</span> just now
        </div>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <header className="nav">
      <div className="navInner">
        <a className="brand" href="#top" aria-label="Home">
          <span className="brandMark" />
          <span className="brandText">KAJU_SEC</span>
        </a>

        <nav className="navLinks" aria-label="Primary">
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#hn-news">News</a>
          <a href="#blog">Blog</a>
          <a href="#certs">Certs</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="btn" href="#contact">
          Hire / Collab
        </a>
      </div>
    </header>
  );
}

function Section({ id, title, eyebrow, children }) {
  return (
    <section className="section" id={id}>
      <div className="sectionHead" data-reveal>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="heroLeft" data-reveal>
        <div className="pill">
          <span className="pulseDot" />
          Available for internships • projects • research
        </div>

        {/* ✅ FIXED #2: Profile moved top of name + BIG + glitch style */}
        <div className="heroIdentity" data-reveal>
          <div className="avatarGlitchBox" aria-label="Profile">
            <img className="avatarMain" src={profileImg} alt="Kajan profile" />
            <img className="avatarGhost g1" src={profileImg} alt="" />
            <img className="avatarGhost g2" src={profileImg} alt="" />
            <span className="avatarScan" />
          </div>

          <div className="heroIdMeta">
            <div className="heroKaju">KAJU_SEC</div>
            <div className="heroMini">Cyber Security • SOC • AppSec</div>
          </div>
        </div>

        <h1 className="glitch" data-text={NAME}>
          {NAME}
        </h1>

        <p className="role">{ROLE}</p>
        <p className="tagline">{TAGLINE}</p>

        <div className="ctaRow">
          <a className="btn primary" href="#projects">
            View Projects
          </a>
          <a className="btn ghost" href="#blog">
            Read Blog
          </a>
          <a className="btn ghost" href={CV_VIEW_URL} target="_blank" rel="noreferrer">
            View CV
          </a>
          <a className="btn" href={CV_DOWNLOAD_URL} target="_blank" rel="noreferrer">
            Download CV
          </a>
        </div>

        <div className="linkRow">
          {LINKS.map((l) => (
            <a key={l.label} className="chip" href={l.href} target="_blank" rel="noreferrer">
              <span className="chipDot" />
              {l.label}
            </a>
          ))}
        </div>

        {/* ✅ FIXED #3: Fill empty space with connectivity */}
        <ConnectivityPanel />

        <div className="metrics">
          <div className="metric">
            <div className="metricNum">01</div>
            <div className="metricText">Security mindset</div>
          </div>
          <div className="metric">
            <div className="metricNum">02</div>
            <div className="metricText">Hands-on projects</div>
          </div>
          <div className="metric">
            <div className="metricNum">03</div>
            <div className="metricText">Fast learning</div>
          </div>
        </div>
      </div>

      <div className="heroRight">
        <ThreatRadar />
        <Terminal />
        <HackBanner />
      </div>
    </section>
  );
}

function Skills() {
  return (
    <Section id="skills" title="Skills that ship real security" eyebrow="CAPABILITIES">
      <div className="grid2">
        {SKILLS.map((g) => (
          <div className="card" key={g.group} data-reveal>
            <div className="cardTitle">{g.group}</div>
            <div className="pillWrap">
              {g.items.map((s) => (
                <span className="pillSkill" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Projects() {
  return (
    <Section id="projects" title="Projects from GitHub" eyebrow="AUTO LOADED">
      <GitHubProjects username="sksivakajan" />
    </Section>
  );
}

function Blog() {
  return (
    <Section id="blog" title="Blog / Writeups" eyebrow="MY POSTS">
      <BlogSection />
    </Section>
  );
}

function HackerNews() {
  return (
    <Section id="hn-news" title="Hacker News Latest" eyebrow="LIVE FEED">
      <HackerNewsSection count={6} />
    </Section>
  );
}

function Certs() {
  return (
    <Section id="certs" title="Education & Certifications" eyebrow="CREDENTIALS">
      <div className="grid3">
        {CERTS.map((c) => (
          <div className="card cert" key={c.name} data-reveal>
            <div className="certName">{c.name}</div>
            <div className="certMeta">{c.meta}</div>
            <div className="certLine" />
            <div className="certFoot">Verified • Practical • Skill-first</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    company: "",
  });
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          company: form.company,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to send message.");
      }

      setStatus("success");
      setForm({ name: "", email: "", message: "", company: "" });
    } catch (err) {
      setStatus("error");
      setErrorMessage(err?.message || "Failed to send message.");
    }
  }

  return (
    <Section id="contact" title="Contact" eyebrow="LET’S BUILD">
      <div className="grid2">
        <div className="card" data-reveal>
          <div className="cardTitle">Send a message</div>
          <p className="cardBody">
            Want a security review, secure coding advice, or collaboration? Send a message.
          </p>

          <form className="form" onSubmit={onSubmit}>
            <div className="row">
              <input
                placeholder="Your name"
                required
                minLength={2}
                maxLength={80}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                placeholder="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <textarea
              placeholder="Message"
              rows={5}
              required
              minLength={10}
              maxLength={5000}
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            />

            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
              style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
              aria-hidden="true"
            />

            <button className="btn primary" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : "Send"}
            </button>

            {status === "success" ? <p className="cardBody">✅ Message sent!</p> : null}
            {status === "error" ? <p className="cardBody">{errorMessage}</p> : null}
          </form>
        </div>

        <div className="card" data-reveal>
          <div className="cardTitle">Quick links</div>
              <div className="stack" style={{ marginTop: 12 }}>
                {LINKS.map((l) => (
                  <a
                    key={l.label}
                    className="quick"
                    href={l.href}
                    target={l.target || "_blank"}
                    rel={l.target === "_blank" ? "noreferrer" : undefined}
                    download={l.download}
                  >
                    <span className="quickIcon" />
                    <div className="quickBody">
                      <div className="quickTitle">{l.label}</div>
                      <div className="quickMeta">{l.href}</div>
                    </div>
                    <span className="arrow">↗</span>
                  </a>
                ))}
              </div>

          <div className="divider" />

          <div className="miniReadout">
            <div className="miniRow">
              <span className="k">Status:</span> available for opportunities
            </div>
            <div className="miniRow">
              <span className="k">Theme:</span> neon glass + terminal UI
            </div>
            <div className="miniRow">
              <span className="k">Build:</span> React + CSS
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <div className="footerInner">
        <div className="footerLeft">
          <span className="brandMark sm" />
          <span>
            © {new Date().getFullYear()} {NAME}
          </span>
        </div>
        <div className="footerRight">
          <a href="#top">Back to top</a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  useRevealOnScroll();

  useEffect(() => {
    const onMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      document.documentElement.style.setProperty("--mx", x.toFixed(4));
      document.documentElement.style.setProperty("--my", y.toFixed(4));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="app">
      <div className="fx">
        <div className="grid" />
        <div className="scan" />
        <div className="noise" />
        <div className="vignette" />
      </div>

      <Nav />
      <main className="wrap">
        <Hero />
        <Skills />
        <Projects />
        <HackerNews />
        <Blog />
        <Certs />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}


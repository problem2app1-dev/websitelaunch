import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  FileText,
  Fingerprint,
  Headphones,
  LockKeyhole,
  Linkedin,
  MoveUpRight,
  MousePointer2,
  ShieldCheck,
  Users,
  BarChart3,
} from "lucide-react";
import { Link } from "wouter";
import { BookingLink, SiteLayout } from "@/components/SiteLayout";
import { ToolLogos } from "@/components/BrandLogo";
import HeroWorkspace from "@/components/HeroWorkspace";
import Reveal from "@/components/Reveal";
export { Brand, BookingLink } from "@/components/SiteLayout";
const tools = [
  {
    id: "invoice",
    category: "GET PAID",
    title: "Invoices that mean business.",
    short: "Invoices",
    text: "Create a branded invoice. Check the totals. Download the PDF.",
    icon: FileText,
    action: "Make an invoice",
    color: "violet",
  },
  {
    id: "payroll",
    category: "LOOK AFTER YOUR TEAM",
    title: "Payday, minus the spreadsheet.",
    short: "Payroll",
    text: "Adjust pay for a sample team. Get a calculated payslip.",
    icon: Users,
    action: "Try payroll",
    color: "peach",
  },
  {
    id: "voice",
    category: "CATCH THE NEXT OPPORTUNITY",
    title: "An agent that picks up.",
    short: "Voice agents",
    text: "Walk through a warehouse sales conversation.",
    icon: Headphones,
    action: "Meet the agent",
    color: "blue",
  },
  {
    id: "dashboard",
    category: "SEE THE BIG PICTURE",
    title: "Your numbers. Finally clear.",
    short: "Dashboards",
    text: "Explore revenue, channels and useful insights.",
    icon: BarChart3,
    action: "Explore dashboard",
    color: "mint",
  },
  {
    id: "attendance",
    category: "KEEP THE DAY MOVING",
    title: "Clock in. Carry on.",
    short: "Attendance",
    text: "Punch in, track time and export the team log.",
    icon: Fingerprint,
    action: "Try attendance",
    color: "pink",
  },
];
function CardPreview({ id }: { id: string }) {
  if (id === "invoice")
    return (
      <div className="tile-preview invoice-tile" aria-hidden="true">
        <span className="mini-doc">
          <FileText size={24} />
          <i />
          <i />
          <b>$3,000.00</b>
        </span>
        <div>
          <span className="mini-check">
            <Check size={14} /> Totals calculated
          </span>
          <span className="mini-download">
            <Download size={16} /> Your invoice.pdf
          </span>
        </div>
      </div>
    );
  if (id === "payroll")
    return (
      <div className="tile-preview payroll-tile" aria-hidden="true">
        <div className="avatar-stack">
          <span>AJ</span>
          <span>MP</span>
          <span>SK</span>
          <span>+2</span>
        </div>
        <span className="payroll-tag">
          <Check size={13} /> 5 sample employees
        </span>
      </div>
    );
  if (id === "voice")
    return (
      <div className="tile-preview voice-tile" aria-hidden="true">
        <span className="voice-sphere">
          <Headphones size={28} />
        </span>
        <div className="wave-bars">
          {[12, 22, 37, 26, 45, 32, 19, 35, 24, 12].map((v, i) => (
            <i key={i} style={{ height: v }} />
          ))}
        </div>
        <span>Let's talk stock.</span>
      </div>
    );
  if (id === "dashboard")
    return (
      <div className="tile-preview chart-tile" aria-hidden="true">
        <div>
          <span>Revenue overview</span>
          <b>See the trend ↗</b>
        </div>
        <svg viewBox="0 0 250 75" preserveAspectRatio="none">
          <path
            d="M0 64 C20 62 25 42 43 49 S72 65 87 40 S115 55 137 29 S162 35 180 16 S217 37 250 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path d="M0 74 H250" stroke="currentColor" opacity=".15" />
        </svg>
      </div>
    );
  return (
    <div className="tile-preview attendance-tile" aria-hidden="true">
      <span className="clock-ring">
        <Fingerprint size={30} />
      </span>
      <div>
        <b>You're clocked in.</b>
        <span>
          <i /> Time tracked, not guessed.
        </span>
      </div>
    </div>
  );
}
export default function Home() {
  return (
    <SiteLayout>
      <section className="hero container">
        <div className="hero-copy">
          <p className="hero-kicker">
            <span /> LESS ADMIN. MORE AMBITION.
          </p>
          <h1>
            Your busywork.
            <br />
            <em>On autopilot.</em>
          </h1>
          <p className="hero-description">
            We build AI agents and automations that handle the repetitive stuff.
            So your small team can do much bigger things.
          </p>
          <div className="hero-actions">
            <Link href="/examples" className="button button-primary">
              Try the live demos <ArrowUpRight size={18} />
            </Link>
            <a href="#contact" className="button button-quiet">
              Build with us <ArrowRight size={17} />
            </a>
          </div>
          <p className="hero-note">
            <MousePointer2 size={14} /> Real tools to try. No signup. No sales
            pitch.
          </p>
        </div>
        <HeroWorkspace />
      </section>
      <div className="container">
        <ToolLogos />
      </div>
      <section className="build-section container" id="automations">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">LESS EXPLAINING. MORE SHOWING.</p>
            <h2>Go on. Put it to work.</h2>
          </div>
          <p>
            Five little windows into what we can build.
            <br />
            Open a tool. Change something. See it happen.
          </p>
        </Reveal>
        <div className="product-grid">
          {tools.map((tool, i) => (
            <Reveal
              key={tool.id}
              className={`product-card-wrap ${i === 0 ? "featured" : ""}`}
              delay={(i % 3) * 45}
            >
              <Link
                href={`/examples?demo=${tool.id}`}
                className={`product-card tone-${tool.color}`}
              >
                <div className="product-card-top">
                  <span className="card-category">{tool.category}</span>
                  <span className="card-arrow">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
                <CardPreview id={tool.id} />
                <div className="product-card-copy">
                  <h3>{tool.title}</h3>
                  <p>{tool.text}</p>
                  <span className="card-action">
                    {tool.action}
                    <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="approach-section container" id="approach">
        <Reveal className="approach-panel">
          <div className="approach-copy">
            <p className="eyebrow">A SMALL STUDIO. A HANDS-ON PARTNER.</p>
            <h2>
              Built around your work.
              <br />
              Not the other way around.
            </h2>
            <p>
              Tell us what keeps getting copied, chased or missed. We'll map the
              workflow, build a focused first version, and test it with your
              team.
            </p>
            <a className="text-link" href="#contact">
              Let's find your first automation <MoveUpRight size={17} />
            </a>
          </div>
          <div className="promise-list">
            {[
              {
                icon: MousePointer2,
                title: "Try it before it goes live.",
                text: "A working preview to review together.",
              },
              {
                icon: ShieldCheck,
                title: "You stay in control.",
                text: "Human approval where it matters.",
              },
              {
                icon: LockKeyhole,
                title: "Clear scope. Clear handover.",
                text: "Your tools, access and setup explained.",
              },
            ].map(item => (
              <div key={item.title}>
                <span>
                  <item.icon size={20} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
      <section className="about-section container" id="about">
        <Reveal className="about-panel">
          <div className="founder-portrait">
            <img
              src="/prathamesh-chandak.png"
              alt="Prathamesh Chandak, founder of Problem2App"
              loading="lazy"
              width="800"
              height="800"
            />
            <span className="founder-caption">Founder-led. Built hands-on.</span>
          </div>
          <div className="about-copy">
            <p className="eyebrow">MEET THE FOUNDER</p>
            <h2>
              The person behind
              <br />
              Problem2App.
            </h2>
            <p className="founder-intro">
              Prathamesh Chandak is building Problem2App around the work that
              rarely makes the pitch deck: missed follow-ups, repeated data
              entry and the spreadsheet somebody has to update every evening.
            </p>
            <p>
              His background spans AI agents, automation, content and talent
              strategy—experience that keeps every build grounded in how real
              teams actually work.
            </p>
            <dl className="founder-proof" aria-label="Founder experience">
              <div>
                <dt>900M+</dt>
                <dd>views generated</dd>
              </div>
              <div>
                <dt>120+</dt>
                <dd>global clients</dd>
              </div>
              <div>
                <dt>150+</dt>
                <dd>creator network</dd>
              </div>
            </dl>
            <a
              className="linkedin-link"
              href="https://www.linkedin.com/in/prathameshchandak/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin size={18} aria-hidden="true" />
              Connect with Prathamesh on LinkedIn
              <ArrowUpRight size={16} aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </Reveal>
      </section>
      <section className="contact-section container" id="contact">
        <Reveal className="booking-panel">
          <div className="contact-copy">
            <p className="eyebrow">WHAT'S TAKING UP YOUR TIME?</p>
            <h2>
              Let's take it{" "}
              <br />
              off your plate.
            </h2>
            <p>
              A 30-minute conversation about your business. Find your first
              automation, together.
            </p>
          </div>
          <div className="booking-action">
            <BookingLink>Book a discovery call</BookingLink>
            <span>30 minutes · Meet the builders</span>
          </div>
        </Reveal>
      </section>
    </SiteLayout>
  );
}

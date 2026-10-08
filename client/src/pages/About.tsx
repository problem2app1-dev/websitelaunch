import { ArrowUpRight, Linkedin } from "lucide-react";
import { BookingLink, SiteLayout } from "@/components/SiteLayout";

export default function About() {
  return (
    <SiteLayout>
      <article className="founder-page container">
        <header className="founder-heading">
          <p className="eyebrow">A NOTE FROM THE FOUNDER</p>
          <h1>Hi, I'm Prathamesh.</h1>
          <p>I started Problem2App to make everyday work easier.</p>
        </header>

        <div className="founder-layout">
          <aside className="founder-profile" aria-label="Prathamesh Chandak">
            <img
              src="/prathamesh-chandak.png"
              alt="Prathamesh Chandak, founder of Problem2App"
              width="800"
              height="800"
              fetchPriority="high"
            />
            <div className="founder-byline">
              <p>Prathamesh Chandak</p>
              <span>Founder, Problem2App</span>
            </div>
            <a
              className="founder-linkedin"
              href="https://www.linkedin.com/in/prathameshchandak/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin size={17} aria-hidden="true" />
              Find me on LinkedIn
              <ArrowUpRight size={16} aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </aside>

          <div className="founder-letter">
            <p className="founder-lead">
              I build AI agents, automations and custom software that give teams
              more time for the work they care about.
            </p>
            <p>
              My background is in running a content agency, working with clients
              and bringing creative teams together. I've worked with over 120
              global clients and a network of more than 150 remote creators,
              with content reaching over 900 million views.
            </p>
            <p>
              Behind that work are the things every business has to figure out:
              keeping people aligned, following up on time and making sure
              nothing gets lost between a conversation and delivery. That side
              of the business is what drew me to automation.
            </p>

            <section aria-labelledby="why-problem2app">
              <h2 id="why-problem2app">Why I started Problem2App</h2>
              <p>
                A missed enquiry. The same information entered into three tools.
                A spreadsheet that needs someone's attention every day. These
                are the problems I want Problem2App to solve.
              </p>
              <p>
                We build around the way your team already works. That might
                mean an agent that handles enquiries, an automated follow-up,
                or a small app that brings a scattered process into one place.
              </p>
            </section>

            <section aria-labelledby="working-together">
              <h2 id="working-together">How I like to work</h2>
              <p>
                Start with a conversation. Understand where the time goes.
                Build a first version you can actually use, then improve it
                with your feedback. I care about the details that make a tool
                useful long after the demo.
              </p>
              <p>
                If there's a part of your day you keep thinking could be
                simpler, I'd like to hear about it.
              </p>
            </section>

            <div className="founder-signoff">
              <p>Prathamesh</p>
              <BookingLink>Let's talk about your business</BookingLink>
            </div>
          </div>
        </div>
      </article>
    </SiteLayout>
  );
}

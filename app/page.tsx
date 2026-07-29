export default function Home() {
  return (
    <main style={{ background: "var(--ink)", color: "var(--paper)", minHeight: "100vh" }}>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "28px 24px",
        }}
      >
        <span className="font-display" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>
          Ledger
        </span>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <a href="/login" style={{ color: "var(--paper)", opacity: 0.8, fontSize: 14, textDecoration: "none" }}>
            Log in
          </a>
          <a
            href="/signup"
            style={{
              background: "var(--amber)",
              color: "var(--ink)",
              fontSize: 14,
              fontWeight: 600,
              padding: "9px 18px",
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            Get started
          </a>
        </div>
      </nav>

      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "64px 24px 96px",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 56,
          alignItems: "center",
        }}
        className="hero-grid"
      >
        <div>
          <p className="font-mono" style={{ color: "var(--amber)", fontSize: 13, letterSpacing: "0.08em", marginBottom: 16 }}>
            FOR SALONS, TRAINERS, CONTRACTORS AND CONSULTANTS
          </p>
          <h1
            className="font-display"
            style={{ fontSize: 52, lineHeight: 1.05, fontWeight: 600, marginBottom: 20, letterSpacing: "-0.02em" }}
          >
            Every client, every booking, every invoice, in one ledger.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, opacity: 0.82, marginBottom: 32, maxWidth: 440 }}>
            Stop juggling texts, spreadsheets, and sticky notes. Give clients a link to book themselves,
            and see your whole week, who's coming in, what's unpaid, on one page.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a
              href="/signup"
              style={{
                background: "var(--amber)",
                color: "var(--ink)",
                fontSize: 15,
                fontWeight: 600,
                padding: "13px 24px",
                borderRadius: 6,
                textDecoration: "none",
              }}
            >
              Start free
            </a>
            <span style={{ fontSize: 13, opacity: 0.6 }}>No card required</span>
          </div>
          </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TicketCard time="9:00 AM" client="Emma Watson" service="Haircut and color" price="$85" />
          <TicketCard time="11:30 AM" client="James Diaz" service="Beard trim" price="$30" />
          <TicketCard time="2:00 PM" client="Lena Kim" service="Blowout" price="$45" faded />
        </div>
      </section>

      <section style={{ background: "var(--paper)", color: "var(--ink)", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="font-mono" style={{ color: "var(--clay)", fontSize: 13, letterSpacing: "0.08em", marginBottom: 12 }}>
            THE WHOLE FRONT DESK
          </p>
          <h2 className="font-display" style={{ fontSize: 32, fontWeight: 600, marginBottom: 44, letterSpacing: "-0.01em" }}>
            Three things running your business already do here.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }} className="feature-grid">
            <Feature
              title="Clients ask, you don't chase"
              body="Share one link. Clients pick an open slot from your real availability, no back-and-forth, no double-booked afternoons."
            />
            <Feature
              title="Every client, one file"
              body="Contact info, service history, notes, everything on a client lives in one place instead of scattered across apps."
            />
            <Feature
              title="Know what's owed, at a glance"
              body="Mark a visit complete, generate the invoice, track who's paid, your revenue for the month, always current."
            />
          </div>
        </div>
      </section>

      <section style={{ padding: "88px 24px", textAlign: "center" }}>
        <h2 className="font-display" style={{ fontSize: 30, fontWeight: 600, marginBottom: 16, letterSpacing: "-0.01em" }}>
          Set up your booking page in under five minutes.
        </h2>
        <a
          href="/signup"
          style={{
            display: "inline-block",
            background: "var(--amber)",
            color: "var(--ink)",
            fontSize: 15,
            fontWeight: 600,
            padding: "13px 28px",
            borderRadius: 6,
            textDecoration: "none",
            marginTop: 12,
          }}
        >
          Get started free
        </a>
      </section>

      <footer style={{ borderTop: "1px solid rgba(241,236,225,0.15)", padding: "24px", textAlign: "center" }}>
        <p className="font-mono" style={{ fontSize: 12, opacity: 0.5 }}>
          LEDGER, BUILT FOR INDEPENDENT BUSINESSES
        </p>
      </footer>

      <style>{`
        @media (max-width: 760px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

function TicketCard({
  time,
  client,
  service,
  price,
  faded = false,
}: {
  time: string;
  client: string;
  service: string;
  price: string;
  faded?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        borderRadius: 8,
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        opacity: faded ? 0.55 : 1,
        position: "relative",
      }}
    >
      <div>
        <p className="font-mono" style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>{time}</p>
        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{client}</p>
        <p style={{ fontSize: 13, opacity: 0.65 }}>{service}</p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p className="font-mono" style={{ fontSize: 15, fontWeight: 500 }}>{price}</p>
        <p
          className="font-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "var(--sage)",
            marginTop: 4,
            fontWeight: 500,
          }}
        >
          CONFIRMED
        </p>
      </div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-display" style={{ fontSize: 19, fontWeight: 600, marginBottom: 10 }}>
        {title}
      </h3>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, opacity: 0.75 }}>{body}</p>
    </div>
  );
}
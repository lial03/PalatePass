const pillars = [
  {
    title: "Trusted people over strangers",
    body: "Follow friends and reviewers whose food taste actually overlaps with yours.",
  },
  {
    title: "Taste Match scoring",
    body: "Compare shared favorites, cuisines, and tags to understand recommendation fit.",
  },
  {
    title: "Shareable discovery",
    body: "Profiles and reviews can travel through QR codes instead of screenshots and links.",
  },
];

const roadmap = [
  "Profiles with bios, ratings, and top restaurants",
  "Restaurant ratings with tags and short reviews",
  "Recommendation feed powered by follows and high-signal taste overlap",
  "QR share flows for profiles and standout reviews",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-16 px-6 py-8 sm:px-10 lg:px-12">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="rounded-4xl border border-border bg-surface px-6 py-8 shadow-[0_25px_80px_rgba(70,32,13,0.08)] sm:px-10 sm:py-12">
          <div className="mb-8 inline-flex rounded-full border border-border bg-white/70 px-4 py-2 text-sm text-muted backdrop-blur">
            Web MVP scaffold is live on feature/project-scaffold
          </div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-accent-strong">
            PalatePass
          </p>
          <h1 className="max-w-3xl font-serif text-5xl leading-none sm:text-6xl lg:text-7xl">
            Restaurant discovery built on trust, not noise.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
            PalatePass helps people find where to eat through shared taste,
            trusted circles, and recommendation signals that come from real
            people instead of anonymous review piles.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              className="rounded-full bg-accent px-6 py-3 text-center font-semibold text-white transition hover:bg-accent-strong"
              href="#roadmap"
            >
              See MVP scope
            </a>
            <a
              className="rounded-full border border-border px-6 py-3 text-center font-semibold transition hover:bg-white/60"
              href="http://localhost:4000/api"
            >
              View API contract
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-4xl border border-border bg-[#1f140f] p-6 text-[#f9ecd9] shadow-[0_20px_60px_rgba(31,20,15,0.22)]">
            <p className="text-sm uppercase tracking-[0.22em] text-[#f1bf94]">
              Taste Match
            </p>
            <p className="mt-6 font-serif text-6xl leading-none">78%</p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#e8cfba]">
              Example compatibility score based on highly rated overlaps, shared
              cuisines, and tagging patterns.
            </p>
          </div>
          <div className="rounded-4xl border border-border bg-surface-strong p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-accent-strong">
              MVP Signals
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-foreground">
              <li>Profiles with public ratings and top spots</li>
              <li>Review tags like cozy, spicy, affordable, fast service</li>
              <li>Follow-based discovery and recommendation feed</li>
              <li>QR sharing for profiles and individual reviews</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article
            key={pillar.title}
            className="rounded-[1.75rem] border border-border bg-white/70 p-6 backdrop-blur"
          >
            <h2 className="text-xl font-semibold">{pillar.title}</h2>
            <p className="mt-3 text-base leading-7 text-muted">{pillar.body}</p>
          </article>
        ))}
      </section>

      <section
        id="roadmap"
        className="rounded-4xl border border-border bg-white/70 p-8 backdrop-blur sm:p-10"
      >
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-strong">
              Web MVP roadmap
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight">
              A focused first release with clear product signals.
            </h2>
          </div>
          <div className="grid gap-4">
            {roadmap.map((item, index) => (
              <div
                key={item}
                className="flex gap-4 rounded-3xl border border-border bg-surface px-5 py-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                  0{index + 1}
                </span>
                <p className="pt-1 text-base leading-7 text-foreground">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

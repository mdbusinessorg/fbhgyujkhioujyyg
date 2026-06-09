export function PageHero({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="relative overflow-hidden bg-hero-gradient pb-16 pt-36">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <span className="badge bg-white/80 text-primary shadow-soft">{badge}</span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-body">{subtitle}</p>
      </div>
    </section>
  );
}

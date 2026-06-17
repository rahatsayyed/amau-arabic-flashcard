export default function LeaderboardPage() {
  return (
    <>
      <header className="sticky top-0 z-50 flex items-center px-gutter h-16 bg-primary-container text-on-primary">
        <span className="font-headline-lg-mobile text-headline-lg-mobile">Leaderboard</span>
      </header>
      <div className="flex flex-col items-center justify-center flex-1 px-container-margin py-16 gap-4 text-center">
        <span
          className="material-symbols-outlined text-primary text-[72px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          emoji_events
        </span>
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Coming Soon</h2>
        <p className="font-body-md text-label-md text-on-surface-variant max-w-[260px]">
          Compete with other learners and track your rank. Stay tuned!
        </p>
      </div>
    </>
  );
}

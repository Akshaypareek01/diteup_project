export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-forest px-5 text-center text-cream">
      <h1 className="font-display text-display-lg font-semibold">We will be right back</h1>
      <p className="mt-4 max-w-md text-body-lg text-cream/85">
        Scheduled maintenance — swap to edge 503 or hosting maintenance mode in production.
      </p>
    </div>
  );
}

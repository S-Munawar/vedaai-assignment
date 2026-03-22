import Image from "next/image";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showRealtime?: boolean;
  realtimeStatus?: "connected" | "reconnecting" | "disconnected" | "connecting";
  onBack?: () => void;
  showHeader?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  showRealtime = false,
  realtimeStatus = "disconnected",
  onBack,
  showHeader = true,
}: PageHeaderProps) {
  const router = useRouter();

  const isRealtimeConnected = realtimeStatus === "connected";
  const realtimeDotClass =
    realtimeStatus === "connected"
      ? "bg-green-500 border-green-300 shadow-lg shadow-green-500/40"
      : realtimeStatus === "reconnecting" || realtimeStatus === "connecting"
        ? "bg-yellow-500 border-yellow-500"
        : "bg-gray-400 border-gray-400";

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (!showHeader) {
    return null;
  }

  return (
    <>
      {/* Desktop header with realtime indicator */}
      {showRealtime ? (
        <header className="hidden items-center gap-3 pl-2 md:flex">
          <div className="relative flex h-4 w-4 items-center justify-center">
            {isRealtimeConnected && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            )}
            <span className={`relative inline-flex h-3 w-3 rounded-full border ${realtimeDotClass}`} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold text-primary">{title}</h1>
            {subtitle && <p className="text-sm font-normal text-muted">{subtitle}</p>}
          </div>
        </header>
      ) : (
        <header className="hidden items-center gap-3 pl-2 md:flex">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold text-primary">{title}</h1>
            {subtitle && <p className="text-sm font-normal text-muted">{subtitle}</p>}
          </div>
        </header>
      )}

      {/* Mobile header with back button */}
      <header className="md:hidden">
        <div className="relative flex min-h-10 items-center justify-center px-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/25"
          >
            <Image src="/icons/Arrow_Left.svg" alt="" aria-hidden="true" width={20} height={20} />
          </button>

          <h1 className="text-base font-bold text-primary">{title}</h1>
        </div>
      </header>
    </>
  );
}

import Image from 'next/image';

type DevelopmentInProgressProps = {
  wrapperClassName?: string;
  textClassName?: string;
};

export default function DevelopmentInProgress({
  wrapperClassName = 'min-h-[70vh] flex items-center justify-center p-10',
  textClassName = 'text-base font-medium text-gray-600',
}: DevelopmentInProgressProps) {
  return (
    <div className={wrapperClassName}>
      <div className="flex flex-col items-center justify-center gap-8 py-12 text-center">
                    <Image
                      src="/no-assignments.png"
                      alt="Development in progress"
                      width={260}
                      height={260}
                      className="mx-auto"
                      priority
                    />
        <div className={`mt-4 inline-flex items-center gap-2 ${textClassName}`}>
          <span className="text-base font-bold text-primary">Development in progress</span>
          <span className="inline-flex items-end gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
          </span>
        </div>
      </div>
    </div>
  );
}

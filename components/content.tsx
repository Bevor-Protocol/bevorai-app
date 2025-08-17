import { AsyncComponent } from "@/utils/types";
import { cn } from "@/lib/utils";

const Content: AsyncComponent<{ children: React.ReactNode; className?: string }> = async ({
  children,
  className,
}) => {
  return (
    <div className="relative z-20 grow w-full overflow-auto">
      {/* <div className="bg-black/90 p-2 md:p-4 size-full overflow-hidden">{children}</div> */}
      <div className={cn("p-2 md:p-4 size-full overflow-auto", className)}>{children}</div>
    </div>
  );
};

export default Content;

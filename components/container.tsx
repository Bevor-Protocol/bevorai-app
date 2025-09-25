import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  constrainHeight?: boolean;
};

const Container: React.FC<Props> = ({ children, constrainHeight = false }) => {
  return (
    <div
      className={cn(
        "px-10 py-6",
        constrainHeight && "h-remaining flex flex-col max-h-remaining overflow-hidden",
        !constrainHeight && "grow",
      )}
    >
      {children}
    </div>
  );
};

export default Container;

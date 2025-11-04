import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

const Roadmap: React.FC = () => {
  return (
    <div
      className={cn(
        "w-full max-w-4xl mx-auto px-4 py-16 backdrop-blur-xs",
        "bg-[#0a0a0a]/70 gap-8 mt-20 rounded-lg space-y-8",
      )}
    >
      <h2 className="text-4xl font-bold text-center mb-12 text-cyan-400 tracking-wider">
        Roadmap to Revolution
      </h2>
      <div className="space-y-8">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="size-6 text-cyan-400 mt-1 shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-foreground">Initial Development</h3>
            <p className="text-gray-400">
              Core AI model development and smart contract analysis capabilities
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <CheckCircle2 className="size-6 text-cyan-400 mt-1 shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-foreground">Community Building</h3>
            <p className="text-gray-400">
              Establishing presence in the blockchain security community
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <CheckCircle2 className="size-6 text-cyan-400 mt-1 shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-foreground">Bonding Curve</h3>
            <p className="text-gray-400">
              Initial launch on DEX and true beginning of the revolution
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <CheckCircle2 className="size-6 text-cyan-400 mt-1 shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-foreground">Twitter Launch</h3>
            <p className="text-gray-400">Official social media presence and community engagement</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Circle className="size-6 text-cyan-400 mt-1 shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-foreground">AI Improvements</h3>
            <p className="text-gray-400">
              Improve AI&apos;s ability to respond publicly and produce smart contract audits
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Circle className="size-6 text-cyan-400 mt-1 shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-foreground">Analysis Submission System</h3>
            <p className="text-gray-400">
              Development of a user-friendly platform for submitting smart contracts for audit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;

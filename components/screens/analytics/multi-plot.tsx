"use client";

import { createMultiTimeseries } from "@/components/plot/multi-timeseries";
import { cn } from "@/lib/utils";
import { severityColorMap } from "@/utils/constants";
import { MultiTimeseriesResponseI } from "@/utils/types";
import { useEffect, useRef, useState } from "react";

interface TimeSeriesPlotProps {
  data: MultiTimeseriesResponseI;
  title: string;
}

const MultiTimeSeriesPlot: React.FC<TimeSeriesPlotProps> = ({ data, title }) => {
  const [curValue, setCurValue] = useState(data.counts);
  const plotRef = useRef<HTMLDivElement>(null);

  const resetCount = () => setCurValue(data.counts);

  useEffect(() => {
    if (plotRef.current && data.timeseries.length > 0) {
      createMultiTimeseries({
        datas: data,
        colorMap: severityColorMap,
        element: plotRef.current,
        onHover: setCurValue,
        onReset: resetCount,
      });
    }
  }, [data]);

  return (
    <div
      className={cn(
        "border border-gray-800 rounded-md p-2 md:p-3 lg:p-4 col-span-2",
        "h-fit relative hidden md:block",
      )}
    >
      <div className="flex justify-between text-sm">
        <p className="mb-2">{title}</p>
      </div>
      <div className="grid grid-cols-4 gap-4 *:text-center">
        {Object.entries(curValue).map(([severity, value]) => (
          <div key={severity}>
            <p
              className={`text-[${severityColorMap[severity as keyof typeof severityColorMap]}] text-sm my-2`}
            >
              {severity}
            </p>
            <p className="text-lg font-bold">{value ?? 0}</p>
          </div>
        ))}
      </div>
      <div ref={plotRef} />
    </div>
  );
};

export default MultiTimeSeriesPlot;

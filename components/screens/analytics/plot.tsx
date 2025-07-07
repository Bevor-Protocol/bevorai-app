"use client";

import { createTimeSeries } from "@/components/plot/timeseries";
import { cn } from "@/lib/utils";
import { TimeseriesResponseI } from "@/utils/types";
import { useEffect, useRef, useState } from "react";

interface TimeSeriesPlotProps {
  data: TimeseriesResponseI;
  title: string;
}

const TimeSeriesPlot: React.FC<TimeSeriesPlotProps> = ({ data, title }) => {
  const [curValue, setCurValue] = useState(data.count);
  const plotRef = useRef<HTMLDivElement>(null);

  const resetCount = (): void => setCurValue(data.count);

  useEffect(() => {
    if (plotRef.current && data.timeseries.length > 0) {
      createTimeSeries({
        datas: data.timeseries,
        element: plotRef.current,
        onHover: setCurValue,
        onReset: resetCount,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div
      className={cn(
        "border border-gray-800 rounded-md p-2 md:p-3 lg:p-4 col-span-2",
        "h-fit relative hidden md:block",
      )}
    >
      <div>
        <p className="text-gray-200 inline-block">{title}</p>
        <p className="ml-4 inline-block">{curValue.toLocaleString()}</p>
      </div>
      <div ref={plotRef} />
    </div>
  );
};

export default TimeSeriesPlot;

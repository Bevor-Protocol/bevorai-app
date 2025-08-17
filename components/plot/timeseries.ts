import * as d3 from "d3";

interface DataPoint {
  date: Date;
  count: number;
}

export const createTimeSeries = ({
  datas,
  element,
  margin = { top: 20, right: 5, bottom: 5, left: 5 },
  onHover,
  onReset,
}: {
  datas: DataPoint[];
  element: HTMLElement;
  margin?: { top: number; right: number; bottom: number; left: number };
  onHover?: React.Dispatch<React.SetStateAction<number>>;
  onReset?: () => void;
}): void => {
  // Clear any existing SVG
  d3.select(element).selectAll("*").remove();

  // Get container width
  const containerWidth = element.clientWidth;
  const aspectRatio = 0.3; // 2:1 aspect ratio
  const containerHeight = containerWidth * aspectRatio;

  // Format the data and calculate cumulative sum
  const data: DataPoint[] = datas
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc: DataPoint[], d) => {
      const prevCount = acc.length > 0 ? acc[acc.length - 1].count : 0;
      acc.push({
        date: new Date(d.date),
        count: prevCount + d.count,
      });
      return acc;
    }, []);

  // Set up scales
  const x = d3
    .scaleTime()
    .domain(d3.extent(data, (d: DataPoint) => d.date) as [Date, Date])
    .range([margin.left, containerWidth - margin.right]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(data, (d: DataPoint) => d.count) as [number, number])
    .range([containerHeight - margin.bottom, margin.top]);

  // Create SVG element
  const svg = d3
    .select(element)
    .append("svg")
    .attr("width", "100%")
    .attr("height", containerHeight)
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g");

  // Create line generator
  const line = d3
    .line<DataPoint>()
    .x((d) => x(d.date))
    .y((d) => y(d.count));

  // Add the line to the SVG
  svg
    .append("path")
    .data([data])
    .attr("class", "line")
    .attr("d", line)
    .style("fill", "none")
    .style("stroke", "steelblue")
    .style("stroke-width", 2);

  // Tooltip for hover interaction
  const tooltip = d3
    .select(element)
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("font-size", "12px")
    .style("white-space", "nowrap");

  // Add overlay for entire plot
  const bisect = d3.bisector((d: DataPoint) => d.date).left;

  svg
    .append("rect")
    .attr("class", "overlay")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .style("opacity", 0)
    .on("mousemove", (event) => {
      const mouseX = d3.pointer(event)[0];
      const x0 = x.invert(mouseX);
      const i = bisect(data, x0, 1);

      // Guard against index out of bounds
      if (i <= 0 || i >= data.length) return;

      const d0 = data[i - 1];
      const d1 = data[i];

      // Guard against undefined data points
      if (!d0 || !d1 || !d0.date || !d1.date) return;

      const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;

      // Guard against undefined selected point
      if (!d || !d.date) return;

      // Call the onHover callback if provided
      if (onHover) {
        onHover(d.count);
      }

      // Add/update vertical line
      svg.selectAll(".hover-line").remove();
      svg
        .append("line")
        .attr("class", "hover-line")
        .attr("x1", x(d.date))
        .attr("x2", x(d.date))
        .attr("y1", 0)
        .attr("y2", containerHeight)
        .style("stroke", "#999")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5);

      tooltip.transition().duration(100).style("opacity", 1);

      // Position tooltip near the mouse cursor but within plot bounds
      const mouseY = d3.pointer(event)[1];

      // Get tooltip dimensions after it's rendered
      const tooltipNode = tooltip.node() as HTMLElement;
      const tooltipRect = tooltipNode.getBoundingClientRect();

      const svgElement = svg.node()?.parentElement;
      const plotContainer = svgElement?.parentElement;

      // Calculate offset from content above the plot
      const plotOffset = plotContainer ? plotContainer.offsetTop : 0;

      let left = mouseX;
      let top = mouseY + plotOffset; // Position at mouse cursor plus offset for content above

      // Adjust horizontal position if tooltip would go outside container
      if (left + tooltipRect.width / 2 > containerWidth) {
        left = containerWidth - tooltipRect.width / 2;
      } else if (left - tooltipRect.width / 2 < 0) {
        left = tooltipRect.width / 2;
      }

      // Adjust vertical position if tooltip would go outside container
      if (top + tooltipRect.height > element.clientHeight) {
        top = mouseY + plotOffset - tooltipRect.height;
      } else if (top < plotOffset) {
        top = plotOffset + 5; // Small margin from top if still not enough space
      }
      tooltip
        .html(`${d3.timeFormat("%Y-%m-%d")(d.date)}`)
        .style("left", `${left}px`)
        .style("top", `${top}px`)
        .style("transform", "translate(-50%, 0)");
    })
    .on("mouseout", () => {
      // Call the onHover callback with null when mouse leaves
      if (onHover && onReset) {
        onReset();
      }

      tooltip.transition().duration(200).style("opacity", 0);
      svg.selectAll(".hover-line").remove();
    });
};

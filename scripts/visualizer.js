/* ============================================================
   visualizer.js — D3.js animated Kaprekar sequence visualizer
   ============================================================ */

// We rely on D3 being loaded globally from a CDN <script> tag.
// eslint-disable-next-line no-undef
const d3 = window.d3;

/* ---------- Colour helpers ---------- */
const PALETTE = {
  barStart:     '#6c5ce7',
  barEnd:       '#ec4899',
  barConverged: '#22c55e',
  connector:    'rgba(168, 85, 247, 0.35)',
  labelMain:    '#f0f0f5',
  labelSub:     '#9a9ab0',
  labelMuted:   '#5a5a72',
  bg:           'transparent',
};

function barColor(i, total) {
  const t = total > 1 ? i / (total - 1) : 0;
  return d3.interpolateRgb(PALETTE.barStart, PALETTE.barEnd)(t);
}

/* ---------- Public API ---------- */

/**
 * Render the Kaprekar sequence inside the given container element.
 *
 * @param {Array<Object>} steps — from computeSequence()
 * @param {HTMLElement}    container — the DOM element to render into
 * @param {Function}       [onComplete] — callback fired after the last animation
 */
export function renderSequence(steps, container, onComplete) {
  // Clear any previous visualisation
  d3.select(container).selectAll('*').remove();

  if (!steps || steps.length === 0) return;

  /* ---- Dimensions ---- */
  const margin = { top: 50, right: 40, bottom: 60, left: 40 };
  const containerRect = container.getBoundingClientRect();
  const width  = Math.max(containerRect.width - margin.left - margin.right, 400);
  const height = 420;

  const svg = d3.select(container)
    .append('svg')
    .attr('id', 'viz-svg')
    .attr('width',  width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%')
    .style('height', 'auto');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  /* ---- Build the data set: each node is a number in the sequence ---- */
  const nodes = [{ value: steps[0].current, padded: steps[0].currentPadded, idx: 0 }];
  steps.forEach((s, i) => {
    nodes.push({
      value:  s.next,
      padded: String(s.next).padStart(4, '0'),
      idx:    i + 1,
    });
  });

  /* ---- Scales ---- */
  const xScale = d3.scaleBand()
    .domain(nodes.map((_, i) => i))
    .range([0, width])
    .padding(0.3);

  const yScale = d3.scaleLinear()
    .domain([0, 9999])
    .range([height, 0]);

  /* ---- Gridlines (subtle) ---- */
  const gridValues = [0, 2000, 4000, 6174, 8000];
  g.selectAll('.grid-line')
    .data(gridValues)
    .enter()
    .append('line')
    .attr('class', 'grid-line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .attr('stroke', d => d === 6174 ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.04)')
    .attr('stroke-width', d => d === 6174 ? 1.5 : 1)
    .attr('stroke-dasharray', d => d === 6174 ? '6 4' : 'none');

  /* 6174 label */
  g.append('text')
    .attr('x', width + 4)
    .attr('y', yScale(6174) + 4)
    .attr('fill', PALETTE.barStart)
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('opacity', 0.7)
    .text('6174');

  /* ---- Animate each step sequentially ---- */
  const STEP_DELAY   = 800;  // ms between steps
  const TRANSITION   = 700;  // ms for each bar to grow
  const CONNECTOR_T  = 400;  // ms for connector line

  nodes.forEach((node, i) => {
    const delay = i * STEP_DELAY;
    const isLast = (i === nodes.length - 1);
    const isConverged = node.value === 6174;

    /* Bar */
    const bar = g.append('rect')
      .attr('x', xScale(i))
      .attr('y', height)               // start at bottom
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', isConverged ? PALETTE.barConverged : barColor(i, nodes.length))
      .attr('opacity', 0);

    bar.transition()
      .delay(delay)
      .duration(TRANSITION)
      .ease(d3.easeCubicOut)
      .attr('y', yScale(node.value))
      .attr('height', height - yScale(node.value))
      .attr('opacity', 0.85);

    /* Glow effect for converged bar */
    if (isConverged) {
      const glow = g.append('rect')
        .attr('x', xScale(i) - 4)
        .attr('y', height)
        .attr('width', xScale.bandwidth() + 8)
        .attr('height', 0)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('fill', 'none')
        .attr('stroke', PALETTE.barConverged)
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .attr('filter', 'blur(4px)');

      glow.transition()
        .delay(delay)
        .duration(TRANSITION)
        .ease(d3.easeCubicOut)
        .attr('y', yScale(node.value) - 4)
        .attr('height', height - yScale(node.value) + 8)
        .attr('opacity', 0.5);
    }

    /* Number label (above bar) */
    g.append('text')
      .attr('x', xScale(i) + xScale.bandwidth() / 2)
      .attr('y', yScale(node.value) - 14)
      .attr('text-anchor', 'middle')
      .attr('fill', isConverged ? PALETTE.barConverged : PALETTE.labelMain)
      .attr('font-size', '15px')
      .attr('font-weight', '700')
      .attr('opacity', 0)
      .text(node.padded)
      .transition()
        .delay(delay + TRANSITION * 0.5)
        .duration(400)
        .ease(d3.easeCubicOut)
        .attr('opacity', 1);

    /* Step label (below bar) */
    g.append('text')
      .attr('x', xScale(i) + xScale.bandwidth() / 2)
      .attr('y', height + 28)
      .attr('text-anchor', 'middle')
      .attr('fill', PALETTE.labelMuted)
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('opacity', 0)
      .text(i === 0 ? 'Start' : `Step ${i}`)
      .transition()
        .delay(delay + TRANSITION * 0.4)
        .duration(400)
        .attr('opacity', 1);

    /* Subtraction annotation (desc − asc = next) */
    if (i > 0) {
      const step = steps[i - 1];
      const annotationY = yScale(node.value) - 34;
      g.append('text')
        .attr('x', xScale(i) + xScale.bandwidth() / 2)
        .attr('y', Math.max(annotationY, 12))
        .attr('text-anchor', 'middle')
        .attr('fill', PALETTE.labelSub)
        .attr('font-size', '10px')
        .attr('font-weight', '400')
        .attr('opacity', 0)
        .text(`${step.descending} − ${step.ascending}`)
        .transition()
          .delay(delay + TRANSITION * 0.7)
          .duration(400)
          .attr('opacity', 0.7);
    }

    /* Connector line to next bar */
    if (!isLast) {
      const x1 = xScale(i) + xScale.bandwidth();
      const x2 = xScale(i + 1);
      const y1 = yScale(node.value);
      const nextNode = nodes[i + 1];
      const y2 = yScale(nextNode.value);

      const path = g.append('path')
        .attr('d', `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`)
        .attr('fill', 'none')
        .attr('stroke', PALETTE.connector)
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round');

      // Animate dash offset
      const totalLength = path.node().getTotalLength();
      path
        .attr('stroke-dasharray', totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
          .delay(delay + TRANSITION)
          .duration(CONNECTOR_T)
          .ease(d3.easeCubicInOut)
          .attr('stroke-dashoffset', 0);

      /* Arrow head */
      g.append('polygon')
        .attr('points', `${x2},${y2} ${x2 - 7},${y2 - 5} ${x2 - 7},${y2 + 5}`)
        .attr('fill', PALETTE.connector)
        .attr('opacity', 0)
        .transition()
          .delay(delay + TRANSITION + CONNECTOR_T * 0.8)
          .duration(200)
          .attr('opacity', 1);
    }

    /* Fire completion callback after last bar */
    if (isLast && onComplete) {
      setTimeout(onComplete, delay + TRANSITION + 200);
    }
  });
}

/**
 * Clear the visualisation.
 * @param {HTMLElement} container
 */
export function clearVisualization(container) {
  d3.select(container).selectAll('*').remove();
}

// utils.js

// Tooltip utility
export function createTooltip() {
  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.pointerEvents = "none";
  tooltip.style.padding = "8px 12px";
  tooltip.style.background = "rgba(0, 0, 0, 0.8)";
  tooltip.style.color = "#fff";
  tooltip.style.borderRadius = "6px";
  tooltip.style.fontSize = "14px";
  tooltip.style.visibility = "hidden";
  tooltip.style.zIndex = "9999";
  document.body.appendChild(tooltip);

  return {
    show(content, x, y) {
      tooltip.innerHTML = content;
      tooltip.style.left = `${x + 10}px`;
      tooltip.style.top = `${y + 10}px`;
      tooltip.style.visibility = "visible";
    },
    hide() {
      tooltip.style.visibility = "hidden";
    }
  };
}

// Calculator utility (used in valley-3d.js)
export function computeZ(x, y) {
  // Example function: z = Gaussian-like curve
  const a = 1;
  const b = 0.02;
  return a * Math.exp(-b * (x ** 2 + y ** 2));
}

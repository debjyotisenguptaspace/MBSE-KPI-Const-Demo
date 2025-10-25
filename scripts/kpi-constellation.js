// kpi-constellation.js
import { createTooltip } from './utils.js';
import {
  select,
  schemeCategory10,
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  zoom,
  drag,
  interval
} from 'https://cdn.skypack.dev/d3';

const width = window.innerWidth;
const height = window.innerHeight * 0.85;

const svg = select("#kpi-constellation")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const container = svg.append("g");

svg.call(
  zoom().scaleExtent([0.5, 3]).on("zoom", (event) => {
    container.attr("transform", event.transform);
  })
);

const tooltip = createTooltip();

let paused = false;

svg.on("mouseover", () => paused = true);
svg.on("mouseout", () => paused = false);

fetch("./data/kpis.json")
  .then(res => res.json())
  .then(data => {
    const nodes = [];
    const links = [];
    const groupNodes = new Map();

    data.forEach(group => {
      group.kpis.forEach(kpi => {
        const node = {
          id: `${group.group}:${kpi}`,
          group: group.group,
          angle: Math.random() * 2 * Math.PI,
          radius: 20 + Math.random() * 40,
          vx: 0,
          vy: 0
        };
        nodes.push(node);
        if (!groupNodes.has(group.group)) groupNodes.set(group.group, []);
        groupNodes.get(group.group).push(node);
      });
    });

    data.forEach(group => {
      group.kpis.forEach((sourceKPI, i) => {
        group.kpis.forEach((targetKPI, j) => {
          if (i !== j) {
            links.push({
              source: `${group.group}:${sourceKPI}`,
              target: `${group.group}:${targetKPI}`
            });
          }
        });
      });
    });

    const nodeList = [...nodes];
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        if (nodeList[i].group !== nodeList[j].group && Math.random() < 0.2) {
          links.push({
            source: nodeList[i].id,
            target: nodeList[j].id
          });
        }
      }
    }

    const dynamicCharge = () =>
      forceManyBody().strength(d => -90 + 10 * Math.sin(Date.now() / 4000 + d.index));

    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links).id(d => d.id).distance(130).strength(0.07))
      .force("charge", dynamicCharge())
      .force("collision", forceCollide().radius(15).strength(1))
      .force("center", forceCenter(width / 2, height / 2))
      .alpha(1)
      .alphaDecay(0)
      .velocityDecay(0.08)
      .on("tick", ticked);

    const link = container.append("g")
      .attr("stroke", "#aaa")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);

    const node = container.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 12)
      .attr("fill", d => schemeCategory10[data.findIndex(g => g.group === d.group)])
      .on("mouseover", (event, d) => {
        tooltip.show(`<strong>${d.id.split(":" )[1]}</strong><br><small>${d.group}</small>`, event.pageX, event.pageY);
      })
      .on("mouseout", () => tooltip.hide())
      .call(
        drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    let tickCount = 0;
    let currentMode = "cosmic";

    function ticked() {
      if (paused) return;

      tickCount++;

      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => 10 + 1.5 * Math.sin(tickCount / 90 + d.index));

      nodes.forEach(d => {
        const swirlX = 0.03 * Math.sin(tickCount / 60 + d.index);
        const swirlY = 0.03 * Math.cos(tickCount / 60 + d.index);
        const orbitX = Math.cos(d.angle + tickCount * 0.003) * d.radius;
        const orbitY = Math.sin(d.angle + tickCount * 0.003) * d.radius;

        let chaosFactor = 0.004;

        if (currentMode === "storm") {
          chaosFactor = (1.5 * tickCount) + 0.5 * Math.sin(tickCount / 20);
        }

        d.vx += swirlX + chaosFactor * orbitX;
        d.vy += swirlY + chaosFactor * orbitY;
      });
    }

    interval(() => {
      if (!paused) {
        simulation.force("charge", dynamicCharge());
        simulation.alphaTarget(0.04).restart();
      }
    }, 2800);

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Mode switch handler
    /*window.setConstellationMode = (mode) => {
      if (["calm", "storm"].includes(mode)) {
        currentMode = mode === "calm" ? "cosmic" : "storm";
      }
    }*/

    // Enhanced UI buttons to switch modes
    /*const modeToggle = document.createElement("div");
    modeToggle.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: rgba(255,255,255,0.9);
        padding: 10px 14px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-family: sans-serif;
      ">
        <strong style="display: block; margin-bottom: 8px;">Constellation Mode</strong>
        <button onclick="setConstellationMode('calm')" style="
          margin-right: 6px;
          padding: 6px 12px;
          border: none;
          background: #4285f4;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        ">Cosmic Calm</button>
        <button onclick="setConstellationMode('storm')" style="
          padding: 6px 12px;
          border: none;
          background: #db4437;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        ">Quantum Storm</button>
      </div>
    `;*/
    //document.body.appendChild(modeToggle);
	
	// Expose stop function to window for full cleanup
	/**window.stopConstellationSimulation = () => {
		simulation.stop();
		svg.selectAll("*").remove();
		if (modeToggle) modeToggle.remove();
		};*/
 });

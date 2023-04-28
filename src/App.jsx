import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
// import { data } from "./data.json";

const API = "http://49.249.110.2:8050/api/MenuMasters/GetMenuMasterList/173";

export default function App() {
  const [gridView, setGridView] = useState(true);

  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      const response = await fetch(API, { method: "GET" });
      const json = await response.json();
      if (json.status) setData(json.data);
    })();
  }, []);

  const filters = useMemo(() => data.filter((el) => !el.refMenuId), [data]);
  const mixedChildren = useMemo(
    () => data.filter((el) => el.refMenuId),
    [data]
  );

  const graphRef = useRef(null);
  const [grapLoaded, setGrapLoaded] = useState(false);
  useEffect(() => {
    if (graphRef.current && data.length && !grapLoaded) {
      let treeData = {
        name: "root",
        children: [],
      };

      filters.forEach((parent) => {
        treeData.children.push({ ...parent, children: [] });
      });

      mixedChildren.forEach((child) => {
        const parentIndex = treeData.children.findIndex(
          (parent) => parent.id == child.refMenuId
        );
        if (parentIndex > -1)
          treeData.children[parentIndex].children.push(child);
      });

      let tree = d3.tree().size([1600, 800]);
      let hierarchy = d3.hierarchy(treeData, (d) => d.children);
      let nodes = tree(hierarchy);
      console.log("nodes", nodes.descendants(), nodes.links());

      const linksGeneraor = d3
        .linkHorizontal()
        .source((link) => link.source)
        .target((link) => link.target)
        .x((node) => node.y)
        .y((node) => node.x);

      const svg = d3
        .select(graphRef.current)
        .append("svg")
        .attr("width", 800 + 200)
        .attr("height", 1600);

      svg
        .selectAll(".tree-node")
        .data(nodes.descendants())
        .join("circle")
        .attr("r", 4)
        .attr("cx", (node) => node.y)
        .attr("cy", (node) => node.x)
        .style("fill", "white");

      svg
        .selectAll(".tree-link")
        .data(nodes.links())
        .join("path")
        .attr("d", (linkObject) => linksGeneraor(linkObject))
        .style("fill", "none")
        .style("stroke", "gray");

      svg
        .selectAll(".tree-node-names")
        .data(nodes.descendants())
        .join("text")
        .text((node) => node.data.name)
        .attr("font-size", 12)
        .attr("background", "gray")
        .attr("x", (node) => node.y + 6)
        .attr("y", (node) => {
          if (node.depth == 1) return node.x - 6;
          if (node.depth == 2) return node.x + 4;
        })
        .style("fill", "white");

      setGrapLoaded(true);
    }
  }, [graphRef, data, filters, mixedChildren, grapLoaded]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <form className="float-right flex items-center">
          <span className="mr-4">View</span>
          <input
            type="checkbox"
            name="gridView"
            id="gridView"
            className="mr-2"
            checked={gridView}
            onChange={(e) => {
              setGridView(e.target.checked);
            }}
          />
          <label htmlFor="gridView">Grids</label>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Tree View</h2>
        {filters.map((parent, key) => (
          <div key={parent.id}>
            <details open={key == 1}>
              <summary onClick={() => {}}>{parent.name}</summary>
              <div
                className={
                  "pt-2 pb-4 pl-6 " +
                  (gridView
                    ? " grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 "
                    : " flex flex-col gap-2 ")
                }
              >
                {mixedChildren
                  .filter((child) => child.refMenuId === parent.id)
                  .map((child) => (
                    <div
                      key={child.id}
                      className="border border-gray-600 rounded py-3 px-3 hover:border-gray-200 hover:bg-gray-200 hover:text-gray-800 transition-all"
                    >
                      <div className="pb-1 font-bold">{child.name}</div>
                      <div className="text-xs font-mono break-words">
                        {child.menuPath}
                      </div>
                    </div>
                  ))}
              </div>
            </details>
          </div>
        ))}
      </div>

      <div className="my-16"></div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Tree Graph</h2>
        <div ref={graphRef} id="graph" className="flex justify-center"></div>
      </div>
    </div>
  );
}

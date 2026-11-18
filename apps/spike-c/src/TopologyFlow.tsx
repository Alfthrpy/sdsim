import {
  Background,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { t } from "./strings.ts";

interface Props {
  dbLoad: number;
  hit: number;
  onSelect: () => void;
}

type Data = { label: string; sub?: string; tappable: boolean; onSelect: () => void };

function Box({ data }: NodeProps<Node<Data>>) {
  return (
    <div
      className="flow-node"
      role={data.tappable ? "button" : undefined}
      tabIndex={data.tappable ? 0 : undefined}
      onClick={data.tappable ? data.onSelect : undefined}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <strong>{data.label}</strong>
      {data.sub && <small>{data.sub}</small>}
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}

const nodeTypes = { box: Box };

export function TopologyFlow({ dbLoad, hit, onSelect }: Props) {
  const nodes: Node<Data>[] = [
    {
      id: "users",
      type: "box",
      position: { x: 110, y: 0 },
      data: { label: t.nodes.users, tappable: false, onSelect },
    },
    {
      id: "app",
      type: "box",
      position: { x: 110, y: 90 },
      data: { label: t.nodes.app, tappable: false, onSelect },
    },
    {
      id: "cache",
      type: "box",
      position: { x: 10, y: 190 },
      data: {
        label: t.nodes.cache,
        sub: `${t.hit} ${Math.round(hit * 100)}% · ${t.illustrative}`,
        tappable: true,
        onSelect,
      },
    },
    {
      id: "db",
      type: "box",
      position: { x: 210, y: 190 },
      data: {
        label: t.nodes.db,
        sub: `${Math.round(dbLoad * 100)}% · ${t.illustrative}`,
        tappable: true,
        onSelect,
      },
    },
  ];
  const edges: Edge[] = [
    { id: "e1", source: "users", target: "app" },
    { id: "e2", source: "app", target: "cache" },
    { id: "e3", source: "app", target: "db" },
  ];
  return (
    <div className="topology">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        nodesFocusable={false}
        panOnDrag={false}
        zoomOnPinch={false}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: false }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

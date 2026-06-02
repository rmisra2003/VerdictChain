"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
} from "@xyflow/react";
import type { Edge, Node, NodeMouseHandler } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { 
  GitBranch, 
  ShieldAlert, 
  ExternalLink,
  Info
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type ForensicNodeData = {
  label: string;
  category: "Actor" | "Document" | "Media";
  desc: string;
  status: "verified" | "tampered";
};

type ForensicNode = Node<ForensicNodeData>;

// Custom styles for forensic nodes
const initialNodes: ForensicNode[] = [
  {
    id: "node-vance",
    type: "input",
    data: { 
      label: "Marcus Vance", 
      category: "Actor", 
      desc: "Lead System Engineer, NovaSpace Labs",
      status: "verified" 
    },
    position: { x: 250, y: 50 },
    className: "bg-secondary text-white border border-border p-4 rounded-xl text-left shadow-lg w-[200px]"
  },
  {
    id: "node-zurich",
    data: { 
      label: "Zurich Ingress Server Logs", 
      category: "Document", 
      desc: "Log IP Ingress (Ingress Server 185.228.168.12)",
      status: "verified" 
    },
    position: { x: 100, y: 180 },
    className: "bg-secondary text-white border border-border p-4 rounded-xl text-left shadow-lg w-[200px]"
  },
  {
    id: "node-cctv",
    data: { 
      label: "CCTV DevSector 4NW", 
      category: "Media", 
      desc: "Surveillance footage sector 4 Desk 12",
      status: "verified" 
    },
    position: { x: 400, y: 180 },
    className: "bg-secondary text-white border border-border p-4 rounded-xl text-left shadow-lg w-[200px]"
  },
  {
    id: "node-ledger",
    data: { 
      label: "Ledger_Q1_Final.xlsx", 
      category: "Document", 
      desc: "Tampered Hedgehog corporate bookkeeping",
      status: "tampered" 
    },
    position: { x: 250, y: 320 },
    className: "bg-secondary text-white border border-accent-red/50 p-4 rounded-xl text-left shadow-lg border-glow-red w-[200px]"
  },
  {
    id: "node-cfo",
    type: "output",
    data: { 
      label: "Marcus Finch (CFO)", 
      category: "Actor", 
      desc: "Subject in Hedgehog Corp Wire fraud case",
      status: "verified" 
    },
    position: { x: 50, y: 440 },
    className: "bg-secondary text-white border border-border p-4 rounded-xl text-left shadow-lg w-[200px]"
  },
  {
    id: "node-richard",
    type: "output",
    data: { 
      label: "Richard Finch", 
      category: "Actor", 
      desc: "Beneficiary owner of Apex Advisory LLC",
      status: "verified" 
    },
    position: { x: 450, y: 440 },
    className: "bg-secondary text-white border border-border p-4 rounded-xl text-left shadow-lg w-[200px]"
  }
];

const initialEdges: Edge[] = [
  {
    id: "edge-vance-zurich",
    source: "node-vance",
    target: "node-zurich",
    label: "Initiated TCP Session",
    animated: true,
    style: { stroke: "#3898ff" }
  },
  {
    id: "edge-vance-cctv",
    source: "node-vance",
    target: "node-cctv",
    label: "Logged CCTV footprint",
    style: { stroke: "#10b981" }
  },
  {
    id: "edge-ledger-vance",
    source: "node-ledger",
    target: "node-vance",
    label: "Referenced Ledger",
    style: { stroke: "#8b5cf6" }
  },
  {
    id: "edge-cfo-ledger",
    source: "node-ledger",
    target: "node-cfo",
    label: "Modified ledger values",
    animated: true,
    style: { stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "5,5" }
  },
  {
    id: "edge-ledger-richard",
    source: "node-ledger",
    target: "node-richard",
    label: "Wire to Apex Account",
    animated: true,
    style: { stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "5,5" }
  }
];

export default function InvestigationGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState<ForensicNode>(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<ForensicNode | null>(null);
  
  // Custom View Controls
  const [filterType, setFilterType] = useState("all");
  const [highlightContradictions, setHighlightContradictions] = useState(true);

  // Handle node clicks
  const onNodeClick: NodeMouseHandler<ForensicNode> = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  // Filter application logic
  useEffect(() => {
    let filteredNodes = initialNodes;
    if (filterType !== "all") {
      filteredNodes = initialNodes.filter((n) => n.data.category.toLowerCase() === filterType);
    }
    
    // Highlight tampered nodes in red
    const adjustedNodes = filteredNodes.map((n) => {
      if (highlightContradictions && n.data.status === "tampered") {
        return {
          ...n,
          className: "bg-secondary text-white border border-accent-red/80 p-4 rounded-xl text-left shadow-lg border-glow-red w-[200px]"
        };
      }
      return n;
    });

    setNodes(adjustedNodes);
  }, [filterType, highlightContradictions, setNodes]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row relative font-sans">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2.5 max-w-[90vw]">
        <Card variant="glass" className="p-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-accent-blue" />
            <span className="text-xs font-bold text-white tracking-tight">Forensic Nodes Canvas</span>
          </div>

          <div className="w-[1px] h-4 bg-border/60" />

          {/* Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-500">Filter:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-white border-none outline-none font-semibold cursor-pointer text-xs"
            >
              <option value="all">All Types</option>
              <option value="actor">Actors</option>
              <option value="document">Documents</option>
              <option value="media">Media</option>
            </select>
          </div>

          <div className="w-[1px] h-4 bg-border/60" />

          {/* Contradiction Highlights Toggle */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setHighlightContradictions(!highlightContradictions)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                highlightContradictions 
                  ? "bg-accent-red/20 text-accent-red border border-accent-red/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]" 
                  : "bg-secondary text-zinc-500 border border-border"
              }`}
            >
              Contradictions Highlighted
            </button>
          </div>
        </Card>
      </div>

      {/* Main Flow Canvas area */}
      <div className="flex-grow h-full bg-[#030303] select-none">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          className="select-none"
        >
          <Controls className="bg-secondary border border-border rounded text-white" />
          <MiniMap 
            nodeColor={(node) => {
              if (node.data?.status === "tampered") return "#ef4444";
              if (node.data?.category === "Actor") return "#3898ff";
              return "#18181b";
            }}
            className="bg-black/80 border border-border rounded" 
          />
          <Background color="#1f1f23" gap={16} />
        </ReactFlow>
      </div>

      {/* Floating Detailed Sidebar (Right) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 250, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="w-full md:w-80 h-full md:h-auto border-t md:border-t-0 md:border-l border-border/40 bg-black/80 backdrop-blur-md shrink-0 flex flex-col p-5 z-20 overflow-y-auto select-text"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4 select-text">
              <div className="space-y-0.5">
                <Badge variant={selectedNode.data.status === "tampered" ? "tampered" : "glow-blue"}>
                  {selectedNode.data.category}
                </Badge>
                <h3 className="font-bold text-white text-sm tracking-tight mt-1">{selectedNode.data.label}</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-zinc-500 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Details body */}
            <div className="space-y-5 text-xs select-text">
              <div>
                <span className="text-zinc-500 font-semibold block">Description:</span>
                <span className="text-zinc-300 mt-1 block leading-relaxed">{selectedNode.data.desc}</span>
              </div>

              {selectedNode.data.status === "tampered" && (
                <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg text-accent-red flex gap-2 items-start animate-pulse">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Contradiction Warning!</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5 block leading-normal">
                      Spreadsheet modified after SUI anchor seal. Active file hash mismatch detected.
                    </span>
                  </div>
                </div>
              )}

              <div className="border-t border-border/20 pt-4 space-y-3 font-sans">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Seal Status:</span>
                  <Badge variant={selectedNode.data.status === "verified" ? "verified" : "tampered"}>
                    {selectedNode.data.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Block Height:</span>
                  <span className="text-zinc-300 font-mono">#14,882,903</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Custodian:</span>
                  <span className="text-zinc-300 font-semibold">Dr. Wright</span>
                </div>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-1 font-mono text-[9px]">
                <span className="text-zinc-500 font-sans font-semibold block text-[10px]">Anchor Transaction:</span>
                <span className="text-accent-blue truncate block cursor-pointer hover:underline select-all">
                  0x8fa3f92bcde28abcf38dcde12a2a2bcde38cdefa19cde29fb3e8d2
                </span>
              </div>

              <div className="border-t border-border/20 pt-4">
                <Button variant="glow" size="sm" className="w-full text-xs font-bold gap-1">
                  Inspect Cryptographic Index <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Canvas Instructions (Bottom Left) */}
      {!selectedNode && (
        <div className="absolute bottom-4 left-4 z-10 hidden sm:block pointer-events-none">
          <Card variant="glass" className="p-3 max-w-xs flex gap-2 items-start bg-black/60 backdrop-blur-md">
            <Info className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-500 leading-normal font-sans">
              Click on any node to open the Case Forensic Detail side panel. Highlight Contradictions to view altered nodes (red borders) vs verified nodes.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

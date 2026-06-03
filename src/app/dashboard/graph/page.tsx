"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  ExternalLink,
  Info,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CaseRecord,
  generateCaseGraph,
  getActiveCaseId,
  getCaseGraph,
  GraphRecord,
  listCases,
  setActiveCaseId,
} from "@/lib/api";

type ForensicNodeData = {
  label: string;
  category: string;
  desc: string;
  status: "verified";
};

type ForensicNode = Node<ForensicNodeData>;

function graphToFlow(graph: GraphRecord | null): { nodes: ForensicNode[]; edges: Edge[] } {
  const graphNodes = graph?.graph_json.nodes || [];
  const graphEdges = graph?.graph_json.edges || [];

  const nodes: ForensicNode[] = graphNodes.map((item, index) => ({
    id: item.id,
    data: {
      label: item.label || item.id,
      category: item.type || "entity",
      desc: Object.entries(item.metadata || {})
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(", ") || "Generated relationship node",
      status: "verified",
    },
    position: {
      x: 120 + (index % 3) * 260,
      y: 80 + Math.floor(index / 3) * 180,
    },
    className: "bg-secondary text-white border border-border p-4 rounded-xl text-left shadow-lg w-[220px]",
  }));

  const edges: Edge[] = graphEdges.map((item, index) => ({
    id: `edge-${index}-${item.source}-${item.target}`,
    source: item.source,
    target: item.target,
    label: item.label || "related",
    animated: (item.weight || 0) >= 0.8,
    style: { stroke: "#3898ff" },
  }));

  return { nodes, edges };
}

export default function InvestigationGraph() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [graph, setGraph] = useState<GraphRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedNode, setSelectedNode] = useState<ForensicNode | null>(null);

  const flowData = useMemo(() => graphToFlow(graph), [graph]);
  const [nodes, setNodes, onNodesChange] = useNodesState<ForensicNode>(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges);

  useEffect(() => {
    setNodes(flowData.nodes);
    setEdges(flowData.edges);
  }, [flowData, setEdges, setNodes]);

  const loadGraph = async (caseId: string) => {
    setSelectedNode(null);
    setSelectedCaseId(caseId);
    if (caseId) setActiveCaseId(caseId);
    setLoading(true);
    setErrorMessage("");
    try {
      setGraph(caseId ? await getCaseGraph(caseId) : null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load graph.");
    } finally {
      setLoading(false);
    }
  };

  const generateGraph = async () => {
    if (!selectedCaseId) return;
    setGenerating(true);
    setErrorMessage("");
    try {
      setGraph(await generateCaseGraph(selectedCaseId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to generate graph.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadInitialGraph = async () => {
      await Promise.resolve();
      setLoading(true);
      setErrorMessage("");
      try {
        const loadedCases = await listCases();
        if (!mounted) return;
        setCases(loadedCases);
        const storedCaseId = getActiveCaseId();
        const nextCaseId = loadedCases.find((item) => item.id === storedCaseId)?.id || loadedCases[0]?.id || "";
        setSelectedCaseId(nextCaseId);
        setGraph(nextCaseId ? await getCaseGraph(nextCaseId) : null);
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load graph workspace.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadInitialGraph();
    return () => {
      mounted = false;
    };
  }, []);

  const onNodeClick: NodeMouseHandler<ForensicNode> = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row relative font-sans">
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2.5 max-w-[90vw]">
        <Card variant="glass" className="p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-accent-blue" />
            <span className="text-xs font-bold text-white tracking-tight">Generated Relationship Graph</span>
          </div>

          <div className="w-[1px] h-4 bg-border/60 hidden sm:block" />

          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-500">Case:</span>
            <select
              value={selectedCaseId}
              onChange={(event) => loadGraph(event.target.value)}
              className="bg-transparent text-white border-none outline-none font-semibold cursor-pointer text-xs max-w-[220px]"
              disabled={loading || cases.length === 0}
            >
              {cases.length === 0 ? (
                <option value="">No cases</option>
              ) : (
                cases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <Button variant="secondary" size="sm" className="gap-2" onClick={generateGraph} disabled={!selectedCaseId || generating}>
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
            Generate
          </Button>
        </Card>
      </div>

      {errorMessage && (
        <div className="absolute top-24 left-4 right-4 z-10">
          <Card variant="glass" className="p-4 border border-accent-red/30 bg-accent-red/10 text-xs text-accent-red">
            {errorMessage}
          </Card>
        </div>
      )}

      <div className="flex-grow h-full bg-[#030303] select-none">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-500">
            <RefreshCw className="w-4 h-4 animate-spin text-accent-blue mr-2" />
            Loading graph snapshot...
          </div>
        ) : nodes.length > 0 ? (
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
                if (node.data?.category === "person") return "#3898ff";
                if (node.data?.category === "organization") return "#8b5cf6";
                return "#18181b";
              }}
              className="bg-black/80 border border-border rounded"
            />
            <Background color="#1f1f23" gap={16} />
          </ReactFlow>
        ) : (
          <div className="h-full flex items-center justify-center px-6">
            <Card variant="glass" className="p-8 max-w-md text-center">
              <GitBranch className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
              <h2 className="text-sm font-bold text-white">No graph snapshot yet</h2>
              <p className="text-xs text-zinc-500 mt-1">Generate a graph after uploading evidence to this case.</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={generateGraph} disabled={!selectedCaseId || generating}>
                Generate Graph
              </Button>
            </Card>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 250, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="w-full md:w-80 h-full md:h-auto border-t md:border-t-0 md:border-l border-border/40 bg-black/80 backdrop-blur-md shrink-0 flex flex-col p-5 z-20 overflow-y-auto select-text"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4 select-text">
              <div className="space-y-0.5">
                <Badge variant="glow-blue">
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

            <div className="space-y-5 text-xs select-text">
              <div>
                <span className="text-zinc-500 font-semibold block">Description:</span>
                <span className="text-zinc-300 mt-1 block leading-relaxed">{selectedNode.data.desc}</span>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-3 font-sans">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Node Type:</span>
                  <Badge variant="verified">{selectedNode.data.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Source:</span>
                  <span className="text-zinc-300 font-semibold">DeepSeek graph snapshot</span>
                </div>
              </div>

              <div className="border-t border-border/20 pt-4">
                <Button variant="glow" size="sm" className="w-full text-xs font-bold gap-1">
                  Inspect Case Graph <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedNode && nodes.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 hidden sm:block pointer-events-none">
          <Card variant="glass" className="p-3 max-w-xs flex gap-2 items-start bg-black/60 backdrop-blur-md">
            <Info className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-500 leading-normal font-sans">
              Click any generated node to inspect metadata from the latest case graph snapshot.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

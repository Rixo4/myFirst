import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, RefreshCw, Share2 } from 'lucide-react';

const NODE_COLORS = {
  topic:   '#6366f1',
  method:  '#8b5cf6',
  concept: '#06b6d4',
  dataset: '#10b981',
  author:  '#f59e0b',
};

export default function KnowledgeGraph() {
  const canvasRef = useRef(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  const animFrameRef = useRef(null);
  const dragRef = useRef(null);
  const tickRef = useRef(0);

  // ─── Physics ──────────────────────────────────────────────────────────────
  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;

    const W = canvas.width;
    const H = canvas.height;
    const k = Math.sqrt((W * H) / nodes.length) * 1.2;

    nodes.forEach(n => { n.fx = 0; n.fy = 0; });

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x || 0.01;
        const dy = nodes[j].y - nodes[i].y || 0.01;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (k * k) / dist;
        nodes[i].fx -= force * dx / dist;
        nodes[i].fy -= force * dy / dist;
        nodes[j].fx += force * dx / dist;
        nodes[j].fy += force * dy / dist;
      }
    }

    // Spring attraction along edges
    edges.forEach(e => {
      const src = nodes.find(n => n.id === e.from);
      const tgt = nodes.find(n => n.id === e.to);
      if (!src || !tgt) return;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const idealDist = k * 0.9;
      const force = (dist - idealDist) * 0.05;
      src.fx += force * dx / dist;
      src.fy += force * dy / dist;
      tgt.fx -= force * dx / dist;
      tgt.fy -= force * dy / dist;
    });

    // Gentle center gravity
    nodes.forEach(n => {
      n.fx += (W / 2 - n.x) * 0.008;
      n.fy += (H / 2 - n.y) * 0.008;
    });

    // Integrate with damping
    const damping = Math.max(0.3, 1 - tickRef.current * 0.003);
    nodes.forEach(n => {
      if (n.dragging) return;
      n.vx = (n.vx + n.fx * 0.4) * damping;
      n.vy = (n.vy + n.fy * 0.4) * damping;
      n.x = Math.max(50, Math.min(W - 50, n.x + n.vx));
      n.y = Math.max(50, Math.min(H - 50, n.y + n.vy));
    });

    tickRef.current++;
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  const draw = useCallback((selNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(e => {
      const src = nodes.find(n => n.id === e.from);
      const tgt = nodes.find(n => n.id === e.to);
      if (!src || !tgt) return;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Edge label
      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(e.label, mx, my - 4);
    });

    // Draw nodes
    nodes.forEach(n => {
      const color = NODE_COLORS[n.type] || '#6366f1';
      const isCenter = n.id === '1';
      const isSelected = selNode && selNode.id === n.id;
      const radius = isCenter ? 30 : 22;

      // Glow ring for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = color + '22';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = color + '44';
        ctx.fill();
      }

      // Node body
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(n.x - radius * 0.3, n.y - radius * 0.3, 0, n.x, n.y, radius);
      grad.addColorStop(0, color + 'ee');
      grad.addColorStop(1, color + '88');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#fff' : color;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = `${isCenter ? 'bold 12' : '11'}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const words = n.label.split(' ');
      if (words.length <= 2) {
        ctx.fillText(n.label, n.x, n.y);
      } else {
        ctx.fillText(words.slice(0, 2).join(' '), n.x, n.y - 7);
        ctx.fillText(words.slice(2).join(' '), n.x, n.y + 7);
      }
    });
  }, []);

  // ─── Animation loop ────────────────────────────────────────────────────────
  const selectedRef = useRef(null);
  selectedRef.current = selectedNode;

  const loop = useCallback(() => {
    simulate();
    draw(selectedRef.current);
    animFrameRef.current = requestAnimationFrame(loop);
  }, [simulate, draw]);

  useEffect(() => {
    if (graphData) {
      tickRef.current = 0;
      animFrameRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [graphData, loop]);

  // ─── Search ────────────────────────────────────────────────────────────────
  const initGraph = useCallback((data) => {
    const canvas = canvasRef.current;
    const W = canvas?.width || 1400;
    const H = canvas?.height || 600;
    const centerX = W / 2;
    const centerY = H / 2;

    nodesRef.current = data.nodes.map((n) => ({
      ...n,
      x: centerX + (Math.random() - 0.5) * 600,
      y: centerY + (Math.random() - 0.5) * 400,
      vx: 0,
      vy: 0,
      dragging: false,
    }));
    edgesRef.current = data.edges || [];
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setSelectedNode(null);
    cancelAnimationFrame(animFrameRef.current);
    try {
      const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
      const res = await fetch(`${BACKEND}/api/knowledge-graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setGraphData(data);
      initGraph(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Mouse interactions ────────────────────────────────────────────────────
  const getNode = (x, y) => nodesRef.current.find(n => {
    const r = n.id === '1' ? 30 : 22;
    return Math.hypot(n.x - x, n.y - y) < r;
  });

  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const onMouseDown = (e) => {
    const { x, y } = getCanvasPos(e);
    const node = getNode(x, y);
    if (node) {
      node.dragging = true;
      dragRef.current = node;
      setSelectedNode({ ...node });
    }
  };

  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    const { x, y } = getCanvasPos(e);
    dragRef.current.x = x;
    dragRef.current.y = y;
  };

  const onMouseUp = () => {
    if (dragRef.current) {
      dragRef.current.dragging = false;
      dragRef.current.vx = 0;
      dragRef.current.vy = 0;
      dragRef.current = null;
    }
  };

  const onClick = (e) => {
    const { x, y } = getCanvasPos(e);
    const node = getNode(x, y);
    setSelectedNode(node ? { ...node } : null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#818cf8', fontSize: '1.6rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Share2 size={28} /> Knowledge Graph
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          AI maps entities and relationships for any topic — drag nodes to explore
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='e.g. "Transformer models", "CRISPR", "Quantum computing"'
          style={{
            flex: 1, padding: '12px 20px', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
            color: '#fff', fontSize: '0.95rem', outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          style={{
            padding: '12px 24px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', gap: '8px',
            opacity: isLoading || !query.trim() ? 0.5 : 1, transition: 'opacity 0.2s',
            fontWeight: '600', fontSize: '0.9rem',
          }}
        >
          {isLoading
            ? <><RefreshCw size={16} className="pulse" /> Generating...</>
            : <><Search size={16} /> Generate Graph</>}
        </button>
      </form>

      {/* Canvas area */}
      <div style={{
        flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)'
      }}>
        {/* Empty state */}
        {!graphData && !isLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <Share2 size={52} style={{ opacity: 0.2, color: '#818cf8' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Enter a topic to generate an interactive knowledge graph</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Transformer models', 'CRISPR gene editing', 'Reinforcement learning'].map(s => (
                <button key={s} onClick={() => { setQuery(s); }} style={{
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: '999px', padding: '6px 14px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.85rem'
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <RefreshCw size={36} className="pulse" style={{ color: '#818cf8' }} />
            <p style={{ color: 'var(--text-secondary)' }}>AI is mapping knowledge connections...</p>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={1400} height={600}
          style={{ width: '100%', height: '100%', cursor: 'grab', display: graphData ? 'block' : 'none' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClick={onClick}
        />

        {/* Legend */}
        {graphData && (
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                padding: '4px 10px', borderRadius: '999px', border: `1px solid ${color}33`
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '0.72rem', color: '#ccc', textTransform: 'capitalize' }}>{type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {graphData && (
          <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: '10px', padding: '8px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <span style={{ color: '#a5b4fc', fontWeight: '600' }}>{graphData.nodes?.length}</span> nodes &nbsp;·&nbsp;
              <span style={{ color: '#a5b4fc', fontWeight: '600' }}>{graphData.edges?.length}</span> edges
            </p>
          </div>
        )}

        {/* Selected node info panel */}
        {selectedNode && (
          <div style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(8, 8, 18, 0.92)', backdropFilter: 'blur(16px)',
            border: `1px solid ${NODE_COLORS[selectedNode.type] || '#6366f1'}55`,
            borderRadius: '14px', padding: '18px', maxWidth: '230px',
            boxShadow: `0 0 24px ${NODE_COLORS[selectedNode.type] || '#6366f1'}22`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: NODE_COLORS[selectedNode.type] || '#6366f1' }} />
              <span style={{ fontSize: '0.7rem', color: NODE_COLORS[selectedNode.type] || '#6366f1', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                {selectedNode.type}
              </span>
            </div>
            <p style={{ color: '#fff', fontWeight: '700', fontSize: '1rem', marginBottom: '8px' }}>{selectedNode.label}</p>
            {selectedNode.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '1.6' }}>
                {selectedNode.description}
              </p>
            )}
            <button
              onClick={() => setSelectedNode(null)}
              style={{ marginTop: '12px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              ✕ Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

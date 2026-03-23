import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const API_BASE = '/api';
const socket = io();

function EtChat() {
  const canvasRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [messages, setMessages] = useState([]);
  const [chatName, setChatName] = useState(() => {
    return localStorage.getItem('retro-site-user-name') || '名無しさん';
  });
  const [chatInput, setChatInput] = useState('');

  const startPos = useRef({ x: 0, y: 0 });
  const snapshot = useRef(null);

  const fetchMessages = () => {
    fetch(`${API_BASE}/etchat?t=${Date.now()}`).then(res => res.json()).then(setMessages);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    saveHistory();
    fetchMessages();

    socket.on('etchat_update', fetchMessages);
    return () => socket.off('etchat_update');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('retro-site-user-name', chatName);
  }, [chatName]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = history[prevIndex];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const clearCanvas = () => {
    if (window.confirm('キャンバスをすべて消去しますか？')) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory();
    }
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    startPos.current = pos;
    const canvas = canvasRef.current;
    snapshot.current = canvas.toDataURL();

    if (tool === 'pen' || tool === 'eraser') {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'pen' || tool === 'eraser') {
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.lineWidth = brushSize;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      const img = new Image();
      img.src = snapshot.current;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        if (tool === 'rect') {
          ctx.strokeRect(startPos.current.x, startPos.current.y, pos.x - startPos.current.x, pos.y - startPos.current.y);
        } else if (tool === 'circle') {
          const r = Math.sqrt(Math.pow(pos.x - startPos.current.x, 2) + Math.pow(pos.y - startPos.current.y, 2));
          ctx.arc(startPos.current.x, startPos.current.y, r, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (tool === 'line') {
          ctx.moveTo(startPos.current.x, startPos.current.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        }
      };
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory();
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = {
      name: chatName.trim() || '名無しさん',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    };
    fetch(`${API_BASE}/etchat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    }).then(() => {
      setChatInput('');
    });
  };

  return (
    <div className="etchat-container">
      <h2>お絵描きチャット (Beta)</h2>
      <div className="etchat-layout" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div className="canvas-area">
          <canvas
            ref={canvasRef}
            width="600"
            height="400"
            style={{ border: '2px solid #00FF00', background: '#FFF', cursor: 'crosshair', maxWidth: '100%' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="controls" style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            <select value={brushSize} onChange={(e) => setBrushSize(e.target.value)}>
              {[1, 3, 5, 10, 20].map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
            <select value={tool} onChange={(e) => setTool(e.target.value)}>
              <option value="pen">ペン</option>
              <option value="line">直線</option>
              <option value="rect">四角</option>
              <option value="circle">円</option>
              <option value="eraser">消しゴム</option>
            </select>
            <button onClick={undo}>元に戻す</button>
            <button onClick={clearCanvas}>全消去</button>
          </div>
        </div>
        <div className="chat-area" style={{ flex: '1', minWidth: '250px', border: '1px solid #00FF00', display: 'flex', flexDirection: 'column', height: '480px' }}>
          <div className="chat-messages" style={{ flex: '1', overflowY: 'auto', padding: '10px', background: '#001100', fontSize: '13px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: '5px', borderBottom: '1px solid #003300' }}>
                <span style={{ color: '#00FF00', fontWeight: 'bold' }}>{m.name}</span>
                <span style={{ color: '#999', fontSize: '10px', marginLeft: '5px' }}>{m.time}</span><br />
                <span>{m.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendChat} style={{ padding: '10px', background: '#000', borderTop: '1px solid #00FF00' }}>
            <input
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="名前"
              style={{ width: '100%', marginBottom: '5px', background: '#222', color: '#FFF', border: '1px solid #444' }}
            />
            <div style={{ display: 'flex', gap: '5px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="メッセージを入力..."
                style={{ flex: '1', background: '#222', color: '#FFF', border: '1px solid #444' }}
              />
              <button type="submit">送信</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EtChat;

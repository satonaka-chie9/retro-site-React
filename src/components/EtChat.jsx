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
  const lastPos = useRef({ x: 0, y: 0 });
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
    
    // 他のユーザーの描画を受信
    socket.on('draw_event', (data) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (data.tool === 'pen' || data.tool === 'eraser') {
        ctx.strokeStyle = data.tool === 'eraser' ? '#FFFFFF' : data.color;
        ctx.lineWidth = data.brushSize;
        ctx.beginPath();
        ctx.moveTo(data.prevX, data.prevY);
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
      }
      ctx.restore();
    });

    // キャンバス全体の同期を受信 (Undo/Redo/Clear/参加時)
    socket.on('canvas_sync', (dataURL) => {
      const img = new Image();
      img.src = dataURL;
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        saveHistory(); // 他人の変更も一応履歴に入れる
      };
    });

    // 参加時に最新のキャンバスを要求
    socket.on('request_canvas', () => {
      socket.emit('canvas_sync', canvasRef.current.toDataURL());
    });

    socket.emit('request_canvas');

    return () => {
      socket.off('etchat_update');
      socket.off('draw_event');
      socket.off('canvas_sync');
      socket.off('request_canvas');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('retro-site-user-name', chatName);
  }, [chatName]);

  const saveHistory = (noSync = false) => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataURL);
    // 履歴は最大20個まで
    if (newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    if (!noSync) {
      // 変更があったら同期
      // socket.emit('canvas_sync', dataURL); // ここでやると重い可能性があるので、特定のタイミングにする
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      loadHistory(prevIndex, true);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      loadHistory(nextIndex, true);
    }
  };

  const loadHistory = (index, shouldSync = false) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = history[index];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      if (shouldSync) {
        socket.emit('canvas_sync', history[index]);
      }
    };
  };

  const clearCanvas = () => {
    if (window.confirm('キャンバスをすべて消去しますか？')) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL();
      saveHistory();
      socket.emit('canvas_sync', dataURL);
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

  // 塗りつぶし (簡易的なシードフィル)
  const floodFill = (startX, startY, fillColor) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const getPixel = (x, y) => {
      const i = (y * canvas.width + x) * 4;
      return [data[i], data[i+1], data[i+2], data[i+3]];
    };

    const targetColor = getPixel(Math.floor(startX), Math.floor(startY));
    const fillRGB = hexToRgb(fillColor);

    if (colorsMatch(targetColor, [fillRGB.r, fillRGB.g, fillRGB.b, 255])) return;

    const stack = [[Math.floor(startX), Math.floor(startY)]];
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const i = (y * canvas.width + x) * 4;

      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height && colorsMatch(getPixel(x, y), targetColor)) {
        data[i] = fillRGB.r;
        data[i+1] = fillRGB.g;
        data[i+2] = fillRGB.b;
        data[i+3] = 255;

        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const dataURL = canvas.toDataURL();
    saveHistory();
    socket.emit('canvas_sync', dataURL);
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const colorsMatch = (c1, c2) => {
    return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && Math.abs(c1[3] - c2[3]) < 10;
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    
    if (tool === 'fill') {
      floodFill(pos.x, pos.y, color);
      return;
    }

    setIsDrawing(true);
    startPos.current = pos;
    lastPos.current = pos;
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

      // 同期用イベント送信
      socket.emit('draw_event', {
        tool,
        x: pos.x,
        y: pos.y,
        prevX: lastPos.current.x,
        prevY: lastPos.current.y,
        color,
        brushSize
      });
      lastPos.current = pos;
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
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL();
      saveHistory();
      
      // 図形描画や、ペン描画終了時の確実な同期
      socket.emit('canvas_sync', dataURL);
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
      <h2>絵チャ</h2>
      <div className="draw_chat_wrapper">
        
        {/* 🎨 描画エリア */}
        <div className="draw_area">
          <div className="controls">
            <div className="control-group">
              <span className="label">設定:</span>
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                title="色を選択"
              />
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={brushSize} 
                onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                title="太さを調整"
              />
            </div>
            
            <div className="control-group">
              <span className="label">ツール:</span>
              <button 
                className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
                onClick={() => setTool('pen')}
              >ペン</button>
              <button 
                className={`tool-btn ${tool === 'line' ? 'active' : ''}`}
                onClick={() => setTool('line')}
              >直線</button>
              <button 
                className={`tool-btn ${tool === 'rect' ? 'active' : ''}`}
                onClick={() => setTool('rect')}
              >四角</button>
              <button 
                className={`tool-btn ${tool === 'fill' ? 'active' : ''}`}
                onClick={() => setTool('fill')}
              >塗り</button>
              <button 
                className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                onClick={() => setTool('eraser')}
              >消しゴム</button>
            </div>

            <div className="control-group">
              <span className="label">操作:</span>
              <button onClick={undo} className="action-btn">戻る</button>
              <button onClick={redo} className="action-btn">進む</button>
              <button onClick={clearCanvas} className="action-btn danger">全消し</button>
            </div>
          </div>
          
          <div id="canvas-container" style={{ position: 'relative', display: 'inline-block', background: '#FFF', border: '2px solid #00FF00' }}>
            <canvas 
              ref={canvasRef}
              width="600" 
              height="500"
              style={{ cursor: tool === 'fill' ? 'crosshair' : 'crosshair', display: 'block' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            ></canvas>
          </div>
        </div>

        {/* 💬 チャットエリア */}
        <div className="chat_area">
          <div className="operation_guide">
            <p className="guide_title">絵チャとは</p>
            <ul className="guide_list">
              <li>絵チャとはチャットでお話をしながら絵を描く物です</li>
              <li>昔の文化になりつつありますが現在もたまに見かけます</li>
            </ul>
            <p className="guide_title">【操作説明】</p>
            <ul className="guide_list">
              <li>ペン：マウスで自由描画</li>
              <li>直線/四角：ドラッグで描画</li>
              <li>塗り：クリックで塗りつぶし</li>
              <li>戻る/進む：1つ前の状態を同期</li>
              <li>全消し：キャンバスをリセット</li>
            </ul>
          </div>
          
          <div id="chat_messages">
            {messages.map((m, i) => (
              <div key={i}>
                <span className="chat-time">[{m.time}]</span>
                <span className="chat-name">{m.name}:</span>
                <span className="chat-text">{m.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form id="chatForm" onSubmit={handleSendChat}>
            <input 
              type="text" 
              value={chatName} 
              onChange={(e) => setChatName(e.target.value)} 
              placeholder="名前"
            />
            <div className="chat-input-group">
              <input 
                type="text" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                placeholder="メッセージを入力..."
                required
                style={{ flex: 1 }}
              />
              <input type="submit" value="送信" />
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default EtChat;

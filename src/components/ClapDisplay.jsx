import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_BASE = '/api';
const socket = io();

function ClapDisplay() {
  const [claps, setClaps] = useState([]);

  const fetchClaps = () => {
    fetch(`${API_BASE}/claps?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        // メッセージがあるものだけ抽出し、最新の5件を表示
        const filtered = data
          .filter(c => c.message && c.message.trim() !== '')
          .reverse()
          .slice(0, 5);
        setClaps(filtered);
      });
  };

  useEffect(() => {
    fetchClaps();
    socket.on('claps_update', fetchClaps);
    return () => socket.off('claps_update');
  }, []);

  if (claps.length === 0) return null;

  return (
    <div className="news-section" style={{ marginTop: '40px' }}>
      <h3>◆ 届いた拍手メッセージ</h3>
      <p style={{ fontSize: '0.8em', color: '#00CC00' }}>最近届いた温かいメッセージです</p>
      <div className="claps-display-list">
        {claps.map(clap => (
          <div key={clap.id} className="post" style={{ marginBottom: '10px' }}>
            <div className="post_header" style={{ fontSize: '0.8em' }}>
              {clap.timestamp}
            </div>
            <div className="post_body" style={{ fontStyle: 'italic' }}>
              {clap.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClapDisplay;

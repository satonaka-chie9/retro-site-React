import { useState, useEffect } from 'react';

const API_BASE = '/api';

function AdminClaps({ isAdmin }) {
  const [claps, setClaps] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/claps`)
      .then(res => res.json())
      .then(data => {
        // 新しい順に表示
        setClaps([...data].reverse());
      });
  }, []);

  if (!isAdmin) {
    return <p>このページにアクセスする権限がありません。ログインしてください。</p>;
  }

  const handleDelete = (id) => {
    if (window.confirm('このメッセージを削除しますか？')) {
      fetch(`${API_BASE}/claps/${id}`, { method: 'DELETE' })
        .then(() => {
          setClaps(claps.filter(c => c.id !== id));
        });
    }
  };

  const totalClaps = claps.length;
  const messageCount = claps.filter(c => c.message && c.message.trim() !== '').length;

  return (
    <div className="admin-container">
      <h2>管理者用拍手メッセージ管理</h2>
      
      <div className="admin-stats" style={{ border: '1px solid #00FF00', padding: '15px', marginBottom: '20px', background: '#001100' }}>
        <p>◆ 統計情報</p>
        <ul style={{ listStyle: 'none', paddingLeft: '10px' }}>
          <li>総拍手数: {totalClaps} 件</li>
          <li>メッセージ付き: {messageCount} 件</li>
        </ul>
      </div>

      <h3>◆ 届いたメッセージ (最新100件)</h3>
      <div className="claps-list">
        {claps.length === 0 ? (
          <p>メッセージはまだありません。</p>
        ) : (
          claps.slice(0, 100).map(clap => (
            <div key={clap.id} className="post" style={{ marginBottom: '15px', border: '1px solid #004400' }}>
              <div className="post_header" style={{ display: 'flex', justifyContent: 'space-between', background: '#002200', padding: '5px 10px' }}>
                <span style={{ fontSize: '0.8em', color: '#00CC00' }}>{clap.timestamp}</span>
                <button onClick={() => handleDelete(clap.id)} style={{ color: '#FF3333', background: 'none', border: '1px solid #FF3333', cursor: 'pointer', fontSize: '10px' }}>
                  [削除]
                </button>
              </div>
              <div className="post_body" style={{ padding: '10px', background: '#050505', minHeight: '20px', whiteSpace: 'pre-wrap' }}>
                {clap.message ? clap.message : <span style={{ color: '#444', fontStyle: 'italic' }}>(メッセージなしの拍手)</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminClaps;

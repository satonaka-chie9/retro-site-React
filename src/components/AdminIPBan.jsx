import { useState, useEffect } from 'react';

const API_BASE = '/api';

function AdminIPBan({ isAdmin }) {
  const [banList, setBanList] = useState([]);
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/bans`)
      .then(res => res.json())
      .then(setBanList);
  }, []);

  if (!isAdmin) {
    return <p>このページにアクセスする権限がありません。ログインしてください。</p>;
  }

  const handleAddBan = (e) => {
    e.preventDefault();
    if (!newIp.trim()) return;

    const newItem = {
      ip: newIp.trim(),
      reason: newReason.trim() || '未指定',
      date: new Date().toLocaleDateString('ja-JP')
    };

    fetch(`${API_BASE}/bans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    })
      .then(res => res.json())
      .then(data => {
        setBanList([{ id: data.id, ...newItem }, ...banList]);
        setNewIp('');
        setNewReason('');
      });
  };

  const handleDeleteBan = (id) => {
    if (window.confirm('このIP制限を解除しますか？')) {
      fetch(`${API_BASE}/bans/${id}`, { method: 'DELETE' })
        .then(() => {
          setBanList(banList.filter(item => item.id !== id));
        });
    }
  };

  return (
    <div className="admin-container">
      <h2>◆ IP制限（アクセス禁止）管理</h2>
      
      <div className="manage-section" style={{ border: '1px solid #00FF00', padding: '15px', marginBottom: '20px', background: '#000' }}>
        <div className="ban-form" style={{ marginBottom: '15px', padding: '10px', border: '1px dashed #00FF00' }}>
          <h3>新規制限追加</h3>
          <form onSubmit={handleAddBan}>
            IPアドレス: 
            <input 
              type="text" 
              value={newIp} 
              onChange={(e) => setNewIp(e.target.value)} 
              placeholder="127.0.0.1" 
              className="admin-input" 
              style={{ width: '150px', marginLeft: '5px', marginRight: '10px' }}
            />
            理由: 
            <input 
              type="text" 
              value={newReason} 
              onChange={(e) => setNewReason(e.target.value)} 
              placeholder="荒らし等" 
              className="admin-input" 
              style={{ width: '200px', marginLeft: '5px', marginRight: '10px' }}
            />
            <button type="submit">制限を追加</button>
          </form>
        </div>

        <h3>制限中IP一覧</h3>
        <table className="manage-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #00FF00', padding: '8px', textAlign: 'left' }}>IPアドレス</th>
              <th style={{ border: '1px solid #00FF00', padding: '8px', textAlign: 'left' }}>理由</th>
              <th style={{ border: '1px solid #00FF00', padding: '8px', textAlign: 'left' }}>登録日</th>
              <th style={{ border: '1px solid #00FF00', padding: '8px', textAlign: 'left' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {banList.length === 0 ? (
              <tr><td colSpan="4" style={{ border: '1px solid #00FF00', padding: '8px', textAlign: 'center' }}>制限中のIPはありません</td></tr>
            ) : (
              banList.map(item => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #00FF00', padding: '8px' }}>{item.ip}</td>
                  <td style={{ border: '1px solid #00FF00', padding: '8px' }}>{item.reason}</td>
                  <td style={{ border: '1px solid #00FF00', padding: '8px' }}>{item.date}</td>
                  <td style={{ border: '1px solid #00FF00', padding: '8px' }}>
                    <button onClick={() => handleDeleteBan(item.id)} style={{ color: '#FF3333', background: 'none', border: '1px solid #FF3333', cursor: 'pointer', fontSize: '10px' }}>
                      解除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminIPBan;

import { useState, useEffect } from 'react';

const API_BASE = '/api';

function Links({ isAdmin }) {
  const [links, setLinks] = useState([]);

  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/links`)
      .then(res => res.json())
      .then(setLinks);
  }, []);

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    const newLink = {
      name: newName.trim(),
      url: newUrl.trim(),
      description: newDesc.trim() || 'なし'
    };

    fetch(`${API_BASE}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLink)
    })
      .then(res => res.json())
      .then(data => {
        setLinks([...links, { id: data.id, ...newLink }]);
        setNewName('');
        setNewUrl('');
        setNewDesc('');
      });
  };

  const handleDeleteLink = (id) => {
    if (window.confirm('このリンクを削除しますか？')) {
      fetch(`${API_BASE}/links/${id}`, { method: 'DELETE' })
        .then(() => {
          setLinks(links.filter(link => link.id !== id));
        });
    }
  };

  return (
    <div className="links-container center_text">
      <h2>リンク集</h2>
      <p>相互リンク募集中</p>
      
      {isAdmin && (
        <div className="form-container" style={{ marginBottom: '30px', textAlign: 'left' }}>
          <h3>◆ 新規リンク追加 (管理者用)</h3>
          <form onSubmit={handleAddLink}>
            <div className="form-group">
              <label>サイト名: </label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="サイト名" />
            </div>
            <div className="form-group">
              <label>URL: </label>
              <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label>説明: </label>
              <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="サイトの説明" style={{ width: '80%' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <button type="submit">追加する</button>
            </div>
          </form>
        </div>
      )}

      <table className="profile_box" style={{ margin: '0 auto', width: '100%', maxWidth: '800px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #00FF00', padding: '10px', background: '#002200' }}>サイト名</th>
            <th style={{ border: '1px solid #00FF00', padding: '10px', background: '#002200' }}>説明</th>
            {isAdmin && <th style={{ border: '1px solid #00FF00', padding: '10px', background: '#002200' }}>操作</th>}
          </tr>
        </thead>
        <tbody>
          {links.map(link => (
            <tr key={link.id}>
              <td style={{ border: '1px solid #00FF00', padding: '10px' }}>
                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00FF00', fontWeight: 'bold' }}>
                  {link.name}
                </a>
              </td>
              <td style={{ border: '1px solid #00FF00', padding: '10px', textAlign: 'left' }}>
                {link.description}
              </td>
              {isAdmin && (
                <td style={{ border: '1px solid #00FF00', padding: '10px' }}>
                  <button onClick={() => handleDeleteLink(link.id)} style={{ color: '#FF3333', background: 'none', border: '1px solid #FF3333', cursor: 'pointer', fontSize: '10px' }}>
                    [削除]
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Links;

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_BASE = '/api';
const socket = io();

function BBS({ isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [name, setName] = useState(() => {
    return localStorage.getItem('retro-site-user-name') || '名無しさん';
  });
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const [deviceId, setDeviceId] = useState('');
  const [ipAddress, setIpAddress] = useState('');

  const fetchPosts = () => {
    fetch(`${API_BASE}/bbs?t=${Date.now()}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(err => console.error('Fetch posts error:', err));
  };

  useEffect(() => {
    let id = localStorage.getItem('retro-site-device-id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('retro-site-device-id', id);
    }
    setDeviceId(id);

    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(err => console.error('IP取得エラー:', err));

    fetchPosts();

    socket.on('bbs_update', fetchPosts);
    socket.on('connect', () => console.log('Socket connected'));
    socket.on('connect_error', (err) => console.error('Socket connect error:', err));

    return () => {
      socket.off('bbs_update');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('retro-site-user-name', name);
  }, [name]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('本文を入力してください。');
      return;
    }

    const newPost = {
      name: name.trim() || '名無しさん',
      title: title.trim() || '無題',
      content: content,
      deviceId: deviceId,
      ipAddress: ipAddress,
      timestamp: new Date().toLocaleString('ja-JP'),
    };

    fetch(`${API_BASE}/bbs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost)
    })
      .then(res => {
        if (!res.ok) throw new Error('Post failed');
        return res.json();
      })
      .then(data => {
        const finalName = data.name || newPost.name;
        setName(finalName);
        setTitle('');
        setContent('');
        // サーバーから 'bbs_update' が飛んできて fetchPosts() が走り、
        // サーバー側で ASC になっているので自動的に下に付きます。
      })
      .catch(err => {
        console.error('Submit post error:', err);
        alert('投稿に失敗しました。サーバーとの通信を確認してください。');
      });
  };

  const handleDelete = (post) => {
    const isOwner = post.deviceId === deviceId && post.ipAddress === ipAddress;
    if (isAdmin || isOwner) {
      const msg = isAdmin ? '管理者権限でこの投稿を削除しますか？' : '自分の投稿を削除しますか？';
      if (window.confirm(msg)) {
        fetch(`${API_BASE}/bbs/${post.id}`, { method: 'DELETE' });
      }
    } else {
      alert('削除権限がありません。');
    }
  };

  return (
    <div className="bbs-container">
      <h2>BBS (掲示板)</h2>
      <div className="posts-list">
        {posts.length === 0 ? (
          <p>まだ投稿はありません。</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-item">
              <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="post-title">【{post.title}】</span>
                  <span className="post-name">投稿者: {post.name}</span>
                  <span className="post-date">投稿日: {post.timestamp}</span>
                  {isAdmin && <span className="post-ip" style={{ color: '#999', fontSize: '12px' }}> (IP: {post.ipAddress})</span>}
                </div>
                {(isAdmin || (post.deviceId === deviceId && post.ipAddress === ipAddress)) && (
                  <button 
                    onClick={() => handleDelete(post)} 
                    style={{ color: '#FF3333', background: 'none', border: '1px solid #FF3333', cursor: 'pointer', fontSize: '10px', padding: '2px 5px' }}
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="post-content">
                {post.content.split('\n').map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </div>
              <hr className="post-divider" />
            </div>
          ))
        )}
      </div>

      <hr style={{ margin: '40px 0' }} />

      <div className="form-container">
        <h3>投稿フォーム</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>名前: </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="名無しさん" />
          </div>
          <div className="form-group">
            <label>題名: </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="無題" />
          </div>
          <div className="form-group">
            <label>本文: </label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows="5" placeholder="メッセージを入力してください" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div className="form-submit" style={{ textAlign: 'right', marginTop: '10px' }}>
            <button type="submit">書き込む</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BBS;

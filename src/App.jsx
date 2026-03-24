import { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar.jsx';
import BBS from './components/BBS.jsx';
import Blog from './components/Blog.jsx';
import EtChat from './components/EtChat.jsx';
import AdminClaps from './components/AdminClaps.jsx';
import AdminIPBan from './components/AdminIPBan.jsx';
import Profile from './components/Profile.jsx';
import Links from './components/Links.jsx';
import Specs from './components/Specs.jsx';
import ClapDisplay from './components/ClapDisplay.jsx';
import { io } from 'socket.io-client';

const API_BASE = '/api';
const socket = io();

const HomePage = ({ isAdmin, setPage }) => {
  const [news, setNews] = useState(null);
  const [status, setStatus] = useState(null);
  const [newNews, setNewNews] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const fetchNews = () => fetch(`${API_BASE}/news?t=${Date.now()}`).then(res => res.json()).then(setNews);
  const fetchStatus = () => fetch(`${API_BASE}/status?t=${Date.now()}`).then(res => res.json()).then(setStatus);

  useEffect(() => {
    fetchNews();
    fetchStatus();

    socket.on('news_update', fetchNews);
    socket.on('status_update', fetchStatus);

    return () => {
      socket.off('news_update');
      socket.off('status_update');
    };
  }, []);

  const handleAddNews = (e) => {
    e.preventDefault();
    if (!newNews.trim()) return;
    const newItem = {
      date: new Date().toLocaleDateString('ja-JP'),
      body: newNews.trim()
    };
    fetch(`${API_BASE}/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    }).then(res => res.json()).then(data => {
      setNews([...(news || []), { id: data.id, ...newItem }]);
      setNewNews('');
    });
  };

  const handleAddStatus = (e) => {
    e.preventDefault();
    if (!newStatus.trim()) return;
    const newItem = {
      date: new Date().toLocaleDateString('ja-JP'),
      body: newStatus.trim()
    };
    fetch(`${API_BASE}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    }).then(res => res.json()).then(data => {
      setStatus([...(status || []), { id: data.id, ...newItem }]);
      setNewStatus('');
    });
  };

  const handleDeleteNews = (id) => {
    if (window.confirm('削除しますか？')) {
      fetch(`${API_BASE}/news/${id}`, { method: 'DELETE' });
    }
  };

  const handleDeleteStatus = (id) => {
    if (window.confirm('削除しますか？')) {
      fetch(`${API_BASE}/status/${id}`, { method: 'DELETE' });
    }
  };

  return (
    <>
      <p>管理人の空門チエです。ふと昔のサイトを再現してみたくて作ってみました。</p>
      <p>フロントエンドはレトロでバックエンドはモダンを意識して作成しました。</p>
      <p>以前HTMLとJSで作成しましたが読み込みで時間がかかってUXが悪いと感じたのでreactに移植してみました。</p>
      <p>ただし、SEOはあきらめてサイトの見た目とセキュリティを優先しました。詳しくは<a href="#" onClick={(e) => { e.preventDefault(); setPage('specs'); }}>サイトの仕様</a>を見てね！<br /></p>
      <p>みんな仲良くね！</p>
      <hr />
      
      <div id="news-section" className="news-section">
        <h3>◆ お知らせ・更新履歴</h3>
        <p>ここにサイトの更新履歴などを記載していきます</p>

        {isAdmin && (
          <div id="news-post-area" className="news-post-area">
            <p className="news-post-label">新規お知らせ投稿:</p>
            <textarea 
              className="news-textarea"
              value={newNews} 
              onChange={(e) => setNewNews(e.target.value)} 
              placeholder="新しいお知らせ..." 
            />
            <button className="mt-5" onClick={handleAddNews}>投稿</button>
          </div>
        )}

        <div id="news-list">
          {news === null ? (
            <p className="news-loading">読み込み中...</p>
          ) : news.length === 0 ? (
            <p className="news-loading">投稿がありません</p>
          ) : (
            news.map(item => (
              <div key={item.id} className="post">
                <div className="post_header">
                  {item.date}
                  {isAdmin && <button onClick={() => handleDeleteNews(item.id)} style={{ marginLeft: '10px', fontSize: '10px', color: 'red' }}>[削除]</button>}
                </div>
                <div className="post_body">{item.body}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div id="status-section" className="news-section">
        <h3>◆ 最近の近況</h3>

        {isAdmin && (
          <div id="status-post-area" className="news-post-area">
            <p className="news-post-label">新規近況投稿:</p>
            <textarea 
              className="news-textarea"
              value={newStatus} 
              onChange={(e) => setNewStatus(e.target.value)} 
              placeholder="近況を投稿..." 
            />
            <button className="mt-5" onClick={handleAddStatus}>投稿</button>
          </div>
        )}

        <div id="status-list">
          {status === null ? (
            <p className="news-loading">読み込み中...</p>
          ) : status.length === 0 ? (
            <p className="news-loading">投稿がありません</p>
          ) : (
            status.map(item => (
              <div key={item.id} className="post">
                <div className="post_header">
                  {item.date}
                  {isAdmin && <button onClick={() => handleDeleteStatus(item.id)} style={{ marginLeft: '10px', fontSize: '10px', color: 'red' }}>[削除]</button>}
                </div>
                <div className="post_body">{item.body}</div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <ClapDisplay />
    </>
  );
};

function App() {
  const [page, setPage] = useState("home");
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [userIp, setUserIp] = useState('');
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    localStorage.setItem('isAdmin', isAdmin);
  }, [isAdmin]);

  useEffect(() => {
    // ユーザーのIPを取得して制限チェック
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setUserIp(data.ip);
        const fetchBans = () => {
          fetch(`${API_BASE}/bans?t=${Date.now()}`)
            .then(res => res.json())
            .then(banList => {
              if (Array.isArray(banList) && banList.some(item => item.ip === data.ip)) {
                setIsBanned(true);
              } else {
                setIsBanned(false);
              }
            });
        };
        fetchBans();
        socket.on('bans_update', fetchBans);
        return () => socket.off('bans_update');
      })
      .catch(err => console.error('IP取得エラー:', err));
  }, []);

  const renderPage = () => {
    if (isBanned && !isAdmin) {
      return (
        <div style={{ textAlign: 'center', padding: '50px', color: '#FF0000', border: '2px solid #FF0000', background: '#000' }}>
          <h2>Access Denied</h2>
          <p>あなたのIPアドレス（{userIp}）からのアクセスは制限されています。</p>
          <p>心当たりがない場合は管理者に連絡してください。</p>
        </div>
      );
    }
    switch (page) {
      case 'home': return <HomePage isAdmin={isAdmin} setPage={setPage} />;
      case 'bbs': return <BBS isAdmin={isAdmin} />;
      case 'blog': return <Blog isAdmin={isAdmin} />;
      case 'etchat': return <EtChat />;
      case 'profile': return <Profile />;
      case 'links': return <Links isAdmin={isAdmin} />;
      case 'specs': return <Specs />;
      case 'admin_claps': return <AdminClaps isAdmin={isAdmin} />;
      case 'admin_ip_ban': return <AdminIPBan isAdmin={isAdmin} />;
      default: return <HomePage isAdmin={isAdmin} />;
    }
  };

  return (
    <div>
      <h1 className="title">Welcome to the Retro Site</h1>
      <hr />
      <div className="layout">
        <Sidebar setPage={setPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} userIp={userIp} />
        <div className="main_content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;

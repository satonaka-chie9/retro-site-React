import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_BASE = '/api';
const socket = io();

function Sidebar({ setPage, isAdmin, setIsAdmin, userIp }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  
  const [count, setCount] = useState(0);
  const [totalClaps, setTotalClaps] = useState(0);
  const [showClapModal, setShowClapModal] = useState(false);
  const [clapMessage, setClapMessage] = useState('');

  const fetchClaps = () => fetch(`${API_BASE}/claps?t=${Date.now()}`).then(res => res.json()).then(data => setTotalClaps(data.length));

  useEffect(() => {
    let deviceId = localStorage.getItem('retro-site-device-id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('retro-site-device-id', deviceId);
    }

    if (!userIp) return;

    const today = new Date().toISOString().slice(0, 10);
    fetch(`${API_BASE}/counter/increment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: userIp, deviceId: deviceId, date: today })
    }).then(res => res.json()).then(data => {
      setCount(data.count);
    });

    fetchClaps();

    socket.on('counter_update', (newCount) => setCount(newCount));
    socket.on('claps_update', fetchClaps);

    return () => {
      socket.off('counter_update');
      socket.off('claps_update');
    };
  }, [userIp]);

  const handleLogin = () => {
    const adminUser = import.meta.env.VITE_ADMIN_USER;
    const adminPass = import.meta.env.VITE_ADMIN_PASS;

    if (user === adminUser && pass === adminPass) {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      setMsg('');
      setUser('');
      setPass('');
    } else {
      setMsg('ユーザー名またはパスワードが違います');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.setItem('isAdmin', 'false');
  };

  const handleSendClap = (e) => {
    e.preventDefault();
    const newClap = {
      message: clapMessage,
      timestamp: new Date().toLocaleString('ja-JP')
    };
    fetch(`${API_BASE}/claps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClap)
    }).then(() => {
      setClapMessage('');
      setShowClapModal(false);
      alert('ありがとうございます！');
    });
  };

  return (
    <>
      <div className="side_menu">
        <a onClick={() => setPage('home')}>トップ</a>
        <a onClick={() => setPage('bbs')}>BBS</a>
        <a onClick={() => setPage('blog')}>日記</a>
        <a onClick={() => setPage('etchat')}>絵チャ</a>
        <a onClick={() => setPage('profile')}>PROFILE</a>
        <a onClick={() => setPage('links')}>リンク集</a>
        <a onClick={() => setPage('specs')}>サイト仕様</a>

        <p className="menu_title">アクセスカウンタ</p>
        <div className="counter" id="counter">
          <span>{count.toString().padStart(6, '0')}</span>
        </div>
        <p className="menu_title">キリ番はBBSまたは拍手にて報告ください</p>

        <p className="menu_title">管理者用</p>
        {!isAdmin ? (
          <div id="admin-login-area">
            <input
              type="text"
              placeholder="USER"
              className="admin-input"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            /><br />
            <input
              type="password"
              placeholder="PASS"
              className="admin-input"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            /><br />
            <button onClick={handleLogin}>LOGIN</button>
            <div className="admin-msg-small">{msg}</div>
          </div>
        ) : (
          <div id="admin-logout-area">
            <p className="admin-login-status">管理者ログイン中</p>
            <a href="#" className="admin-manage-link" onClick={(e) => { e.preventDefault(); setPage('admin_claps'); }}>拍手メッセージ管理</a><br />
            <a href="#" className="admin-manage-link" onClick={(e) => { e.preventDefault(); setPage('admin_ip_ban'); }}>IP制限管理</a><br />
            <button onClick={handleLogout}>LOGOUT</button>
          </div>
        )}

        <div className="clap-btn-container">
          <span className="clap-count-display">{totalClaps} 拍手</span>
          <button className="clap-btn" onClick={() => setShowClapModal(true)}>拍手</button>
        </div>
      </div>

      {showClapModal && (
        <div className="clap-overlay" onClick={() => setShowClapModal(false)}>
          <div className="clap-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Web拍手</h3>
            <p>管理人へメッセージを送れます（任意）</p>
            <form onSubmit={handleSendClap}>
              <textarea
                value={clapMessage}
                onChange={(e) => setClapMessage(e.target.value)}
                placeholder="メッセージを入力してください..."
                rows="4"
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: '10px' }}
              />
              <div style={{ textAlign: 'right' }}>
                <button type="button" onClick={() => setShowClapModal(false)} style={{ marginRight: '10px' }}>キャンセル</button>
                <button type="submit">送信する</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;

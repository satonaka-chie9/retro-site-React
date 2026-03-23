import { useState, useEffect, useRef } from 'react';

const API_BASE = '/api';

function Blog({ isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const fetchPosts = () => {
    fetch(`${API_BASE}/blog?t=${Date.now()}`)
      .then(res => res.json())
      .then(setPosts);
  };

  useEffect(() => {
    fetchPosts();
    // 30秒おきに日記を更新
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) { // 2MB limit
        alert('画像サイズは2MB以下にしてください。');
        e.target.value = '';
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('タイトルと本文を入力してください。');
      return;
    }

    const newPost = {
      title: title.trim(),
      content: content,
      image: imagePreview,
      timestamp: new Date().toLocaleString('ja-JP'),
    };

    fetch(`${API_BASE}/blog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost)
    })
      .then(res => res.json())
      .then(data => {
        // サーバーから 'blog_update' が飛んでくるので自動更新されますが、
        // 念のため local でも先頭に追加する形式にしておきます。
        setPosts([{ id: data.id, ...newPost }, ...posts]);
        setTitle('');
        setContent('');
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('この記事を削除してもよろしいですか？')) {
      fetch(`${API_BASE}/blog/${id}`, { method: 'DELETE' });
    }
  };

  return (
    <div className="diary-container">
      <h2>Diary (日記)</h2>

      {isAdmin && (
        <div className="form-container" style={{ marginBottom: '40px' }}>
          <h3>◆ 新規記事投稿 (管理者用)</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>タイトル: </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '80%' }}
              />
            </div>
            <div className="form-group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="10"
                placeholder="今日のできごとを書きましょう..."
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group">
              <label>画像添付: </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
              />
              {imagePreview && (
                <div style={{ marginTop: '10px' }}>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #ccc' }} />
                  <button type="button" onClick={() => { setImage(null); setImagePreview(null); fileInputRef.current.value = ''; }} style={{ marginLeft: '10px' }}>取消</button>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <button type="submit">投稿する</button>
            </div>
          </form>
        </div>
      )}

      <div className="diary-list">
        {posts.length === 0 ? (
          <p>まだ日記の投稿はありません。</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="diary-post">
              <div className="diary-header">
                <h3 className="diary-title">◆ {post.title}</h3>
                <span className="diary-date">{post.timestamp}</span>
              </div>
              <div className="diary-body">
                {post.image && (
                  <div className="diary-image" style={{ marginBottom: '15px', textAlign: 'center' }}>
                    <img src={post.image} alt={post.title} style={{ maxWidth: '100%', maxHeight: '400px', border: '2px solid #ddd' }} />
                  </div>
                )}
                <div className="diary-text">
                  {post.content.split('\n').map((line, i) => (
                    <span key={i}>{line}<br /></span>
                  ))}
                </div>
              </div>
              {isAdmin && (
                <div style={{ textAlign: 'right', marginTop: '5px' }}>
                  <button onClick={() => handleDelete(post.id)} style={{ color: '#FF0000', borderColor: '#FF0000' }}>
                    削除
                  </button>
                </div>
              )}
              <hr className="diary-divider" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Blog;

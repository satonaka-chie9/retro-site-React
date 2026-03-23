import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const port = process.env.PORT || 3001;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- 静的ファイルの配信設定 (Reactビルド済みファイル) ---
const distPath = join(__dirname, 'dist');
app.use(express.static(distPath));

// データベースは /data/retro.db に配置 (Fly.ioの永続ボリューム用)
// 開発環境ではカレントディレクトリ、本番では /data を使うように切り替え
const dbDir = process.env.NODE_ENV === 'production' ? '/data' : __dirname;
const dbPath = join(dbDir, 'retro.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB connection error:', err);
  else console.log('DB connected at:', dbPath);
});

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS news (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, body TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS status (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, body TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS bbs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, title TEXT, content TEXT, deviceId TEXT, ipAddress TEXT, timestamp TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS etchat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, text TEXT, time TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS claps (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, timestamp TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS bans (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, reason TEXT, date TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, count INTEGER)");
  db.run("INSERT OR IGNORE INTO counter (id, count) VALUES (1, 0)");
  db.run("CREATE TABLE IF NOT EXISTS access_log (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, deviceId TEXT, date TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, url TEXT, description TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS blog (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, image TEXT, timestamp TEXT)");
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// API エンドポイント (同期通知 io.emit を追加)
app.get('/api/news', (req, res) => db.all("SELECT * FROM news ORDER BY id ASC", (err, rows) => res.json(rows || [])));
app.post('/api/news', (req, res) => {
  db.run("INSERT INTO news (date, body) VALUES (?, ?)", [req.body.date, req.body.body], function(err) {
    res.json({ id: this.lastID }); io.emit('news_update');
  });
});

app.delete('/api/news/:id', (req, res) => {
  db.run("DELETE FROM news WHERE id = ?", [req.params.id], () => {
    res.json({ success: true }); io.emit('news_update');
  });
});

app.get('/api/status', (req, res) => db.all("SELECT * FROM status ORDER BY id ASC", (err, rows) => res.json(rows || [])));
app.post('/api/status', (req, res) => {
  db.run("INSERT INTO status (date, body) VALUES (?, ?)", [req.body.date, req.body.body], function(err) {
    res.json({ id: this.lastID }); io.emit('status_update');
  });
});

app.delete('/api/status/:id', (req, res) => {
  db.run("DELETE FROM status WHERE id = ?", [req.params.id], () => {
    res.json({ success: true }); io.emit('status_update');
  });
});

app.get('/api/bbs', (req, res) => db.all("SELECT * FROM bbs ORDER BY id ASC", (err, rows) => res.json(rows || [])));
app.post('/api/bbs', (req, res) => {
  const { name, title, content, deviceId, ipAddress, timestamp } = req.body;
  
  // 名前重複チェックと連番付与
  db.all("SELECT name FROM bbs WHERE name = ? OR name LIKE ? ORDER BY id ASC", [name, name + '.%'], (err, rows) => {
    let finalName = name;
    if (rows && rows.length > 0) {
      let maxNum = 0;
      rows.forEach(row => {
        if (row.name === name && maxNum === 0) {
          maxNum = 0; // ベースの名前が存在することを確認
        }
        const parts = row.name.split('.');
        if (parts.length > 1) {
          const suffix = parseInt(parts[parts.length - 1]);
          if (!isNaN(suffix) && suffix > maxNum) {
            maxNum = suffix;
          }
        }
      });
      // 最初の重複なら .1、次からは .2, .3...
      finalName = `${name}.${maxNum + 1}`;
    }

    db.run("INSERT INTO bbs (name, title, content, deviceId, ipAddress, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      [finalName, title, content, deviceId, ipAddress, timestamp], function(err) {
        if (err) return res.status(500).json(err);
        res.json({ id: this.lastID, name: finalName }); io.emit('bbs_update');
      });
  });
});

app.delete('/api/bbs/:id', (req, res) => {
  db.run("DELETE FROM bbs WHERE id = ?", [req.params.id], () => {
    res.json({ success: true }); io.emit('bbs_update');
  });
});

app.get('/api/blog', (req, res) => db.all("SELECT * FROM blog ORDER BY id DESC", (err, rows) => res.json(rows || [])));
app.post('/api/blog', (req, res) => {
  const { title, content, image, timestamp } = req.body;
  db.run("INSERT INTO blog (title, content, image, timestamp) VALUES (?, ?, ?, ?)", [title, content, image, timestamp], function(err) {
    res.json({ id: this.lastID }); io.emit('blog_update');
  });
});

app.delete('/api/blog/:id', (req, res) => {
  db.run("DELETE FROM blog WHERE id = ?", [req.params.id], () => {
    res.json({ success: true }); io.emit('blog_update');
  });
});

app.get('/api/etchat', (req, res) => db.all("SELECT * FROM etchat_messages ORDER BY id DESC LIMIT 50", (err, rows) => res.json((rows || []).reverse())));
app.post('/api/etchat', (req, res) => {
  db.run("INSERT INTO etchat_messages (name, text, time) VALUES (?, ?, ?)", [req.body.name, req.body.text, req.body.time], function(err) {
    res.json({ id: this.lastID }); io.emit('etchat_update');
  });
});

app.get('/api/counter', (req, res) => db.get("SELECT count FROM counter WHERE id = 1", (err, row) => res.json(row || { count: 0 })));
app.post('/api/counter/increment', (req, res) => {
  const { ip, deviceId, date } = req.body;
  // ip, deviceId, date (YYYY-MM-DD) が一致するログがあるかチェック
  db.get("SELECT 1 FROM access_log WHERE ip = ? AND deviceId = ? AND date = ?", [ip, deviceId, date], (err, existing) => {
    if (existing) {
      // 既に今日カウント済みの場合は現在のカウントを返すだけ
      db.get("SELECT count FROM counter WHERE id = 1", (err, row) => {
        res.json({ counted: false, count: row.count });
      });
    } else {
      // 未カウントの場合はログを記録してインクリメント
      db.run("UPDATE counter SET count = count + 1 WHERE id = 1", () => {
        db.run("INSERT INTO access_log (ip, deviceId, date) VALUES (?, ?, ?)", [ip, deviceId, date], () => {
          db.get("SELECT count FROM counter WHERE id = 1", (err, row) => {
            res.json({ counted: true, count: row.count });
            io.emit('counter_update', row.count);
          });
        });
      });
    }
  });
});

// その他省略せずに記述して確実に接続
app.get('/api/claps', (req, res) => db.all("SELECT * FROM claps ORDER BY id ASC", (err, rows) => res.json(rows || [])));
app.post('/api/claps', (req, res) => {
  db.run("INSERT INTO claps (message, timestamp) VALUES (?, ?)", [req.body.message, req.body.timestamp], function() {
    res.json({id: this.lastID}); io.emit('claps_update');
  });
});

app.delete('/api/claps/:id', (req, res) => {
  db.run("DELETE FROM claps WHERE id = ?", [req.params.id], () => {
    res.json({ success: true }); io.emit('claps_update');
  });
});

// すべてのリクエストを index.html に流す (SPA用)
app.get(/.*/, (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

httpServer.listen(port, '0.0.0.0', () => console.log(`Backend running on port ${port}`));

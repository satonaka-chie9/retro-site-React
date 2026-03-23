# Retro Site React

レトロな雰囲気のウェブサイトを React と Express で構築したプロジェクトです。BBS、ブログ、チャット、アクセスカウンターなどの機能を備えています。

https://retro-site-react.fly.dev/

## 特徴

- **レトロデザイン**: 90年代後半から2000年代初頭の個人サイトを彷彿とさせるデザイン
- **BBS (掲示板)**: 名前重複チェックや連番付与機能を備えた掲示板
- **Blog**: 画像投稿に対応したブログシステム
- **EtChat**: Socket.io を利用したリアルタイムチャット
- **アクセスカウンター**: 重複カウント防止機能を備えた訪問者数表示
- **拍手 (Claps)**: メッセージ付きの拍手機能
- **管理機能**: ニュース、ステータス、リンクの管理

## 技術スタック

- **Frontend**: React 19, Vite 8
- **Backend**: Express 5, Node.js 22/24
- **Database**: SQLite3
- **Real-time**: Socket.io
- **Deployment**: Fly.io, Docker

## 開発環境のセットアップ

### ローカル実行

1. 依存関係のインストール:
   ```bash
   npm install
   ```

2. フロントエンドの起動 (Vite):
   ```bash
   npm run dev
   ```

3. バックエンドの起動:
   ```bash
   node server.js
   ```

### Docker Compose での実行

フロントエンド（Nginx）とバックエンド（Node.js）を分離して実行します。

```bash
npm run docker:up
```

## デプロイ (Fly.io)

このプロジェクトは Fly.io へのデプロイに最適化されています。`Dockerfile.production` を使用して、SPA の配信と API サーバーを一つのコンテナで実行します。

```bash
fly deploy
```

## 注意事項

- **Express 5 対応**: ルーティングに `path-to-regexp` v8 が使用されているため、ワイルドカードには正規表現 `/.*/` を使用しています。
- **データ永続化**: Fly.io では `/data` ディレクトリをボリュームとしてマウントし、`retro.db` をそこに配置するように設定されています。

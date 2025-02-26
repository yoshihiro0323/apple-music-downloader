# Apple Music Downloader

Apple Music URLからアルバム、曲、プレイリスト情報を取得するNode.jsライブラリです。

## 機能

- Apple Music URLの解析（アルバム、曲、プレイリスト、アーティスト）
- アルバム情報の取得
- 曲情報の取得
- プレイリスト情報の取得
- アーティスト情報の取得
- トラックリストの取得

## インストール

```bash
npm install apple-music-downloader
```

## 使い方

### 基本的な使い方

```javascript
const appleMusicDownloader = require('apple-music-downloader');

// URLを解析
const urlInfo = appleMusicDownloader.parseUrl('https://music.apple.com/jp/album/1234567890');
console.log(urlInfo);
// { type: 'album', storefront: 'jp', id: '1234567890', url: 'https://music.apple.com/jp/album/1234567890' }

// トークンを取得
const token = await appleMusicDownloader.getToken();

// URLからコンテンツ情報を取得
const contentInfo = await appleMusicDownloader.getContentInfo('https://music.apple.com/jp/album/1234567890');
console.log(contentInfo);

// URLからトラックリストを取得
const trackList = await appleMusicDownloader.getTrackList('https://music.apple.com/jp/album/1234567890');
console.log(trackList);
```

### クラスを使った詳細な操作

```javascript
const { AppleMusicDownloader } = require('apple-music-downloader');

// 設定を指定してインスタンスを作成
const downloader = new AppleMusicDownloader({
  mediaUserToken: 'your-media-user-token', // オプション
  authorizationToken: 'your-authorization-token', // オプション（自動取得される）
  language: 'ja',
  embedCover: true,
  coverSize: '5000x5000',
  coverFormat: 'jpg',
  outputDir: 'output',
  alacMax: 192000,
  atmosMax: 2768,
  aacType: 'aac-lc'
});

// 初期化
await downloader.init();

// アルバム情報を取得
const albumInfo = await downloader.getAlbumInfo('1234567890', 'jp');
console.log(albumInfo);

// 曲情報を取得
const songInfo = await downloader.getSongInfo('1234567890', 'jp');
console.log(songInfo);

// プレイリスト情報を取得
const playlistInfo = await downloader.getPlaylistInfo('pl.1234567890', 'jp');
console.log(playlistInfo);

// アーティスト情報を取得
const artistInfo = await downloader.getArtistInfo('1234567890', 'jp');
console.log(artistInfo);

// URLからトラックリストを取得
const trackList = await downloader.getTrackList('https://music.apple.com/jp/album/1234567890');
console.log(trackList);
```

## 注意事項

- このライブラリは、Apple Musicの公式APIではなく、Webサイトの解析に基づいています。
- Apple Musicの仕様変更により、動作しなくなる可能性があります。
- 実際のダウンロード機能は外部ツールに依存するため、このライブラリでは実装されていません。

## ライセンス

MIT 
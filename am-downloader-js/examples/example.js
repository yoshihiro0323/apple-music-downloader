const appleMusicDownloader = require('../src/index');

// 使用例を実行する関数
async function runExamples() {
  try {
    console.log('Apple Music Downloader の使用例');
    console.log('==============================');
    
    // 1. URLの解析
    const url = 'https://music.apple.com/us/album/the-beautiful-game/1160118965';
    console.log(`\n1. URLの解析: ${url}`);
    const urlInfo = appleMusicDownloader.parseUrl(url);
    console.log(urlInfo);
    
    // 2. トークンの取得
    console.log('\n2. トークンの取得');
    const token = await appleMusicDownloader.getToken();
    console.log(`トークン: ${token.substring(0, 20)}...`);
    
    // 3. アルバム情報の取得
    console.log(`\n3. アルバム情報の取得: ${url}`);
    try {
      const albumInfo = await appleMusicDownloader.getContentInfo(url);
      console.log(`アルバム名: ${albumInfo.name}`);
      console.log(`アーティスト: ${albumInfo.artistName}`);
      console.log(`リリース日: ${albumInfo.releaseDate}`);
      if (albumInfo.tracks && albumInfo.tracks.length) {
        console.log(`トラック数: ${albumInfo.tracks.length}`);
      } else {
        console.log('トラック情報が取得できませんでした');
      }
      console.log(albumInfo.tracks);
    } catch (error) {
      console.error(`アルバム情報の取得に失敗しました: ${error.message}`);
    }
    
    // 4. トラックリストの取得
    console.log(`\n4. トラックリストの取得: ${url}`);
    try {
      const tracks = await appleMusicDownloader.getTrackList(url);
      if (tracks && tracks.length) {
        console.log(`トラック数: ${tracks.length}`);
        console.log('最初の3曲:');
        tracks.slice(0, 3).forEach((track, index) => {
          console.log(`${index + 1}. ${track.name} - ${track.artistName}`);
        });
      } else {
        console.log('トラック情報が取得できませんでした');
      }
    } catch (error) {
      console.error(`トラックリストの取得に失敗しました: ${error.message}`);
    }
    
    // 5. 曲のURLの解析
    const songUrl = 'https://music.apple.com/us/album/nurse-and-singer/1537521190?i=1537521192';
    console.log(`\n5. 曲のURLの解析: ${songUrl}`);
    const songUrlInfo = appleMusicDownloader.parseUrl(songUrl);
    console.log(songUrlInfo);
    
    // 6. 曲の情報取得
    console.log(`\n6. 曲の情報取得: ${songUrl}`);
    try {
      const songInfo = await appleMusicDownloader.getContentInfo(songUrl);
      console.log(`曲名: ${songInfo.name}`);
      console.log(`アーティスト: ${songInfo.artistName}`);
      console.log(`アルバム: ${songInfo.albumName}`);
    } catch (error) {
      console.error(`曲情報の取得に失敗しました: ${error.message}`);
    }
    
    // 7. プレイリストのURLの解析
    const playlistUrl = 'https://music.apple.com/us/playlist/franz-joseph-haydn-undiscovered/pl.9f6046d9311c4586bfec7161b8f3dcc5';
    console.log(`\n7. プレイリストのURLの解析: ${playlistUrl}`);
    const playlistUrlInfo = appleMusicDownloader.parseUrl(playlistUrl);
    console.log(playlistUrlInfo);
    
    // 8. プレイリストの情報取得
    console.log(`\n8. プレイリストの情報取得: ${playlistUrl}`);
    const playlistInfo = await appleMusicDownloader.getContentInfo(playlistUrl);
    console.log(`プレイリスト名: ${playlistInfo.name}`);
    console.log(`キュレーター: ${playlistInfo.curatorName}`);
    console.log(`トラック数: ${playlistInfo.tracks.length}`);
    playlistInfo.tracks.forEach(track => {
      console.log(`${track.index} - ${track.name}`);
    });
    
    // 9. アーティストのURLの解析
    const artistUrl = 'https://music.apple.com/us/artist/vulfpeck/449917675';
    console.log(`\n9. アーティストのURLの解析: ${artistUrl}`);
    const artistUrlInfo = appleMusicDownloader.parseUrl(artistUrl);
    console.log(artistUrlInfo);
    
    // 10. アーティストの情報取得
    console.log(`\n10. アーティストの情報取得: ${artistUrl}`);
    const artistInfo = await appleMusicDownloader.getContentInfo(artistUrl);
    console.log(`アーティスト名: ${artistInfo.name}`);
    console.log(`アルバム数: ${artistInfo.albums.length}`);
    console.log('最初の3アルバム:');
    artistInfo.albums.forEach((album, index) => {
      console.log(`${index + 1}. ${album.name} (${album.releaseDate})`);
    });
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 例を実行
runExamples(); 
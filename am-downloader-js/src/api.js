const utils = require('./utils');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

/**
 * デフォルト設定
 */
const defaultConfig = {
  mediaUserToken: '',
  authorizationToken: '',
  language: '',
  embedCover: true,
  coverSize: '5000x5000',
  coverFormat: 'jpg',
  outputDir: 'output',
  alacMax: 192000,
  atmosMax: 2768,
  aacType: 'aac-lc'
};

/**
 * Apple Music Downloader API
 */
class AppleMusicDownloader {
  /**
   * コンストラクタ
   * @param {Object} config - 設定
   */
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.token = this.config.authorizationToken;
  }

  /**
   * 初期化
   * @returns {Promise<void>}
   */
  async init() {
    if (!this.token) {
      this.token = await utils.getToken();
    }
    
    // 出力ディレクトリの作成
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * URLを解析して情報を取得します
   * @param {string} url - Apple MusicのURL
   * @returns {Promise<Object>} URL情報
   */
  parseUrl(url) {
    return utils.parseAppleMusicUrl(url);
  }

  /**
   * URLからコンテンツ情報を取得します
   * @param {string} url - Apple MusicのURL
   * @returns {Promise<Object>} コンテンツ情報
   */
  async getContentInfo(url) {
    if (!this.token) {
      await this.init();
    }
    
    const urlInfo = this.parseUrl(url);
    
    if (!urlInfo) {
      throw new Error('Invalid Apple Music URL');
    }
    
    // URLからクエリパラメータを抽出
    const urlObj = new URL(url);
    const songId = urlObj.searchParams.get('i');
    
    // アルバムURLだが、クエリパラメータに曲IDが含まれている場合
    if (urlInfo.type === 'album' && songId) {
      try {
        // 曲情報を直接取得
        return await this.getSongInfo(songId, urlInfo.storefront);
      } catch (error) {
        console.error(`Error getting song info from album URL: ${error.message}`);
        // 失敗した場合はアルバム情報を取得する処理に進む
      }
    }
    
    switch (urlInfo.type) {
      case 'album':
        return await this.getAlbumInfo(urlInfo.id, urlInfo.storefront);
      case 'playlist':
        return await this.getPlaylistInfo(urlInfo.id, urlInfo.storefront);
      case 'song':
        return await this.getSongInfo(urlInfo.id, urlInfo.storefront);
      case 'artist':
        return await this.getArtistInfo(urlInfo.id, urlInfo.storefront);
      default:
        throw new Error('Unsupported content type');
    }
  }

  /**
   * アルバム情報を取得します
   * @param {string} albumId - アルバムID
   * @param {string} storefront - ストアフロント
   * @returns {Promise<Object>} アルバム情報
   */
  async getAlbumInfo(albumId, storefront) {
    const albumData = await utils.getAlbumInfo(albumId, this.token, storefront);
    
    const tracks = albumData.relationships.tracks.data.map(track => ({
      id: track.id,
      name: track.attributes.name,
      artistName: track.attributes.artistName,
      albumName: track.attributes.albumName || albumData.attributes.name,
      trackNumber: track.attributes.trackNumber,
      discNumber: track.attributes.discNumber,
      releaseDate: track.attributes.releaseDate,
      contentRating: track.attributes.contentRating,
      isrc: track.attributes.isrc,
      url: track.attributes.url,
      coverUrl: track.attributes.artwork.url.replace('{w}x{h}', this.config.coverSize)
    }));
    
    return {
      id: albumData.id,
      name: albumData.attributes.name,
      artistName: albumData.attributes.artistName,
      releaseDate: albumData.attributes.releaseDate,
      contentRating: albumData.attributes.contentRating,
      upc: albumData.attributes.upc,
      copyright: albumData.attributes.copyright,
      recordLabel: albumData.attributes.recordLabel,
      coverUrl: albumData.attributes.artwork.url.replace('{w}x{h}', this.config.coverSize),
      tracks
    };
  }

  /**
   * 曲情報を取得します
   * @param {string} songId - 曲ID
   * @param {string} storefront - ストアフロント
   * @returns {Promise<Object>} 曲情報
   */
  async getSongInfo(songId, storefront) {
    try {
      const songData = await utils.getSongManifest(songId, this.token, storefront);
      
      if (!songData.relationships || !songData.relationships.albums || !songData.relationships.albums.data || songData.relationships.albums.data.length === 0) {
        throw new Error('No album relationship found');
      }
      
      const albumId = songData.relationships.albums.data[0].id;
      const albumUrl = `https://music.apple.com/${storefront}/album/${albumId}`;
      
      return {
        id: songData.id,
        name: songData.attributes.name,
        artistName: songData.attributes.artistName,
        albumName: songData.attributes.albumName,
        albumId,
        albumUrl,
        trackNumber: songData.attributes.trackNumber,
        discNumber: songData.attributes.discNumber,
        releaseDate: songData.attributes.releaseDate,
        contentRating: songData.attributes.contentRating,
        isrc: songData.attributes.isrc,
        coverUrl: songData.attributes.artwork ? songData.attributes.artwork.url.replace('{w}x{h}', this.config.coverSize) : null,
        manifestUrl: songData.attributes.extendedAssetUrls ? songData.attributes.extendedAssetUrls.enhancedHls : null
      };
    } catch (error) {
      // 曲情報の取得に失敗した場合、アルバムURLを取得して、そのアルバム情報から曲情報を探す
      try {
        const albumUrl = await utils.getSongAlbumUrl(songId, this.token, storefront);
        if (!albumUrl) {
          throw new Error('Failed to get album URL for song');
        }
        
        const urlInfo = this.parseUrl(albumUrl);
        if (!urlInfo || urlInfo.type !== 'album') {
          throw new Error('Invalid album URL');
        }
        
        const albumInfo = await this.getAlbumInfo(urlInfo.id, urlInfo.storefront);
        const songInfo = albumInfo.tracks.find(track => track.id === songId);
        
        if (!songInfo) {
          throw new Error('Song not found in album');
        }
        
        return {
          ...songInfo,
          albumId: urlInfo.id,
          albumUrl
        };
      } catch (albumError) {
        console.error('Error getting song info via album:', albumError);
        throw error; // 元のエラーをスロー
      }
    }
  }

  /**
   * プレイリスト情報を取得します
   * @param {string} playlistId - プレイリストID
   * @param {string} storefront - ストアフロント
   * @returns {Promise<Object>} プレイリスト情報
   */
  async getPlaylistInfo(playlistId, storefront) {
    const playlistData = await utils.getAlbumInfo(playlistId, this.token, storefront);
    
    const tracks = playlistData.relationships.tracks.data.map(track => ({
      id: track.id,
      name: track.attributes.name,
      artistName: track.attributes.artistName,
      albumName: track.attributes.albumName,
      trackNumber: track.attributes.trackNumber,
      discNumber: track.attributes.discNumber,
      releaseDate: track.attributes.releaseDate,
      contentRating: track.attributes.contentRating,
      isrc: track.attributes.isrc,
      url: track.attributes.url,
      coverUrl: track.attributes.artwork.url.replace('{w}x{h}', this.config.coverSize)
    }));
    
    return {
      id: playlistData.id,
      name: playlistData.attributes.name,
      curatorName: playlistData.attributes.curatorName || playlistData.attributes.artistName,
      description: playlistData.attributes.description ? playlistData.attributes.description.standard : '',
      coverUrl: playlistData.attributes.artwork.url.replace('{w}x{h}', this.config.coverSize),
      tracks
    };
  }

  /**
   * アーティスト情報を取得します
   * @param {string} artistId - アーティストID
   * @param {string} storefront - ストアフロント
   * @returns {Promise<Object>} アーティスト情報
   */
  async getArtistInfo(artistId, storefront) {
    const artistData = await utils.getArtistInfo(artistId, this.token, storefront);
    const albums = await utils.getArtistAlbums(artistId, this.token, storefront);
    
    const albumInfos = albums.map(album => ({
      id: album.id,
      name: album.attributes.name,
      artistName: album.attributes.artistName,
      releaseDate: album.attributes.releaseDate,
      contentRating: album.attributes.contentRating,
      coverUrl: album.attributes.artwork.url.replace('{w}x{h}', this.config.coverSize),
      url: album.attributes.url
    }));
    
    return {
      id: artistData.id,
      name: artistData.attributes.name,
      coverUrl: artistData.attributes.artwork ? artistData.attributes.artwork.url.replace('{w}x{h}', this.config.coverSize) : null,
      albums: albumInfos
    };
  }

  /**
   * URLからトラックリストを取得します
   * @param {string} url - Apple MusicのURL
   * @returns {Promise<Array>} トラックリスト
   */
  async getTrackList(url) {
    const contentInfo = await this.getContentInfo(url);
    
    switch (this.parseUrl(url).type) {
      case 'album':
      case 'playlist':
        return contentInfo.tracks;
      case 'song':
        const albumInfo = await this.getAlbumInfo(contentInfo.albumId, this.parseUrl(url).storefront);
        return albumInfo.tracks.filter(track => track.id === contentInfo.id);
      case 'artist':
        // アーティストの場合は、すべてのアルバムのURLを返す
        return contentInfo.albums.map(album => album.url);
      default:
        throw new Error('Unsupported content type');
    }
  }

  /**
   * 曲をダウンロードします
   * @param {string} songId - 曲ID
   * @param {string} storefront - ストアフロント
   * @param {string} outputPath - 出力パス
   * @returns {Promise<string>} ダウンロードされたファイルのパス
   */
  async downloadSong(songId, storefront, outputPath = null) {
    if (!this.token) {
      await this.init();
    }
    
    const songInfo = await this.getSongInfo(songId, storefront);
    
    if (!songInfo.manifestUrl) {
      throw new Error('No manifest URL found for song');
    }
    
    // マニフェストからメディア情報を抽出
    const mediaInfo = await utils.extractMedia(songInfo.manifestUrl, false, {
      alacMax: this.config.alacMax,
      atmosMax: this.config.atmosMax,
      aacType: this.config.aacType,
      dl_atmos: false,
      dl_aac: false
    });
    
    // 出力パスの設定
    const fileName = `${songInfo.name}.m4a`;
    const sanitizedFileName = fileName.replace(/[/\\<>:"|?*]/g, '_');
    const finalOutputPath = outputPath || path.join(this.config.outputDir, sanitizedFileName);
    
    // ここでは実際のダウンロード処理は実装せず、情報のみを返す
    // 実際のダウンロードには外部ツールが必要
    
    return {
      songInfo,
      mediaInfo,
      outputPath: finalOutputPath,
      message: 'ダウンロード機能は外部ツールに依存するため、このライブラリでは実装されていません。'
    };
  }

  /**
   * URLから曲をダウンロードします
   * @param {string} url - Apple MusicのURL
   * @param {string} outputPath - 出力パス
   * @returns {Promise<string>} ダウンロードされたファイルのパス
   */
  async downloadFromUrl(url, outputPath = null) {
    const urlInfo = this.parseUrl(url);
    
    if (!urlInfo) {
      throw new Error('Invalid Apple Music URL');
    }
    
    if (urlInfo.type === 'song') {
      return this.downloadSong(urlInfo.id, urlInfo.storefront, outputPath);
    } else {
      // 曲以外の場合は、トラックリストを取得して最初の曲をダウンロード
      const tracks = await this.getTrackList(url);
      
      if (tracks.length === 0) {
        throw new Error('No tracks found');
      }
      
      if (urlInfo.type === 'artist') {
        return {
          message: 'アーティストURLからは直接ダウンロードできません。アルバムURLのリストを返します。',
          albumUrls: tracks
        };
      }
      
      return this.downloadSong(tracks[0].id, urlInfo.storefront, outputPath);
    }
  }
}

module.exports = AppleMusicDownloader; 
const axios = require('axios');
const { URL } = require('url');
const { Parser } = require('m3u8-parser');

/**
 * Apple MusicのURLからストアフロントとIDを抽出します
 * @param {string} url - Apple MusicのURL
 * @returns {Object|null} ストアフロントとID、タイプを含むオブジェクト、または無効なURLの場合はnull
 */
function parseAppleMusicUrl(url) {
  // アルバム内の曲URLのパターン（?i=パラメータを含むURL）
  const albumSongPattern = /^(?:https:\/\/(?:beta\.music|music)\.apple\.com\/(\w{2})\/album\/[^\/]+\/[^?]+)\?i=(\d+)/;
  const albumSongMatch = url.match(albumSongPattern);
  
  if (albumSongMatch) {
    return {
      type: 'song',
      storefront: albumSongMatch[1],
      id: albumSongMatch[2],
      url
    };
  }

  // アルバムURLのパターン
  const albumPattern = /^(?:https:\/\/(?:beta\.music|music)\.apple\.com\/(\w{2})(?:\/album|\/album\/.+))\/(?:id)?(\d[^\D]+)(?:$|\?)/;
  const albumMatch = url.match(albumPattern);
  
  if (albumMatch) {
    return {
      type: 'album',
      storefront: albumMatch[1],
      id: albumMatch[2],
      url
    };
  }
  
  // 曲URLのパターン
  const songPattern = /^(?:https:\/\/(?:beta\.music|music)\.apple\.com\/(\w{2})(?:\/song|\/song\/.+))\/(?:id)?(\d[^\D]+)(?:$|\?)/;
  const songMatch = url.match(songPattern);
  
  if (songMatch) {
    return {
      type: 'song',
      storefront: songMatch[1],
      id: songMatch[2],
      url
    };
  }
  
  // プレイリストURLのパターン
  const playlistPattern = /^(?:https:\/\/(?:beta\.music|music)\.apple\.com\/(\w{2})(?:\/playlist|\/playlist\/.+))\/(?:id)?(pl\.[\w-]+)(?:$|\?)/;
  const playlistMatch = url.match(playlistPattern);
  
  if (playlistMatch) {
    return {
      type: 'playlist',
      storefront: playlistMatch[1],
      id: playlistMatch[2],
      url
    };
  }
  
  // アーティストURLのパターン
  const artistPattern = /^(?:https:\/\/(?:beta\.music|music)\.apple\.com\/(\w{2})(?:\/artist|\/artist\/.+))\/(?:id)?(\d[^\D]+)(?:$|\?)/;
  const artistMatch = url.match(artistPattern);
  
  if (artistMatch) {
    return {
      type: 'artist',
      storefront: artistMatch[1],
      id: artistMatch[2],
      url
    };
  }
  
  return null;
}

/**
 * Apple Musicの認証トークンを取得します
 * @returns {Promise<string>} 認証トークン
 */
async function getToken() {
  try {
    // Apple Musicのウェブサイトにアクセス
    const response = await axios.get('https://beta.music.apple.com');
    const html = response.data;
    
    // JavaScriptアセットのURLを抽出
    const indexJsUriMatch = html.match(/\/assets\/index-legacy-[^/]+\.js/);
    if (!indexJsUriMatch) {
      throw new Error('Failed to find index.js URI');
    }
    
    const indexJsUri = indexJsUriMatch[0];
    
    // JavaScriptアセットを取得
    const jsResponse = await axios.get(`https://beta.music.apple.com${indexJsUri}`);
    const jsContent = jsResponse.data;
    
    // トークンを抽出
    const tokenMatch = jsContent.match(/eyJh([^"]*)/);
    if (!tokenMatch) {
      throw new Error('Failed to extract token');
    }
    
    return tokenMatch[0];
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
}

/**
 * M3U8マニフェストからメディア情報を抽出します
 * @param {string} manifestUrl - マニフェストURL
 * @param {boolean} infoOnly - 情報のみを取得するかどうか
 * @param {Object} config - 設定
 * @returns {Promise<Object>} メディア情報
 */
async function extractMedia(manifestUrl, infoOnly = false, config = {}) {
  try {
    const response = await axios.get(manifestUrl);
    const manifestString = response.data;
    
    const parser = new Parser();
    parser.push(manifestString);
    parser.end();
    
    const manifest = parser.manifest;
    
    if (!manifest.playlists || manifest.playlists.length === 0) {
      throw new Error('No playlists found in manifest');
    }
    
    // 利用可能なすべてのバリアントを取得
    const variants = manifest.playlists.map(playlist => {
      const attributes = playlist.attributes || {};
      return {
        uri: playlist.uri,
        bandwidth: playlist.bandwidth,
        averageBandwidth: playlist.averageBandwidth,
        codecs: attributes.CODECS,
        audio: attributes.AUDIO,
        resolution: attributes.RESOLUTION,
        frameRate: attributes.FRAME_RATE
      };
    });
    
    // バンド幅で降順にソート
    variants.sort((a, b) => b.averageBandwidth - a.averageBandwidth);
    
    // 情報のみを返す場合
    if (infoOnly) {
      return {
        variants,
        hasAAC: variants.some(v => v.codecs === 'mp4a.40.2'),
        hasLossless: variants.some(v => v.codecs === 'alac' && v.audio && v.audio.includes('-48000-')),
        hasHiRes: variants.some(v => v.codecs === 'alac' && v.audio && parseInt(v.audio.split('-')[v.audio.split('-').length - 2]) > 48000),
        hasAtmos: variants.some(v => v.codecs === 'ec-3' && v.audio && v.audio.includes('atmos')),
        hasDolbyAudio: variants.some(v => v.codecs === 'ac-3')
      };
    }
    
    // 設定に基づいて適切なバリアントを選択
    let selectedVariant = null;
    const alacMax = config.alacMax || 192000;
    const atmosMax = config.atmosMax || 2768;
    const aacType = config.aacType || 'aac-lc';
    const dl_atmos = config.dl_atmos || false;
    const dl_aac = config.dl_aac || false;
    
    if (dl_atmos) {
      // Atmosバリアントを探す
      for (const variant of variants) {
        if (variant.codecs === 'ec-3' && variant.audio && variant.audio.includes('atmos')) {
          const split = variant.audio.split('-');
          const length = split.length;
          const bitrateStr = split[length - 1];
          const bitrate = parseInt(bitrateStr.startsWith('2') ? bitrateStr.substring(1) : bitrateStr);
          
          if (bitrate <= atmosMax) {
            selectedVariant = variant;
            break;
          }
        } else if (variant.codecs === 'ac-3') {
          // Dolby Audioのフォールバック
          selectedVariant = variant;
          break;
        }
      }
    } else if (dl_aac) {
      // AACバリアントを探す
      for (const variant of variants) {
        if (variant.codecs === 'mp4a.40.2') {
          const aacRegex = /audio-stereo-\d+/;
          const replaced = variant.audio.replace(aacRegex, 'aac');
          
          if (replaced === aacType) {
            selectedVariant = variant;
            break;
          }
        }
      }
    } else {
      // ALACバリアントを探す
      for (const variant of variants) {
        if (variant.codecs === 'alac') {
          const split = variant.audio.split('-');
          const length = split.length;
          const sampleRate = parseInt(split[length - 2]);
          
          if (sampleRate <= alacMax) {
            selectedVariant = variant;
            break;
          }
        }
      }
    }
    
    if (!selectedVariant) {
      throw new Error('No suitable variant found');
    }
    
    // 選択されたバリアントのURLを解決
    const baseUrl = new URL(manifestUrl);
    const streamUrl = new URL(selectedVariant.uri, baseUrl).toString();
    
    // 品質情報を抽出
    let quality = '';
    if (selectedVariant.codecs === 'alac') {
      const split = selectedVariant.audio.split('-');
      const length = split.length;
      const bitDepth = split[length - 1];
      const sampleRate = parseInt(split[length - 2]);
      const khz = sampleRate / 1000;
      quality = `${bitDepth}B-${khz.toFixed(1)}kHz`;
    } else if (selectedVariant.codecs === 'ec-3' || selectedVariant.codecs === 'ac-3') {
      const split = selectedVariant.audio.split('-');
      quality = `${split[split.length - 1]} kbps`;
    } else if (selectedVariant.codecs === 'mp4a.40.2') {
      const split = selectedVariant.audio.split('-');
      quality = `${split[2]} kbps`;
    }
    
    return {
      streamUrl,
      quality,
      variant: selectedVariant
    };
  } catch (error) {
    console.error('Error extracting media:', error);
    throw error;
  }
}

/**
 * 曲のマニフェスト情報を取得します
 * @param {string} songId - 曲ID
 * @param {string} token - 認証トークン
 * @param {string} storefront - ストアフロント
 * @returns {Promise<Object>} マニフェスト情報
 */
async function getSongManifest(songId, token, storefront) {
  try {
    const url = `https://amp-api.music.apple.com/v1/catalog/${storefront}/songs/${songId}`;
    
    const response = await axios.get(url, {
      params: {
        extend: 'extendedAssetUrls',
        include: 'albums',
        l: ''
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'iTunes/12.11.3 (Windows; Microsoft Windows 10 x64 Professional Edition (Build 19041); x64) AppleWebKit/7611.1022.4001.1 (dt:2)',
        'Origin': 'https://music.apple.com'
      }
    });
    
    const data = response.data;
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No song data found');
    }
    
    const songData = data.data.find(d => d.id === songId) || data.data[0];
    
    return songData;
  } catch (error) {
    console.error('Error getting song manifest:', error);
    throw error;
  }
}

/**
 * アルバム情報を取得します
 * @param {string} albumId - アルバムID
 * @param {string} token - 認証トークン
 * @param {string} storefront - ストアフロント
 * @returns {Promise<Object>} アルバム情報
 */
async function getAlbumInfo(albumId, token, storefront) {
  try {
    const isPlaylist = albumId.includes('pl.');
    const type = isPlaylist ? 'playlists' : 'albums';
    
    const url = `https://amp-api.music.apple.com/v1/catalog/${storefront}/${type}/${albumId}`;
    
    const response = await axios.get(url, {
      params: {
        'omit[resource]': 'autos',
        'include': 'tracks,artists,record-labels',
        'include[songs]': 'artists',
        'fields[artists]': 'name,artwork',
        'fields[albums:albums]': 'artistName,artwork,name,releaseDate,url',
        'fields[record-labels]': 'name',
        'extend': 'editorialVideo',
        'l': ''
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Origin': 'https://music.apple.com'
      }
    });
    
    const data = response.data;
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No album data found');
    }
    
    const albumData = data.data[0];
    
    // プレイリストの場合、追加のトラックを取得
    if (isPlaylist && albumData.relationships.tracks.next) {
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        page += 100;
        
        const nextResponse = await axios.get(`https://amp-api.music.apple.com/v1/catalog/${storefront}/${type}/${albumId}/tracks`, {
          params: {
            offset: page,
            l: ''
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Origin': 'https://music.apple.com'
          }
        });
        
        const nextData = nextResponse.data;
        
        if (nextData.data && nextData.data.length > 0) {
          albumData.relationships.tracks.data = [
            ...albumData.relationships.tracks.data,
            ...nextData.data
          ];
        }
        
        hasMore = nextData.next && nextData.next.length > 0;
      }
    }
    
    return albumData;
  } catch (error) {
    console.error('Error getting album info:', error);
    throw error;
  }
}

/**
 * アーティスト情報を取得します
 * @param {string} artistId - アーティストID
 * @param {string} token - 認証トークン
 * @param {string} storefront - ストアフロント
 * @returns {Promise<Object>} アーティスト情報
 */
async function getArtistInfo(artistId, token, storefront) {
  try {
    const url = `https://amp-api.music.apple.com/v1/catalog/${storefront}/artists/${artistId}`;
    
    const response = await axios.get(url, {
      params: {
        l: ''
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Origin': 'https://music.apple.com'
      }
    });
    
    const data = response.data;
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No artist data found');
    }
    
    return data.data[0];
  } catch (error) {
    console.error('Error getting artist info:', error);
    throw error;
  }
}

/**
 * アーティストのアルバム一覧を取得します
 * @param {string} artistId - アーティストID
 * @param {string} token - 認証トークン
 * @param {string} storefront - ストアフロント
 * @param {string} relationship - 関連タイプ (albums, music-videos)
 * @returns {Promise<Array>} アルバム一覧
 */
async function getArtistAlbums(artistId, token, storefront, relationship = 'albums') {
  try {
    const albums = [];
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const url = `https://amp-api.music.apple.com/v1/catalog/${storefront}/artists/${artistId}/${relationship}`;
      
      const response = await axios.get(url, {
        params: {
          limit: 100,
          offset,
          l: ''
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Origin': 'https://music.apple.com'
        }
      });
      
      const data = response.data;
      
      if (data.data && data.data.length > 0) {
        albums.push(...data.data);
      }
      
      hasMore = data.next && data.next.length > 0;
      offset += 100;
    }
    
    // リリース日でソート
    albums.sort((a, b) => {
      const dateA = new Date(a.attributes.releaseDate);
      const dateB = new Date(b.attributes.releaseDate);
      return dateA - dateB;
    });
    
    return albums;
  } catch (error) {
    console.error('Error getting artist albums:', error);
    throw error;
  }
}

/**
 * 曲のアルバムURLを取得します
 * @param {string} songId - 曲ID
 * @param {string} token - 認証トークン
 * @param {string} storefront - ストアフロント
 * @returns {Promise<string>} アルバムURL
 */
async function getSongAlbumUrl(songId, token, storefront) {
  try {
    // 方法1: 曲のマニフェストからアルバム情報を取得
    try {
      const manifest = await getSongManifest(songId, token, storefront);
      
      if (manifest.relationships && manifest.relationships.albums && 
          manifest.relationships.albums.data && manifest.relationships.albums.data.length > 0) {
        const albumId = manifest.relationships.albums.data[0].id;
        return `https://music.apple.com/${storefront}/album/${albumId}?i=${songId}`;
      }
    } catch (manifestError) {
      console.error(`Failed to get song manifest: ${manifestError}`);
      // 続行して他の方法を試す
    }
    
    // 方法2: 検索APIを使用して曲を検索し、アルバム情報を取得
    try {
      const songInfo = await searchSongById(songId, token, storefront);
      if (songInfo && songInfo.name) {
        // 曲名が取得できた場合、検索APIを使用してアルバム情報を取得
        console.log(`Found song name: ${songInfo.name} by ${songInfo.artistName}`);
        
        if (songInfo.albumId) {
          return `https://music.apple.com/${storefront}/album/${songInfo.albumId}?i=${songId}`;
        }
        
        // 検索APIでアルバムIDが取得できなかった場合は、ダミーのURLを返す
        return `https://music.apple.com/${storefront}/album/unknown/unknown?i=${songId}`;
      }
    } catch (searchError) {
      console.error(`Error searching song by ID: ${searchError}`);
    }
    
    console.error('Failed to get album URL for song');
    return null;
  } catch (error) {
    console.error(`Error getting song album URL: ${error}`);
    return null;
  }
}

/**
 * 曲IDから曲情報を検索します
 * @param {string} songId - 曲ID
 * @param {string} token - 認証トークン
 * @param {string} storefront - ストアフロント
 * @returns {Promise<Object>} 曲情報
 */
async function searchSongById(songId, token, storefront) {
  try {
    const url = `https://amp-api.music.apple.com/v1/catalog/${storefront}/songs/${songId}`;
    
    const response = await axios.get(url, {
      params: {
        extend: 'extendedAssetUrls',
        include: 'albums',
        l: ''
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'iTunes/12.11.3 (Windows; Microsoft Windows 10 x64 Professional Edition (Build 19041); x64) AppleWebKit/7611.1022.4001.1 (dt:2)',
        'Origin': 'https://music.apple.com'
      }
    });
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      const songData = response.data.data[0];
      const result = {
        name: songData.attributes.name,
        artistName: songData.attributes.artistName
      };
      
      // アルバム情報が含まれている場合
      if (songData.relationships && 
          songData.relationships.albums && 
          songData.relationships.albums.data && 
          songData.relationships.albums.data.length > 0) {
        result.albumId = songData.relationships.albums.data[0].id;
        result.albumName = songData.relationships.albums.data[0].attributes?.name;
      }
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error(`Error searching song by ID: ${error.message}`);
    return null;
  }
}

module.exports = {
  parseAppleMusicUrl,
  getToken,
  extractMedia,
  getSongManifest,
  getAlbumInfo,
  getArtistInfo,
  getArtistAlbums,
  getSongAlbumUrl,
  searchSongById
}; 
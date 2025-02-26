/**
 * @typedef {Object} Config
 * @property {string} mediaUserToken - Apple Musicのメディアユーザートークン
 * @property {string} authorizationToken - 認証トークン
 * @property {string} language - 言語設定
 * @property {boolean} embedCover - カバーアートを埋め込むかどうか
 * @property {string} coverSize - カバーアートのサイズ
 * @property {string} coverFormat - カバーアートのフォーマット
 * @property {string} outputDir - 出力ディレクトリ
 * @property {number} alacMax - ALACの最大品質
 * @property {number} atmosMax - Atmosの最大品質
 * @property {string} aacType - AACのタイプ
 */

/**
 * @typedef {Object} TrackInfo
 * @property {string} id - トラックID
 * @property {string} name - トラック名
 * @property {string} artistName - アーティスト名
 * @property {string} albumName - アルバム名
 * @property {number} trackNumber - トラック番号
 * @property {number} discNumber - ディスク番号
 * @property {string} releaseDate - リリース日
 * @property {string} contentRating - コンテンツレーティング
 * @property {string} isrc - ISRC
 * @property {string} url - トラックのURL
 * @property {string} coverUrl - カバーアートのURL
 */

/**
 * @typedef {Object} AlbumInfo
 * @property {string} id - アルバムID
 * @property {string} name - アルバム名
 * @property {string} artistName - アーティスト名
 * @property {string} releaseDate - リリース日
 * @property {string} contentRating - コンテンツレーティング
 * @property {string} upc - UPC
 * @property {string} copyright - 著作権
 * @property {string} recordLabel - レコードレーベル
 * @property {string} coverUrl - カバーアートのURL
 * @property {TrackInfo[]} tracks - トラック情報
 */

/**
 * @typedef {Object} PlaylistInfo
 * @property {string} id - プレイリストID
 * @property {string} name - プレイリスト名
 * @property {string} curatorName - キュレーター名
 * @property {string} description - 説明
 * @property {string} coverUrl - カバーアートのURL
 * @property {TrackInfo[]} tracks - トラック情報
 */

/**
 * @typedef {Object} ArtistInfo
 * @property {string} id - アーティストID
 * @property {string} name - アーティスト名
 * @property {string} coverUrl - カバーアートのURL
 * @property {AlbumInfo[]} albums - アルバム情報
 */

/**
 * @typedef {Object} UrlInfo
 * @property {string} type - URLのタイプ (album, song, playlist, artist)
 * @property {string} storefront - ストアフロント
 * @property {string} id - ID
 * @property {string} url - 元のURL
 */

module.exports = {}; 
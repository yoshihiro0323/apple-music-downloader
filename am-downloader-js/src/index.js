const AppleMusicDownloader = require('./api');
const utils = require('./utils');

module.exports = {
  AppleMusicDownloader,
  utils,
  
  /**
   * URLを解析して情報を取得します
   * @param {string} url - Apple MusicのURL
   * @returns {Object|null} URL情報
   */
  parseUrl(url) {
    return utils.parseAppleMusicUrl(url);
  },
  
  /**
   * Apple Musicの認証トークンを取得します
   * @returns {Promise<string>} 認証トークン
   */
  async getToken() {
    return utils.getToken();
  },
  
  /**
   * URLからコンテンツ情報を取得します
   * @param {string} url - Apple MusicのURL
   * @param {Object} config - 設定
   * @returns {Promise<Object>} コンテンツ情報
   */
  async getContentInfo(url, config = {}) {
    const downloader = new AppleMusicDownloader(config);
    return downloader.getContentInfo(url);
  },
  
  /**
   * URLからトラックリストを取得します
   * @param {string} url - Apple MusicのURL
   * @param {Object} config - 設定
   * @returns {Promise<Array>} トラックリスト
   */
  async getTrackList(url, config = {}) {
    const downloader = new AppleMusicDownloader(config);
    return downloader.getTrackList(url);
  },
  
  /**
   * URLから曲をダウンロードします
   * @param {string} url - Apple MusicのURL
   * @param {string} outputPath - 出力パス
   * @param {Object} config - 設定
   * @returns {Promise<Object>} ダウンロード情報
   */
  async downloadFromUrl(url, outputPath = null, config = {}) {
    const downloader = new AppleMusicDownloader(config);
    return downloader.downloadFromUrl(url, outputPath);
  }
}; 
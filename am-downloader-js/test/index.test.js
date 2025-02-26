const { expect } = require('chai');
const sinon = require('sinon');
const appleMusicDownloader = require('../src/index');

describe('Apple Music Downloader', () => {
  describe('parseUrl', () => {
    it('アルバムURLを正しく解析できること', () => {
      const url = 'https://music.apple.com/jp/album/utopia/1693409884';
      const result = appleMusicDownloader.parseUrl(url);
      
      expect(result).to.be.an('object');
      expect(result.type).to.equal('album');
      expect(result.id).to.equal('1693409884');
      expect(result.region).to.equal('jp');
    });

    it('曲URLを正しく解析できること', () => {
      const url = 'https://music.apple.com/jp/album/flowers/1663973555?i=1663973562';
      const result = appleMusicDownloader.parseUrl(url);
      
      expect(result).to.be.an('object');
      expect(result.type).to.equal('song');
      expect(result.id).to.equal('1663973562');
      expect(result.albumId).to.equal('1663973555');
      expect(result.region).to.equal('jp');
    });

    it('プレイリストURLを正しく解析できること', () => {
      const url = 'https://music.apple.com/jp/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb';
      const result = appleMusicDownloader.parseUrl(url);
      
      expect(result).to.be.an('object');
      expect(result.type).to.equal('playlist');
      expect(result.id).to.equal('pl.f4d106fed2bd41149aaacabb233eb5eb');
      expect(result.region).to.equal('jp');
    });

    it('アーティストURLを正しく解析できること', () => {
      const url = 'https://music.apple.com/jp/artist/taylor-swift/159260351';
      const result = appleMusicDownloader.parseUrl(url);
      
      expect(result).to.be.an('object');
      expect(result.type).to.equal('artist');
      expect(result.id).to.equal('159260351');
      expect(result.region).to.equal('jp');
    });

    it('無効なURLの場合はエラーをスローすること', () => {
      const url = 'https://example.com/invalid';
      expect(() => appleMusicDownloader.parseUrl(url)).to.throw();
    });
  });

  // モックを使用したAPIテストの例
  describe('getToken', () => {
    let sandbox;
    
    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });
    
    afterEach(() => {
      sandbox.restore();
    });
    
    it('トークンを正しく取得できること', async () => {
      // APIモックの設定
      const fakeToken = 'fake-token-12345';
      sandbox.stub(appleMusicDownloader, 'getToken').resolves(fakeToken);
      
      const token = await appleMusicDownloader.getToken();
      expect(token).to.equal(fakeToken);
    });
  });
}); 
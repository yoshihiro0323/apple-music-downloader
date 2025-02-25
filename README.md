### You must first install [MP4Box](https://gpac.io/downloads/gpac-nightly-builds/) and ensure that [MP4Box](https://gpac.io/downloads/gpac-nightly-builds/) is correctly added to your environment variables.

### 注意事項

**このバージョンではMVと歌詞のダウンロード機能は無効化されています。**

### Features

1. ~~Supports embedded cover art and LRC lyrics (requires `media-user-token`, see the instructions at the end for how to obtain it).~~
2. ~~Supports fetching word-by-word and unsynchronized lyrics.~~
3. Supports downloading an artist's entire discography: `go run main.go https://music.apple.com/us/artist/taylor-swift/159260351 --all-album` automatically selects all albums of the artist.
4. Replaced the decryption part with Sendy McSenderson's code to enable simultaneous downloading and decrypting, solving memory issues with large file decryption.
5. ~~MV download requires installing [mp4decrypt](https://www.bento4.com/downloads/).~~

### Special thanks to `chocomint` for creating `agent-arm64.js`.

To obtain `aac-lc` ~~, `MV`, and `lyrics`~~, you must enter a subscribed `media-user-token`.

- `alac (audio-alac-stereo)`
- `ec3 (audio-atmos / audio-ec3)`
- `aac (audio-stereo)`
- `aac-lc (audio-stereo)`
- `aac-binaural (audio-stereo-binaural)`
- `aac-downmix (audio-stereo-downmix)`
- ~~`MV`~~

# Apple Music ALAC / Dolby Atmos Downloader

Original script by Sorrow. Modified by me to include some fixes and improvements.

## How to use
1. Make sure the decryption program [wrapper](https://github.com/zhaarey/wrapper) is running.
2. Start downloading some albums: `go run main.go https://music.apple.com/us/album/whenever-you-need-somebody-2022-remaster/1624945511`.
3. Start downloading a single song: `go run main.go --song https://music.apple.com/us/album/never-gonna-give-you-up-2022-remaster/1624945511?i=1624945512` or `go run main.go https://music.apple.com/us/song/you-move-me-2022-remaster/1624945520`.
4. Start downloading selected tracks: `go run main.go --select https://music.apple.com/us/album/whenever-you-need-somebody-2022-remaster/1624945511` and input numbers separated by spaces.
5. Start downloading some playlists: `go run main.go https://music.apple.com/us/playlist/taylor-swift-essentials/pl.3950454ced8c45a3b0cc693c2a7db97b` or `go run main.go https://music.apple.com/us/playlist/hi-res-lossless-24-bit-192khz/pl.u-MDAWvpjt38370N`.
6. For Dolby Atmos: `go run main.go --atmos https://music.apple.com/us/album/1989-taylors-version-deluxe/1713845538`.
7. For AAC: `go run main.go --aac https://music.apple.com/us/album/1989-taylors-version-deluxe/1713845538`.
8. To see quality: `go run main.go --debug https://music.apple.com/us/album/1989-taylors-version-deluxe/1713845538`.

[Chinese tutorial - see Method 3](https://telegra.ph/Apple-Music-Alac高解析度无损音乐下载教程-04-02-2)

## ~~Downloading lyrics~~

~~1. Open [Apple Music](https://music.apple.com) and log in.~~
~~2. Open the Developer tools, click `Application -> Storage -> Cookies -> https://music.apple.com`.~~
~~3. Find the cookie named `media-user-token` and copy its value.~~
~~4. Paste the cookie value obtained in step 3 into the config.yaml and save it.~~
~~5. Start the script as usual.~~

**注意: 歌詞のダウンロード機能は現在無効化されています。**

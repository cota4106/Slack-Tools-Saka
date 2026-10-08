# Slack便利ツール

Slack での作業をラクにする小さなツール集です。ビルド不要の静的サイトで、GitHub Pages にそのまま置けます。
現在のツール: **リマインドメーカー**(`/remind` コマンドを選ぶだけで作成)

## フォルダ構成

```
index.html                    画面の枠。ツールを読み込む1行を足す場所
assets/
  css/base.css                共通スタイル(Apple HIG ベース)
  js/
    core/
      registry.js             ツール登録所(SlackTools.register)
      ui.js                   共通UI部品(行・セグメント・チップ・結果バーなど)
      app.js                  ホーム一覧とルーティング(#/ と #/tool/<id>)
    tools/
      remind.js               リマインドメーカー
      _template.js            新ツールのひな形(読み込まれません)
```

## ツールを追加する手順

1. `assets/js/tools/_template.js` を `assets/js/tools/<名前>.js` にコピーする
2. `id` / `title` / `description` / `icon` / `color` を書き換え、`mount` の中に画面を作る
3. `index.html` の「② ツール」に次の1行を足す

   ```html
   <script src="assets/js/tools/<名前>.js"></script>
   ```

これでホームの一覧に自動で並び、`#/tool/<id>` で開けます。コア(`core/`)を触る必要はありません。

### 使える共通UI部品(`ctx.ui`)

| 部品 | 用途 |
| --- | --- |
| `h(tag, props, ...children)` | 要素を作る |
| `section / group / item` | 見出し付きカード、行(左に名前・右に入力) |
| `segmented / days / select / chips` | 切り替え、複数選択トグル、セレクト、クイック選択 |
| `disclosure` | 開閉する補足 |
| `createResultBar` | 下部固定の結果表示とコピーボタン |
| `copyText` | クリップボードへコピー |

見た目を変えたいときは `assets/css/base.css` の先頭のカラー変数を編集します。

## GitHub Pages で公開する手順

1. GitHub で新しいリポジトリを作成する(例: `slack-tools`)
2. このフォルダの中身(`index.html`、`assets/`、`README.md`)をリポジトリのルートにアップロードする
3. リポジトリの **Settings → Pages** を開く
4. **Source** を `Deploy from a branch`、Branch を `main` / `(root)` にして **Save**
5. 1〜2分後に `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開される

ローカルで確認するときは、フォルダ内で `python3 -m http.server` を実行し、`http://localhost:8000/` を開きます。

## リマインドメーカーの対応設定

- 通知先: 自分 / 特定の人(@ユーザー名) / チャンネル(#チャンネル名)
- 内容: 自由入力、テンプレート、先頭の絵文字
- 時間: 日時指定 / ○分・○時間・○日・○週間後
- くり返し: 毎日 / 平日 / 毎週(曜日複数可) / 隔週 / 毎月(日にち) / 毎年

```
/remind me "日報を書く" every weekday at 5pm
/remind #general "朝会の時間です" every Monday at 9:30am
/remind @tanaka "請求書を送る" on the 1st of every month at 10am
```


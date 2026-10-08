/* =========================================================
   新しいツールのひな形
   1. このファイルを assets/js/tools/<名前>.js にコピー
   2. id / title などを書き換えて mount の中身を作る
   3. index.html の「② ツール」に次の1行を足す
        <script src="assets/js/tools/<名前>.js"></script>
   これだけで一覧に表示され、#/tool/<id> で開けます。
   ========================================================= */
(function(){
  function mount(root, ctx){
    const ui = ctx.ui, h = ui.h;

    // 入力部品(ui.segmented / ui.select / ui.days / ui.chips などが使えます)
    const input = h("input", { type: "text", id: "sample-input", placeholder: "入力してください" });

    // セクション > グループ > 行 の入れ子で組み立てる
    root.append(
      ui.section("入力", ui.group(
        ui.item({ name: "テキスト", forId: "sample-input", control: input })
      ), "ここに補足を書けます。")
    );

    // 結果をコピーさせたいなら下部の結果バーが使えます(不要なら省略可)
    const bar = ui.createResultBar({ label: "結果", placeholder: "…" });
    function update(){
      const v = input.value.trim();
      if(!v){ bar.set({ error: "テキストを入力してください。" }); return; }
      bar.set({ lines: [v], summary: "コピーして Slack に貼り付けてください。" });
    }
    root.addEventListener("input", update);
    update();

    // 画面を離れるときの後片付け(結果バーを使った場合は必須)
    return () => bar.destroy();
  }

  window.SlackTools.register({
    id: "sample",              // 英数字・_・- のみ。他と重複しないこと
    title: "サンプルツール",
    description: "一覧に出る短い説明",
    icon: "🧩",
    color: "#5856d6",
    lead: "タイトル下に表示される説明文です。",
    mount
  });
})();

/* =========================================================
   ツール登録所
   各ツールは SlackTools.register({...}) を呼ぶだけで
   ホームの一覧とルーティングに自動で加わります。

   定義の形:
   {
     id:          "remind",            // URL(#/tool/remind)に使う英数字とハイフン
     title:       "リマインドメーカー",  // 画面タイトル
     description: "一覧に出る短い説明",
     icon:        "⏰",                // 一覧のアイコン(絵文字)
     color:       "#ff9500",           // アイコン背景色
     lead:        "タイトル下の説明文(任意)",
     mount(root, ctx){ ... }           // root に画面を作る。後片付け関数を返してもよい
   }
   ctx = { ui: window.UI }
   ========================================================= */
(function(){
  const tools = [];

  const SlackTools = {
    register(def){
      const problems = [];
      if(!def || typeof def !== "object") problems.push("定義がオブジェクトではありません");
      else{
        if(!/^[\w-]+$/.test(def.id || "")) problems.push("id は英数字・_・- のみで指定してください");
        if(!def.title) problems.push("title がありません");
        if(typeof def.mount !== "function") problems.push("mount が関数ではありません");
        if(tools.some(t => t.id === def.id)) problems.push("id「" + def.id + "」は登録済みです");
      }
      if(problems.length){
        console.error("[SlackTools] 登録に失敗:", problems.join(" / "), def);
        return false;
      }
      tools.push(Object.assign({ description:"", icon:"🧩", color:"#8e8e93", lead:"" }, def));
      return true;
    },
    list(){ return tools.slice(); },
    get(id){ return tools.find(t => t.id === id) || null; }
  };

  window.SlackTools = SlackTools;
})();

/* =========================================================
   アプリ本体: ハッシュルーティング
     #/            ツール一覧(ホーム)
     #/tool/<id>   各ツール
   ========================================================= */
(function(){
  const { h, section, group } = window.UI;
  const SITE = "Slack便利ツール";
  const navEl = document.getElementById("nav");
  const viewEl = document.getElementById("view");
  let cleanup = null;

  function teardown(){
    if(cleanup){
      try{ cleanup(); }catch(e){ console.error("[app] cleanup でエラー", e); }
      cleanup = null;
    }
    document.querySelectorAll(".bar").forEach(n => n.remove());
    viewEl.className = "";
    viewEl.textContent = "";
    navEl.textContent = "";
  }

  function header(title, lead){
    const h1 = h("h1", { text: title, tabindex: "-1" });
    viewEl.appendChild(h1);
    if(lead) viewEl.appendChild(h("p", { class: "lead", text: lead }));
    return h1;
  }

  function renderHome(){
    document.title = SITE;
    header(SITE, "Slack での作業を少しラクにする小さなツール集です。使いたいツールを選んでください。");
    const tools = window.SlackTools.list();
    if(!tools.length){
      viewEl.appendChild(h("p", { class: "notice", text: "ツールがまだ登録されていません。" }));
      return;
    }
    const rows = tools.map(t => h("a", { class: "item link", href: "#/tool/" + t.id },
      h("span", { class: "app-icon", text: t.icon, style: "background:" + t.color, "aria-hidden": "true" }),
      h("span", { class: "link-text" },
        h("span", { class: "link-title", text: t.title }),
        t.description ? h("span", { class: "link-desc", text: t.description }) : null)));
    viewEl.appendChild(section("ツール", group(...rows)));
  }

  function renderTool(tool){
    document.title = tool.title + " | " + SITE;
    navEl.appendChild(h("a", { class: "back", href: "#/", text: "ツール一覧" }));
    const h1 = header(tool.title, tool.lead);
    const root = h("div", { class: "tool tool-" + tool.id });
    viewEl.appendChild(root);
    try{
      const ret = tool.mount(root, { ui: window.UI });
      if(typeof ret === "function") cleanup = ret;
    }catch(e){
      console.error("[app] ツール「" + tool.id + "」の表示でエラー", e);
      root.appendChild(h("p", { class: "notice", text: "このツールの表示中にエラーが発生しました。ページを再読み込みしてください。" }));
    }
    h1.focus({ preventScroll: true });
  }

  function route(){
    teardown();
    const m = location.hash.match(/^#\/tool\/([\w-]+)/);
    const tool = m ? window.SlackTools.get(m[1]) : null;
    if(tool) renderTool(tool); else renderHome();
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  // ツールのスクリプトは app.js より後に読み込まれるため、全読み込み後に最初の描画
  window.addEventListener("load", route);
})();

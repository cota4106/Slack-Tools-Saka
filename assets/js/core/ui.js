/* =========================================================
   共通UI部品(HIG準拠スタイルは base.css 側)
   ツールはここの部品を組み合わせて画面を作ります。
   ========================================================= */
(function(){
  /** 要素作成: h("div", {class:"x", onClick:fn}, 子...) */
  function h(tag, props, ...children){
    const el = document.createElement(tag);
    let value;
    if(props){
      for(const [k, v] of Object.entries(props)){
        if(v == null || v === false) continue;
        if(k === "class") el.className = v;
        else if(k === "text") el.textContent = v;
        else if(k === "value") value = v;
        else if(k === "dataset") Object.assign(el.dataset, v);
        else if(/^on[A-Z]/.test(k) && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v === true ? "" : v);
      }
    }
    (function add(list){
      for(const c of list){
        if(c == null || c === false) continue;
        if(Array.isArray(c)) add(c);
        else el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
      }
    })(children);
    if(value !== undefined) el.value = value; // select は子の後に値を設定
    return el;
  }

  /** セクション: 見出し + グループ + 注釈 */
  function section(title, groupEl, footer){
    const footerEl = footer == null ? null
      : (footer.nodeType ? footer : h("p", { class: "section-footer", text: footer }));
    if(footerEl && !footerEl.classList.contains("section-footer")) footerEl.classList.add("section-footer");
    const el = h("section", { class: "section" },
      title ? h("h2", { class: "section-title", text: title }) : null,
      groupEl,
      footerEl);
    el.footerEl = footerEl;
    return el;
  }

  function group(...items){ return h("div", { class: "group" }, items); }

  /** 行: 左に名前、右にコントロール */
  function item({ name, forId, control, block, hidden } = {}){
    const nameEl = name != null
      ? h(forId ? "label" : "span", { class: "name", for: forId, text: name }) : null;
    const el = h("div", { class: "item" + (block ? " block" : "") + (hidden ? " hidden" : "") }, nameEl, control);
    el.nameEl = nameEl;
    return el;
  }

  /** セグメンテッドコントロール。name はページ内で一意に */
  function segmented({ name, options, value, label }){
    const el = h("div", { class: "segmented", role: "radiogroup", "aria-label": label },
      options.map(o => h("label", null,
        h("input", { type: "radio", name, value: o.value, checked: o.value === value }),
        h("span", { text: o.label }))));
    return {
      el,
      get(){ const c = el.querySelector("input:checked"); return c ? c.value : ""; },
      set(v){ el.querySelectorAll("input").forEach(i => { i.checked = i.value === v; }); }
    };
  }

  /** 曜日などの複数選択トグル */
  function days({ options, checked = [] }){
    const el = h("div", { class: "days" },
      options.map(o => h("label", null,
        h("input", { type: "checkbox", value: o.value, "aria-label": o.aria || o.label, checked: checked.includes(o.value) }),
        h("span", { text: o.label }))));
    return { el, values(){ return Array.from(el.querySelectorAll("input:checked")).map(i => i.value); } };
  }

  /** ピル型セレクト */
  function select({ id, options, value }){
    return h("select", { id, class: "pill", value },
      options.map(o => h("option", { value: o.value, text: o.label })));
  }

  /** チップ(クイック選択) */
  function chips(list){
    return h("div", { class: "chips" },
      list.map(c => h("button", { type: "button", class: "chip", text: c.label, onClick: c.onClick })));
  }

  /** ディスクロージャー(開閉する行) */
  function disclosure(title, ...body){
    return h("details", null,
      h("summary", { text: title }),
      h("div", { class: "detail-body" }, body));
  }

  async function copyText(text){
    try{
      await navigator.clipboard.writeText(text);
    }catch(e){
      const ta = h("textarea", { style: "position:fixed;opacity:0" });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  /**
   * 下部固定の結果バー。
   * set({ lines:[文字列], summary:"説明", error:"エラー文" })
   * エラー時はコピーボタンを無効化。destroy() で撤去。
   */
  function createResultBar({ label = "完成したコマンド", placeholder = "…" } = {}){
    const linesEl = h("div", { class: "bar-lines" });
    const summaryEl = h("p", { class: "bar-summary" });
    const errorEl = h("p", { class: "bar-error hidden" });
    const btn = h("button", { class: "btn", type: "button" });
    const el = h("div", { class: "bar", role: "region", "aria-label": label, "aria-live": "polite" },
      h("div", { class: "bar-inner" },
        h("p", { class: "bar-label", text: label }),
        linesEl, summaryEl, errorEl, btn));
    document.body.appendChild(el);
    document.body.classList.add("has-bar");

    let text = "", multi = false, timer = null;
    function resetBtn(){
      clearTimeout(timer);
      btn.classList.remove("done");
      btn.textContent = multi ? "すべてコピー" : "コピーする";
    }
    btn.addEventListener("click", async () => {
      if(!text) return;
      await copyText(text);
      btn.classList.add("done");
      btn.textContent = "コピーしました ✓";
      clearTimeout(timer);
      timer = setTimeout(resetBtn, 2200);
    });

    function set({ lines = [], summary = "", error = "" } = {}){
      linesEl.textContent = "";
      const ok = !error && lines.length > 0;
      if(ok){
        lines.forEach(l => linesEl.appendChild(h("div", { class: "bar-line", text: l })));
      }else{
        linesEl.appendChild(h("div", { class: "bar-line placeholder", text: placeholder }));
      }
      summaryEl.textContent = ok ? summary : "";
      errorEl.textContent = error;
      errorEl.classList.toggle("hidden", !error);
      text = ok ? lines.join("\n") : "";
      multi = lines.length > 1;
      btn.disabled = !ok;
      resetBtn();
    }

    function destroy(){
      clearTimeout(timer);
      el.remove();
      document.body.classList.remove("has-bar");
    }

    set();
    return { set, destroy, el };
  }

  window.UI = { h, section, group, item, segmented, days, select, chips, disclosure, copyText, createResultBar };
})();

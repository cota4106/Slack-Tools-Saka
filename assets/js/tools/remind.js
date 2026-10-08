/* =========================================================
   ツール: リマインドメーカー(/remind コマンド生成)
   ========================================================= */
(function(){
  const DAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const DAYS_JA = ["日","月","火","水","木","金","土"];
  const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const TEMPLATES = [
    ["朝会に参加する", "朝会に参加する"],
    ["日報を書く", "日報を書く"],
    ["水を飲む", "水を飲む"],
    ["請求書を送る", "請求書を送る"],
    ["週報を提出する", "週報を提出する"],
    ["休憩する", "少し休憩する"]
  ];

  const pad = n => String(n).padStart(2, "0");
  const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

  function fmtTime(t){ // "15:30" -> "3:30pm"
    if(!t) return "";
    const [h, m] = t.split(":").map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (m ? ":" + pad(m) : "") + (h >= 12 ? "pm" : "am");
  }
  function fmtTimeJa(t){ if(!t) return ""; const [h, m] = t.split(":"); return Number(h) + ":" + m; }
  function ordinal(n){
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function mount(root, ctx){
    const ui = ctx.ui, h = ui.h;

    /* ---------- 1. 通知先 ---------- */
    const target = ui.segmented({
      name: "rm-target", label: "通知先", value: "me",
      options: [{ value: "me", label: "自分" }, { value: "user", label: "特定の人" }, { value: "channel", label: "チャンネル" }]
    });
    const targetName = h("input", { type: "text", id: "rm-targetName", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
    const targetNameItem = ui.item({ name: "名前", forId: "rm-targetName", control: targetName, hidden: true });
    const s1 = ui.section("1 · 誰に通知する",
      ui.group(ui.item({ control: target.el }), targetNameItem), "");
    s1.footerEl.classList.add("hidden");

    /* ---------- 2. 内容 ---------- */
    const what = h("textarea", { id: "rm-what", placeholder: "例: 日報を書く", "aria-label": "通知する内容" });
    const emoji = ui.select({
      id: "rm-emoji", value: "",
      options: [
        { value: "", label: "なし" },
        { value: ":bell: ", label: "🔔 ベル" },
        { value: ":warning: ", label: "⚠️ 注意" },
        { value: ":memo: ", label: "📝 メモ" },
        { value: ":calendar: ", label: "📅 カレンダー" },
        { value: ":white_check_mark: ", label: "✅ チェック" },
        { value: ":fire: ", label: "🔥 炎" }
      ]
    });
    const s2 = ui.section("2 · 何を通知する", ui.group(
      ui.item({ block: true, control: what }),
      ui.item({ block: true, control: ui.chips(TEMPLATES.map(([label, text]) => ({
        label, onClick: () => { what.value = text; update(); }
      }))) }),
      ui.item({ name: "先頭の絵文字", forId: "rm-emoji", control: emoji })
    ));

    /* ---------- 3. いつ ---------- */
    const mode = ui.segmented({
      name: "rm-mode", label: "通知のタイミング", value: "once",
      options: [{ value: "once", label: "日時を指定" }, { value: "after", label: "○分後" }, { value: "repeat", label: "くり返し" }]
    });

    // 日時指定
    const date = h("input", { type: "date", id: "rm-date", value: ymd(addDays(1)) });
    const time1 = h("input", { type: "time", id: "rm-time1", value: "09:00" });
    const onceBox = h("div", null,
      ui.item({ name: "日付", forId: "rm-date", control: date }),
      ui.item({ name: "時刻", forId: "rm-time1", control: time1 }),
      ui.item({ block: true, control: ui.chips([
        { label: "今日", onClick: () => { date.value = ymd(addDays(0)); update(); } },
        { label: "明日", onClick: () => { date.value = ymd(addDays(1)); update(); } },
        { label: "1週間後", onClick: () => { date.value = ymd(addDays(7)); update(); } }
      ]) }));

    // ○分後
    const afterN = h("input", { type: "number", id: "rm-afterN", class: "pill", min: "1", max: "999", value: "30", inputmode: "numeric" });
    const afterU = ui.select({
      id: "rm-afterU", value: "minutes",
      options: [{ value: "minutes", label: "分後" }, { value: "hours", label: "時間後" }, { value: "days", label: "日後" }, { value: "weeks", label: "週間後" }]
    });
    const afterBox = h("div", { class: "hidden" },
      ui.item({ name: "数", forId: "rm-afterN", control: afterN }),
      ui.item({ name: "単位", forId: "rm-afterU", control: afterU }));

    // くり返し
    const freq = ui.select({
      id: "rm-freq", value: "daily",
      options: [
        { value: "daily", label: "毎日" }, { value: "weekday", label: "平日(月〜金)" },
        { value: "weekly", label: "毎週" }, { value: "biweekly", label: "隔週" },
        { value: "monthly", label: "毎月" }, { value: "yearly", label: "毎年" }
      ]
    });
    const week = ui.days({
      checked: ["1"],
      options: [1, 2, 3, 4, 5, 6, 0].map(i => ({ value: String(i), label: DAYS_JA[i], aria: DAYS_JA[i] + "曜日" }))
    });
    const weekItem = ui.item({ name: "曜日(複数選べます)", block: true, control: week.el, hidden: true });
    const monthDay = ui.select({
      id: "rm-monthDay", value: "1",
      options: Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: (i + 1) + "日" }))
    });
    const monthItem = ui.item({ name: "日にち", forId: "rm-monthDay", control: monthDay, hidden: true });
    const yearDate = h("input", { type: "date", id: "rm-yearDate", value: ymd(new Date()) });
    const yearItem = ui.item({ name: "月日", forId: "rm-yearDate", control: yearDate, hidden: true });
    const time2 = h("input", { type: "time", id: "rm-time2", value: "09:00" });
    const repeatBox = h("div", { class: "hidden" },
      ui.item({ name: "くり返し", forId: "rm-freq", control: freq }),
      weekItem, monthItem, yearItem,
      ui.item({ name: "時刻", forId: "rm-time2", control: time2 }));

    const s3 = ui.section("3 · いつ通知する",
      ui.group(ui.item({ control: mode.el }), onceBox, afterBox, repeatBox),
      "月によって存在しない29〜31日は選べません。");
    s3.footerEl.classList.add("hidden");

    /* ---------- ヒント ---------- */
    const s4 = ui.section("知っておくと便利", ui.group(
      ui.disclosure("Slack でのリマインド操作",
        h("dl", null,
          h("dt", { text: "一覧を見る" }), h("dd", null, h("code", { text: "/remind list" })),
          h("dt", { text: "削除・完了" }), h("dd", { text: "一覧、または通知のボタンから" }),
          h("dt", { text: "あとで通知" }), h("dd", { text: "通知の「スヌーズ」から" }),
          h("dt", { text: "投稿から作成" }), h("dd", { text: "メッセージの「︙」→「リマインドする」" }))),
      ui.disclosure("うまく動かないとき",
        h("p", { text: "・チャンネル宛ては、自分がそのチャンネルに参加している必要があります。" }),
        h("p", { text: "・時刻は Slack のプロフィールのタイムゾーンで解釈されます。" }),
        h("p", { text: "・日本語の Slack でも、コマンドは英語表記のまま入力してください。" }),
        h("p", { text: "・組織の設定で、他の人宛てのリマインドが制限されている場合があります。" }))
    ));

    root.append(s1, s2, s3, s4);

    const bar = ui.createResultBar({ label: "完成したコマンド", placeholder: "/remind …" });

    /* ---------- ロジック ---------- */
    function cleanWhat(){
      const w = what.value.replace(/[\r\n]+/g, " ").replace(/["“”]/g, "'").trim();
      return w ? emoji.value + w : "";
    }

    function targetInfo(){
      const t = target.get();
      if(t === "me") return { s: "me", ja: "あなた", err: "" };
      let n = targetName.value.trim();
      if(t === "user"){
        n = n.replace(/^@/, "").replace(/\s+/g, "");
        return n ? { s: "@" + n, ja: "@" + n + " さん", err: "" }
                 : { s: "", ja: "", err: "通知する相手のユーザー名を入力してください。" };
      }
      n = n.replace(/^#/, "").replace(/\s+/g, "");
      return n ? { s: "#" + n, ja: "#" + n + " チャンネル", err: "" }
               : { s: "", ja: "", err: "チャンネル名を入力してください。" };
    }

    function whenParts(){
      const m = mode.get();
      if(m === "once"){
        const d = date.value, t = time1.value;
        if(!d || !t) return { list: [], err: "日付と時刻を入力してください。" };
        if(new Date(d + "T" + t) <= new Date()) return { list: [], err: "過去の日時になっています。未来の日時を選んでください。" };
        const [y, mo, dd] = d.split("-").map(Number);
        let en, ja;
        if(d === ymd(new Date())){ en = "today at " + fmtTime(t); ja = "今日 " + fmtTimeJa(t); }
        else if(d === ymd(addDays(1))){ en = "tomorrow at " + fmtTime(t); ja = "明日 " + fmtTimeJa(t); }
        else{
          en = "on " + MONTHS_EN[mo - 1] + " " + dd + (y !== new Date().getFullYear() ? " " + y : "") + " at " + fmtTime(t);
          ja = y + "年" + mo + "月" + dd + "日 " + fmtTimeJa(t);
        }
        return { list: [{ en, ja: ja + " に1回" }], err: "" };
      }
      if(m === "after"){
        const n = parseInt(afterN.value, 10);
        if(!n || n < 1) return { list: [], err: "1以上の数を入力してください。" };
        const u = afterU.value;
        return { list: [{
          en: "in " + n + " " + (n === 1 ? u.replace(/s$/, "") : u),
          ja: n + { minutes: "分", hours: "時間", days: "日", weeks: "週間" }[u] + "後に1回"
        }], err: "" };
      }
      const t = time2.value;
      if(!t) return { list: [], err: "時刻を入力してください。" };
      const at = " at " + fmtTime(t), jt = fmtTimeJa(t), f = freq.value;
      if(f === "daily") return { list: [{ en: "every day" + at, ja: "毎日 " + jt }], err: "" };
      if(f === "weekday") return { list: [{ en: "every weekday" + at, ja: "平日(月〜金)の " + jt }], err: "" };
      if(f === "weekly" || f === "biweekly"){
        const order = [1, 2, 3, 4, 5, 6, 0];
        const sel = week.values().map(Number).sort((a, b) => order.indexOf(a) - order.indexOf(b));
        if(!sel.length) return { list: [], err: "曜日を1つ以上選んでください。" };
        return { list: sel.map(i => ({
          en: (f === "weekly" ? "every " : "every other ") + DAYS_EN[i] + at,
          ja: (f === "weekly" ? "毎週" : "隔週") + DAYS_JA[i] + "曜日 " + jt
        })), err: "" };
      }
      if(f === "monthly"){
        const d = Number(monthDay.value);
        return { list: [{ en: "on the " + ordinal(d) + " of every month" + at, ja: "毎月" + d + "日 " + jt }], err: "" };
      }
      if(f === "yearly"){
        if(!yearDate.value) return { list: [], err: "月日を選んでください。" };
        const [, mo, d] = yearDate.value.split("-").map(Number);
        return { list: [{ en: "on " + MONTHS_EN[mo - 1] + " " + d + " every year" + at, ja: "毎年" + mo + "月" + d + "日 " + jt }], err: "" };
      }
      return { list: [], err: "" };
    }

    function update(){
      // 表示切替
      const tg = target.get(), m = mode.get(), f = freq.value;
      targetNameItem.classList.toggle("hidden", tg === "me");
      s1.footerEl.classList.toggle("hidden", tg === "me");
      if(tg === "user"){
        targetNameItem.nameEl.textContent = "ユーザー名";
        targetName.placeholder = "例: tanaka";
        s1.footerEl.textContent = "Slack の表示名(@ の後ろの部分)を入力します。@ は付けても付けなくても構いません。";
      }else if(tg === "channel"){
        targetNameItem.nameEl.textContent = "チャンネル名";
        targetName.placeholder = "例: general";
        s1.footerEl.textContent = "# は付けても付けなくても構いません。自分が参加しているチャンネルのみ指定できます。";
      }
      onceBox.classList.toggle("hidden", m !== "once");
      afterBox.classList.toggle("hidden", m !== "after");
      repeatBox.classList.toggle("hidden", m !== "repeat");
      weekItem.classList.toggle("hidden", !(m === "repeat" && (f === "weekly" || f === "biweekly")));
      monthItem.classList.toggle("hidden", !(m === "repeat" && f === "monthly"));
      yearItem.classList.toggle("hidden", !(m === "repeat" && f === "yearly"));
      s3.footerEl.classList.toggle("hidden", !(m === "repeat" && f === "monthly"));

      // コマンド生成
      const tgt = targetInfo(), w = whenParts(), body = cleanWhat();
      const err = tgt.err || (!body ? "通知する内容を入力してください。" : "") || w.err;
      if(err){ bar.set({ error: err }); return; }
      const lines = w.list.map(p => "/remind " + tgt.s + ' "' + body + '" ' + p.en);
      bar.set({
        lines,
        summary: tgt.ja + "に「" + body + "」を " + w.list.map(p => p.ja).join(" / ") + " に通知します。"
          + (lines.length > 1 ? " 曜日ごとに1行ずつ作られるので、1行ずつ送信してください。" : "")
      });
    }

    root.addEventListener("input", update);
    root.addEventListener("change", update);
    update();

    return () => bar.destroy();
  }

  window.SlackTools.register({
    id: "remind",
    title: "リマインドメーカー",
    description: "/remind コマンドを選ぶだけで作成",
    icon: "⏰",
    color: "#ff9500",
    lead: "選ぶだけで Slack 用の /remind コマンドが完成します。コピーして Slack のメッセージ欄に貼り付け、送信するだけです。",
    mount
  });
})();

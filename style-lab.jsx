const STYLE_OPTIONS = {
  A: { name: "晴空", short: "清透柔和" },
  B: { name: "测站", short: "现代户外" },
  C: { name: "风物", short: "编辑克制" },
};

function ChoiceButton({ variant, className, onChoose }) {
  return (
    <button
      className={className}
      onClick={(event) => {
        event.stopPropagation();
        onChoose(variant);
      }}
    >
      选择 {variant} · {STYLE_OPTIONS[variant].name}
    </button>
  );
}

function OptionA({ onChoose }) {
  const days = [
    ["三", "21", "24°", "15°"],
    ["四", "22", "22°", "12°"],
    ["五", "23", "23°", "13°"],
    ["六", "24", "22°", "10°"],
    ["日", "25", "23°", "12°"],
    ["一", "26", "22°", "15°"],
    ["二", "27", "23°", "15°"],
  ];
  return (
    <div className="mock opt-a">
      <header className="a-top">
        <div className="a-brand"><span className="a-logo">山</span>山候</div>
        <div className="a-search">搜索山名、区域或路线</div>
        <div className="a-city">惠州 · 周边</div>
      </header>
      <div className="a-shell">
        <aside className="a-sidebar">
          <div className="a-side-title"><span>我的路线</span><span>25</span></div>
          <div className="a-place active"><strong>罗浮山 · 飞云顶</strong><span>1296m · 高强度</span><i>★</i></div>
          <div className="a-place"><strong>南昆山 · 天堂顶</strong><span>1228m · 高强度</span><i>☆</i></div>
          <div className="a-place"><strong>白云嶂</strong><span>1003m · 高强度</span><i>☆</i></div>
          <div className="a-place"><strong>高榜山</strong><span>229m · 入门</span><i>☆</i></div>
          <div className="a-place"><strong>红花湖环湖</strong><span>48m · 轻量</span><i>☆</i></div>
        </aside>
        <main className="a-main">
          <div className="a-hero">
            <div>
              <p className="a-kicker">BOLUO · HUIZHOU · 1296M</p>
              <h1>罗浮山 · 飞云顶</h1>
              <p>云量适中，午后阵风增强，适合早出发。</p>
            </div>
            <div className="a-temp"><strong>22°</strong><span><b>多云</b>体感 21°</span></div>
          </div>
          <div className="a-pills">
            <span className="a-pill good">适合</span>
            <span className="a-pill">6–8 小时</span>
            <span className="a-pill">暴露 高</span>
            <span className="a-pill">5 个来源</span>
          </div>
          <div className="a-forecast">
            {days.map(([week, date, high, low], index) => (
              <div className={`a-day ${index === 1 ? "active" : ""}`} key={date}>
                <span>周{week} · {date}日</span>
                <strong>{high}</strong>
                <small>{low} · 雨 {index === 5 ? "19" : index === 4 ? "2" : "0"}%</small>
              </div>
            ))}
          </div>
          <div className="a-panels">
            <div className="a-card">
              <div className="a-card-title"><span>天气来源对比</span><em>4 / 5 显示</em></div>
              <div className="a-table">
                <div className="a-cell head">来源</div>
                <div className="a-cell head">周四</div>
                <div className="a-cell head">周五</div>
                <div className="a-cell head">周六</div>
                <div className="a-cell source">ECMWF</div>
                <div className="a-cell"><b>22°</b> / 12°</div>
                <div className="a-cell"><b>23°</b> / 13°</div>
                <div className="a-cell"><b>22°</b> / 10°</div>
                <div className="a-cell source">NOAA GFS</div>
                <div className="a-cell"><b>23°</b> / 11°</div>
                <div className="a-cell"><b>24°</b> / 11°</div>
                <div className="a-cell"><b>24°</b> / 11°</div>
                <div className="a-cell source">DWD ICON</div>
                <div className="a-cell"><b>22°</b> / 13°</div>
                <div className="a-cell"><b>23°</b> / 12°</div>
                <div className="a-cell"><b>23°</b> / 11°</div>
              </div>
            </div>
            <div className="a-card">
              <div className="a-card-title"><span>出发指数</span><em>来源中位数</em></div>
              <div className="a-score">
                <div className="a-ring"><b>88</b></div>
                <div className="a-score-copy"><strong>整体适合</strong><span>雨 0% · 阵风 23 km/h，出发前再看一次短临降水。</span></div>
              </div>
              <div className="a-mini-stats">
                <span>来源置信度<b>中</b></span>
                <span>有效来源<b>5 / 5</b></span>
              </div>
            </div>
          </div>
        </main>
      </div>
      <ChoiceButton variant="A" className="a-choice" onChoose={onChoose} />
    </div>
  );
}

function OptionB({ onChoose }) {
  return (
    <div className="mock opt-b">
      <header className="b-top">
        <div className="b-brand"><span className="b-mark"></span>山候</div>
        <nav className="b-nav"><span className="active">Forecast</span><span>Routes</span><span>Sources</span></nav>
        <div className="b-live">LIVE · 5 SOURCES</div>
      </header>
      <div className="b-shell">
        <aside className="b-side">
          <div className="b-side-label">Candidate trails</div>
          <div className="b-place active"><span className="b-place-dot"></span><strong>罗浮山 · 飞云顶</strong><small>1296</small></div>
          <div className="b-place"><span className="b-place-dot"></span><strong>南昆山 · 天堂顶</strong><small>1228</small></div>
          <div className="b-place"><span className="b-place-dot"></span><strong>白云嶂</strong><small>1003</small></div>
          <div className="b-place"><span className="b-place-dot"></span><strong>银瓶嘴</strong><small>898</small></div>
          <div className="b-place"><span className="b-place-dot"></span><strong>高榜山</strong><small>229</small></div>
          <div className="b-place"><span className="b-place-dot"></span><strong>红花湖环湖</strong><small>48</small></div>
        </aside>
        <main className="b-main">
          <div className="b-header">
            <div>
              <div className="b-index">RIDGE / BOLUO / 23.268N 114.060E</div>
              <h1>罗浮山 · 飞云顶</h1>
              <p>山脊暴露高 · 计划 6–8 小时 · 惠城出发约 1 小时</p>
            </div>
            <div className="b-signal">
              <b>88</b>
              <div className="b-signal-copy"><strong>SUITABLE / 适合</strong><span>RAIN 0% · GUST 23 KM/H</span></div>
            </div>
          </div>
          <div className="b-strip">
            {[
              ["WED 21", "24 / 15", "0%"],
              ["THU 22", "22 / 12", "0%"],
              ["FRI 23", "23 / 13", "0%"],
              ["SAT 24", "22 / 10", "0%"],
              ["SUN 25", "23 / 12", "2%"],
              ["MON 26", "22 / 15", "19%"],
              ["TUE 27", "23 / 15", "6%"],
            ].map(([date, temp, rain], index) => (
              <div className={`b-day ${index === 1 ? "active" : ""}`} key={date}>
                <span>{date}</span><strong>{temp}</strong><small>RAIN {rain}</small>
              </div>
            ))}
          </div>
          <div className="b-grid">
            <section className="b-panel">
              <div className="b-panel-head">SOURCE MATRIX <span>DAY 02 / SELECTED</span></div>
              <div className="b-matrix">
                <div className="b-cell head">SOURCE</div><div className="b-cell head">ECMWF</div><div className="b-cell head">GFS</div><div className="b-cell head">ICON</div><div className="b-cell head">CMA</div>
                <div className="b-cell source">TEMP HIGH</div><div className="b-cell"><b>22°</b></div><div className="b-cell"><b>23°</b></div><div className="b-cell"><b>22°</b></div><div className="b-cell"><b>20°</b></div>
                <div className="b-cell source">RAIN</div><div className="b-cell"><b>0%</b></div><div className="b-cell"><b>0%</b></div><div className="b-cell"><b>0%</b></div><div className="b-cell"><em>N/A</em></div>
                <div className="b-cell source">GUST</div><div className="b-cell"><b>33</b></div><div className="b-cell"><b>16</b></div><div className="b-cell"><b>23</b></div><div className="b-cell"><b>24</b></div>
              </div>
            </section>
            <section className="b-panel">
              <div className="b-panel-head">GO / NO-GO <span>HEURISTIC</span></div>
              <div className="b-conditions">
                <div className="b-condition"><span>降雨概率</span><strong>0%</strong></div>
                <div className="b-condition"><span>最大阵风</span><strong>16–33 KM/H</strong></div>
                <div className="b-condition"><span>最高温度</span><strong>20–23°C</strong></div>
                <div className="b-condition danger"><span>来源分歧</span><strong>MEDIUM</strong></div>
              </div>
            </section>
          </div>
          <div className="b-window-note">
            <span>FIELD WINDOW</span>
            <strong>THU 06:00—14:00</strong>
            <p>低云散开、降雨概率为 0；午后阵风逐步增强，建议中午前完成高暴露山脊段。</p>
            <div className="b-meter"><i></i><i></i><i></i><i></i><i></i></div>
          </div>
        </main>
      </div>
      <ChoiceButton variant="B" className="b-choice" onChoose={onChoose} />
    </div>
  );
}

function OptionC({ onChoose }) {
  return (
    <div className="mock opt-c">
      <header className="c-top">
        <div className="c-brand"><strong>山候</strong><span>TRAIL WEATHER JOURNAL</span></div>
        <nav className="c-nav"><span className="active">本周研判</span><span>地点</span><span>数据源</span></nav>
        <div className="c-topmeta">VOL. 07 · 21 OCT 2026</div>
      </header>
      <div className="c-body">
        <aside className="c-intro">
          <div className="c-edition">Selected place · No. 01</div>
          <h1>罗浮山<span>飞云顶</span></h1>
          <p>云层偏低，山脊风在午后逐渐增强。周六以前是更从容的窗口，出发前仍需复核短临雷达。</p>
          <div className="c-loc">
            <span>海拔<b>1,296 m</b></span>
            <span>强度<b>4 / 5</b></span>
            <span>车程<b>约 1 h</b></span>
          </div>
          <div className="c-verdict"><b>88</b><span><strong>适合出发</strong><br/>5 个来源的共识偏稳定</span></div>
        </aside>
        <main className="c-content">
          <div className="c-section-head"><h2>七日天气窗口</h2><span>温度按山顶海拔修正 · 更新于 12:16</span></div>
          <div className="c-week">
            {[
              ["WED · 21", "24°", "雨 0%"],
              ["THU · 22", "22°", "雨 0%"],
              ["FRI · 23", "23°", "雨 0%"],
              ["SAT · 24", "22°", "雨 0%"],
              ["SUN · 25", "23°", "雨 2%"],
              ["MON · 26", "22°", "雨 19%"],
              ["TUE · 27", "23°", "雨 6%"],
            ].map(([date, temp, rain], index) => (
              <div className={`c-day ${index === 1 ? "active" : ""}`} key={date}>
                <span>{date}</span><strong>{temp}</strong><small>{rain} · 风 23</small>
              </div>
            ))}
          </div>
          <section className="c-ledger">
            <div className="c-ledger-head"><span>预报来源</span><span>周四</span><span>周五</span><span>周六</span><span>周日</span></div>
            {[
              ["ECMWF", "22° / 12°", "23° / 13°", "22° / 10°", "23° / 12°"],
              ["NOAA GFS", "23° / 11°", "24° / 11°", "24° / 11°", "25° / 13°"],
              ["DWD ICON", "22° / 13°", "23° / 12°", "23° / 11°", "22° / 12°"],
              ["CMA GRAPES", "20° / 10°", "22° / 11°", "21° / 9°", "22° / 11°"],
              ["7TIMER / GFS", "22° / 9°", "23° / 9°", "24° / 9°", "24° / 12°"],
            ].map(([source, ...values]) => (
              <div className="c-ledger-row" key={source}>
                <span><strong>{source}</strong><br/><em>{source === "7TIMER / GFS" ? "小雨概率缺失" : "TEMP / WIND"}</em></span>
                {values.map((value, index) => <span key={`${source}-${index}`}>{value}</span>)}
              </div>
            ))}
          </section>
          <div className="c-footnote">
            <div className="c-note"><b>判断</b><span>降雨低、阵风仍在可接受范围。周六前更适合长距离路线。</span></div>
            <div className="c-note"><b>保留意见</b><span>来源之间的阵风跨度 18 km/h，高暴露山脊不宜只看均值。</span></div>
          </div>
        </main>
      </div>
      <ChoiceButton variant="C" className="c-choice" onChoose={onChoose} />
    </div>
  );
}

function StyleLab() {
  const [choice, setChoice] = React.useState(() => {
    try {
      return localStorage.getItem("trailweather.style-choice") || "";
    } catch {
      return "";
    }
  });

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      window.postMessage({ type: "__dc_set_zoom", scale: 0.49 }, "*");
    }, 650);
    return () => window.clearTimeout(timer);
  }, []);

  const choose = (variant) => {
    const nextChoice = choice === variant ? "" : variant;
    setChoice(nextChoice);
    try {
      if (nextChoice) localStorage.setItem("trailweather.style-choice", nextChoice);
      else localStorage.removeItem("trailweather.style-choice");
    } catch {}
  };

  return (
    <>
      <DesignCanvas minScale={0.25} maxScale={1.8}>
        <DCSection
          id="visual-directions"
          title="先选一个视觉方向"
          subtitle="点击右上角放大查看细节；滚轮缩放，拖动画布。三套方案保留相同业务，但颜色、圆角、字体和信息节奏完全不同。"
        >
          <DCArtboard id="clear-sky" label="A · 晴空 / 清透柔和" width={800} height={510}>
            <OptionA onChoose={choose} />
          </DCArtboard>
          <DCArtboard id="trail-instrument" label="B · 测站 / 现代户外" width={800} height={510}>
            <OptionB onChoose={choose} />
          </DCArtboard>
          <DCArtboard id="field-editorial" label="C · 风物 / 编辑克制" width={800} height={510}>
            <OptionC onChoose={choose} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <div className="lab-note">
        <strong>看什么：</strong>先判断颜色、圆角和字体的整体气质，不用被具体文案干扰。选定后我会把“地点筛选、7 天天气、接口状态、账号配置”一并迁移到新视觉。
      </div>

      <div className="lab-toolbar">
        <div className="lab-heading">
          <strong>山候 · 视觉方向提案</strong>
          <span>三套都适合桌面和手机；点击艺术板右上角可放大查看</span>
        </div>
        <div className="lab-actions">
          {Object.entries(STYLE_OPTIONS).map(([key, option]) => (
            <button
              className={`lab-action ${choice === key ? "active" : ""}`}
              key={key}
              onClick={() => choose(key)}
            >
              <span className="lab-action-tag">{key}</span>
              <span>{option.name}</span>
              <span style={{ opacity: 0.55 }}>{option.short}</span>
            </button>
          ))}
        </div>
        <div className="lab-status">
          {choice ? <>已记录方向 <strong>{choice} · {STYLE_OPTIONS[choice].name}</strong><br/>回到对话告诉我“选 {choice}”即可继续。</> : <>先选整体气质；告诉我 A、B 或 C，也可以组合。</>}
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<StyleLab />);


import { useState } from "react";
import "./App.css";

type Ladder = {
  columnCount: number;
  rowCount: number;
  rungs: boolean[][];
  results: string[];
};

type RoutePoint = {
  x: number;
  y: number;
};

const INITIAL_PARTICIPANTS = [
  "あかり",
  "ゆうき",
  "さくら",
  "たくみ",
];

const INITIAL_RESULTS = [
  "大当たり 🎉",
  "幹事担当",
  "次回のお店選び",
  "今日はセーフ！",
];

const ROW_COUNT = 14;
const MAX_PARTICIPANTS = 20;

const randomIndex = (length: number): number =>
  Math.floor(Math.random() * length);

// 配列をシャッフルする。元の配列は変更しない。
function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// 横線の配置を生成する。同じ段に隣接する横線は作らない。
function generateRungs(
  columnCount: number,
  rowCount: number,
): boolean[][] {
  const rungs: boolean[][] = [];

  for (let row = 0; row < rowCount; row++) {
    const rowRungs = Array<boolean>(columnCount - 1).fill(false);

    for (let col = 0; col < columnCount - 1; col++) {
      // ひとつ左に横線があれば、同じ段では連続させない。
      if (col > 0 && rowRungs[col - 1]) {
        continue;
      }

      // 横線を配置する確率。隣接ルールを守りながら生成する。
      rowRungs[col] = Math.random() < 0.35;
    }

    rungs.push(rowRungs);
  }

  return rungs;
}

// 開始位置から横線をたどり、最終的な列番号を返す。
function traceEndpoint(
  startColumn: number,
  rungs: boolean[][],
): number {
  let column = startColumn;

  for (const row of rungs) {
    if (column > 0 && row[column - 1]) {
      column -= 1;
    } else if (column < row.length && row[column]) {
      column += 1;
    }
  }

  return column;
}

// 参加者と結果を対応させるくじ全体を生成する。
function generateLadder(
  participantCount: number,
  resultNames: string[],
): Ladder {
  const rungs = generateRungs(participantCount, ROW_COUNT);

  return {
    columnCount: participantCount,
    rowCount: ROW_COUNT,
    rungs,
    results: shuffle(resultNames),
  };
}

// 参加者の開始位置から、描画用の経路座標を生成する。
function createRoutePoints(
  startColumn: number,
  ladder: Ladder,
  xPositions: number[],
  rowYPositions: number[],
  topY: number,
  bottomY: number,
): RoutePoint[] {
  let column = startColumn;

  const points: RoutePoint[] = [
    { x: xPositions[column], y: topY },
  ];

  ladder.rungs.forEach((row, rowIndex) => {
    const y = rowYPositions[rowIndex];

    // 現在の列に横線があれば、その方向へ移動する。
    let nextColumn = column;

    if (column > 0 && row[column - 1]) {
      nextColumn = column - 1;
    } else if (column < row.length && row[column]) {
      nextColumn = column + 1;
    }

    if (nextColumn !== column) {
      points.push({ x: xPositions[column], y });
      points.push({ x: xPositions[nextColumn], y });
      column = nextColumn;
    }
  });

  points.push({ x: xPositions[column], y: bottomY });

  return points;
}

function App() {
  const [participants, setParticipants] = useState<string[]>(
    INITIAL_PARTICIPANTS,
  );
  const [resultCandidates, setResultCandidates] = useState<string[]>(
    INITIAL_RESULTS,
  );
  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [selectedParticipant, setSelectedParticipant] =
    useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [notice, setNotice] = useState("");
  const [newParticipant, setNewParticipant] = useState("");
  const [newResult, setNewResult] = useState("");
  const [animationId, setAnimationId] = useState(0);

  const participantCount = participants.length;
  const resultCount = resultCandidates.length;

  // 入力内容が変わったら、古いくじを無効にする。
  function invalidateLadder() {
    setLadder(null);
    setSelectedParticipant(null);
    setRevealed(false);
    setNotice("");
  }

  function updateParticipant(index: number, value: string) {
    setParticipants((current) =>
      current.map((name, i) => (i === index ? value : name)),
    );
    invalidateLadder();
  }

  function addParticipant() {
    const name = newParticipant.trim();

    if (!name) {
      setNotice("参加者の名前を入力してください。");
      return;
    }

    if (participants.length >= MAX_PARTICIPANTS) {
      setNotice("参加者は最大20人まで登録できます。");
      return;
    }

    setParticipants((current) => [...current, name]);
    setNewParticipant("");
    invalidateLadder();
  }

  function removeParticipant(index: number) {
    setParticipants((current) =>
      current.filter((_, i) => i !== index),
    );
    invalidateLadder();
  }

  function updateResult(index: number, value: string) {
    setResultCandidates((current) =>
      current.map((name, i) => (i === index ? value : name)),
    );
    invalidateLadder();
  }

  function addResult() {
    const name = newResult.trim();

    if (!name) {
      setNotice("結果候補を入力してください。");
      return;
    }

    if (resultCandidates.length >= MAX_PARTICIPANTS) {
      setNotice("結果候補は最大20個まで登録できます。");
      return;
    }

    setResultCandidates((current) => [...current, name]);
    setNewResult("");
    invalidateLadder();
  }

  function removeResult(index: number) {
    setResultCandidates((current) =>
      current.filter((_, i) => i !== index),
    );
    invalidateLadder();
  }

  function handleGenerate() {
    const names = participants.map((name) => name.trim());
    const results = resultCandidates.map((name) => name.trim());

    if (names.length < 2) {
      setNotice("参加者は2人以上登録してください。");
      return;
    }

    if (names.length > MAX_PARTICIPANTS) {
      setNotice("参加者は20人まで登録できます。");
      return;
    }

    if (results.length < 2) {
      setNotice("結果候補を2個以上登録してください。");
      return;
    }

    if (names.some((name) => !name)) {
      setNotice("参加者の名前が空欄です。入力してください。");
      return;
    }

    if (results.some((name) => !name)) {
      setNotice("結果候補に空欄があります。入力してください。");
      return;
    }

    if (names.length !== results.length) {
      setNotice(
        `人数と結果候補の数が一致していません。参加者 ${names.length}人・結果候補 ${results.length}個です。同じ数に調整してください。`,
      );
      return;
    }

    // 入力値の前後の空白も取り除く。
    setParticipants(names);
    setResultCandidates(results);

    const nextLadder = generateLadder(names.length, results);

    setLadder(nextLadder);
    setSelectedParticipant(null);
    setRevealed(false);
    setNotice("くじが完成しました！名前を選んで結果を確認しましょう。");
    setAnimationId((id) => id + 1);
  }

  function selectParticipant(index: number) {
    if (!ladder) {
      setNotice("先に「あみだくじを作る」を押してください。");
      return;
    }

    setSelectedParticipant(index);
    setRevealed(false);
    setNotice("");
    setAnimationId((id) => id + 1);
  }

  // 同じ経路データから終点と表示座標を計算する。
  const geometry = (() => {
    if (!ladder) {
      return null;
    }

    const width = Math.max(760, ladder.columnCount * 58 + 64);
    const height = 510;
    const topY = 76;
    const ladderTop = 92;
    const bottomY = 424;
    const leftPadding = 32;
    const rightPadding = 32;
    const columnGap =
      (width - leftPadding - rightPadding) /
      (ladder.columnCount - 1);

    const xPositions = Array.from(
      { length: ladder.columnCount },
      (_, i) => leftPadding + i * columnGap,
    );

    const rowYPositions = Array.from(
      { length: ladder.rowCount },
      (_, i) => ladderTop + ((bottomY - ladderTop) / (ladder.rowCount - 1)) * i,
    );

    const endpoints = participants.map((_, index) =>
      traceEndpoint(index, ladder.rungs),
    );

    const selectedEndpoint =
      selectedParticipant === null
        ? null
        : endpoints[selectedParticipant];

    const selectedResult =
      selectedEndpoint === null
        ? ""
        : ladder.results[selectedEndpoint];

    const routePoints =
      selectedParticipant === null
        ? []
        : createRoutePoints(
            selectedParticipant,
            ladder,
            xPositions,
            rowYPositions,
            topY,
            bottomY,
          );

    const routePath = routePoints
      .map((point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
      )
      .join(" ");

    return {
      width,
      height,
      topY,
      ladderTop,
      bottomY,
      xPositions,
      rowYPositions,
      endpoints,
      selectedEndpoint,
      selectedResult,
      routePath,
      routeLength: routePoints.reduce((length, point, index) => {
        if (index === 0) {
          return 0;
        }

        const previous = routePoints[index - 1];

        return (
          length +
          Math.hypot(point.x - previous.x, point.y - previous.y)
        );
      }, 0),
    };
  })();

  return (
    <main className="app">
      <header className="hero">
        <div className="hero-icon" aria-hidden="true">
          🎉
        </div>
        <p className="eyebrow">PARTY TOOL</p>
        <h1>あみだで決めよう！</h1>
        <p className="hero-description">
          飲み会やイベントの担当決めも、ゲーム感覚で楽しく。
        </p>
      </header>

      <section className="panel setup-panel">
        <div className="section-heading">
          <span className="section-number">01</span>
          <div>
            <h2>参加者と結果を登録</h2>
            <p>名前と結果を入力して、くじの準備をしましょう。</p>
          </div>
        </div>

        <div className="editor-grid">
          <div className="editor-card">
            <div className="editor-title">
              <h3>👥 参加者</h3>
              <span className="count">{participantCount}人</span>
            </div>

            <div className="entry-list">
              {participants.map((name, index) => (
                <div className="entry-row" key={`participant-${index}`}>
                  <span className="entry-index">{index + 1}</span>
                  <input
                    aria-label={`参加者 ${index + 1} の名前`}
                    value={name}
                    maxLength={40}
                    onChange={(event) =>
                      updateParticipant(index, event.target.value)
                    }
                    placeholder="名前"
                  />
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`${name || `参加者${index + 1}`}を削除`}
                    onClick={() => removeParticipant(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <form
              className="add-form"
              onSubmit={(event) => {
                event.preventDefault();
                addParticipant();
              }}
            >
              <input
                value={newParticipant}
                onChange={(event) => setNewParticipant(event.target.value)}
                maxLength={40}
                placeholder="名前を追加"
                aria-label="追加する参加者の名前"
              />
              <button className="add-button" type="submit">
                ＋ 追加
              </button>
            </form>
          </div>

          <div className="editor-card">
            <div className="editor-title">
              <h3>🎁 結果候補</h3>
              <span className="count">{resultCount}個</span>
            </div>

            <div className="entry-list">
              {resultCandidates.map((name, index) => (
                <div className="entry-row" key={`result-${index}`}>
                  <span className="entry-index result-index">
                    {index + 1}
                  </span>
                  <input
                    aria-label={`結果候補 ${index + 1}`}
                    value={name}
                    maxLength={60}
                    onChange={(event) =>
                      updateResult(index, event.target.value)
                    }
                    placeholder="結果"
                  />
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`${name || `結果${index + 1}`}を削除`}
                    onClick={() => removeResult(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <form
              className="add-form"
              onSubmit={(event) => {
                event.preventDefault();
                addResult();
              }}
            >
              <input
                value={newResult}
                onChange={(event) => setNewResult(event.target.value)}
                maxLength={60}
                placeholder="結果を追加"
                aria-label="追加する結果"
              />
              <button className="add-button" type="submit">
                ＋ 追加
              </button>
            </form>
          </div>
        </div>

        <div
          className={`count-status ${
            participantCount === resultCount ? "status-ok" : "status-warning"
          }`}
          role="status"
        >
          <span aria-hidden="true">
            {participantCount === resultCount ? "✓" : "！"}
          </span>
          {participantCount === resultCount
            ? `人数と結果の数が一致しています（${participantCount}人）`
            : `参加者 ${participantCount}人・結果候補 ${resultCount}個。数を一致させてください。`}
        </div>

        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}

        <button
          className="primary-button"
          type="button"
          onClick={handleGenerate}
        >
          <span aria-hidden="true">🎲</span>
          あみだくじを作る
        </button>
      </section>

      <section className="panel lottery-panel">
        <div className="section-heading">
          <span className="section-number">02</span>
          <div>
            <h2>あみだくじ</h2>
            <p>くじを作成したら、上の名前をタップしてください。</p>
          </div>
        </div>

        {!ladder || !geometry ? (
          <div className="empty-state">
            <div className="empty-illustration" aria-hidden="true">
              <span>＼</span>
              <span>│</span>
              <span>／</span>
            </div>
            <h3>くじはまだありません</h3>
            <p>参加者と結果を登録して、くじを作ってみましょう。</p>
          </div>
        ) : (
          <>
            <div className="lottery-instructions">
              <span className="instruction-dot" />
              名前を選ぶと、ルートをたどって結果を発表します。
            </div>

            <div
              className="ladder-scroll"
              role="region"
              aria-label="あみだくじ。横方向にスクロールできます"
              tabIndex={0}
            >
              <svg
                className="ladder-svg"
                width={geometry.width}
                height={geometry.height}
                viewBox={`0 0 ${geometry.width} ${geometry.height}`}
                role="img"
                aria-label="参加者から結果までのあみだくじ"
              >
                <defs>
                  <linearGradient
                    id="route-gradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#f06c9b" />
                    <stop offset="100%" stopColor="#8b72e8" />
                  </linearGradient>
                </defs>

                {participants.map((name, index) => {
                  const x = geometry.xPositions[index];
                  const isSelected = selectedParticipant === index;

                  return (
                    <g key={`top-${index}`}>
                      <rect
                        x={x - 24}
                        y={8}
                        width={48}
                        height={40}
                        rx={12}
                        fill={isSelected ? "#ffe1ed" : "#f4f0ff"}
                        stroke={isSelected ? "#ec6192" : "none"}
                      />
                      <text
                        x={x}
                        y={33}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={700}
                        fill="#49405f"
                      >
                        {name.length > 5 ? `${name.slice(0, 5)}…` : name}
                      </text>
                    </g>
                  );
                })}

                {/* 縦線と横線は、判定に使う同じ経路データから描画する。 */}
                {geometry.xPositions.map((x, index) => (
                  <line
                    key={`vertical-${index}`}
                    x1={x}
                    y1={geometry.ladderTop}
                    x2={x}
                    y2={geometry.bottomY}
                    stroke="#b8addd"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                ))}

                {ladder.rungs.map((row, rowIndex) =>
                  row.map((hasRung, colIndex) => {
                    if (!hasRung) {
                      return null;
                    }

                    return (
                      <line
                        key={`rung-${rowIndex}-${colIndex}`}
                        x1={geometry.xPositions[colIndex]}
                        y1={geometry.rowYPositions[rowIndex]}
                        x2={geometry.xPositions[colIndex + 1]}
                        y2={geometry.rowYPositions[rowIndex]}
                        stroke="#b8addd"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                      />
                    );
                  }),
                )}

                {selectedParticipant !== null && (
                  <path
                    key={`route-${animationId}`}
                    d={geometry.routePath}
                    fill="none"
                    stroke="url(#route-gradient)"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={Math.max(geometry.routeLength, 1)}
                    strokeDashoffset={Math.max(geometry.routeLength, 1)}
                    style={
                      {
                        "--route-length": Math.max(
                          geometry.routeLength,
                          1,
                        ),
                      } as React.CSSProperties
                    }
                    className="animated-route"
                    onAnimationEnd={() => setRevealed(true)}
                  />
                )}

                {ladder.results.map((result, index) => {
                  const x = geometry.xPositions[index];
                  const isDestination =
                    geometry.selectedEndpoint === index;

                  return (
                    <g key={`bottom-${index}`}>
                      <circle
                        cx={x}
                        cy={geometry.bottomY}
                        r={5}
                        fill={isDestination ? "#ec6192" : "#8b72e8"}
                      />
                      <rect
                        x={x - 27}
                        y={444}
                        width={54}
                        height={48}
                        rx={10}
                        fill={isDestination ? "#ffe1ed" : "#f4f0ff"}
                        stroke={isDestination ? "#ec6192" : "none"}
                      />
                      <text
                        x={x}
                        y={463}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={700}
                        fill="#49405f"
                      >
                        {result.length > 5
                          ? `${result.slice(0, 5)}…`
                          : result}
                      </text>
                      <text
                        x={x}
                        y={480}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#776d91"
                      >
                        {index + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="scroll-hint">
              ← 横にスクロールできます →
            </p>

            <div className="participant-picker">
              <h3>誰の結果を見る？</h3>
              <div className="participant-buttons">
                {participants.map((name, index) => (
                  <button
                    key={`pick-${index}`}
                    className={`participant-button ${
                      selectedParticipant === index ? "is-selected" : ""
                    }`}
                    type="button"
                    onClick={() => selectParticipant(index)}
                    aria-pressed={selectedParticipant === index}
                  >
                    {name || `参加者${index + 1}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="result-area" aria-live="polite">
              {selectedParticipant === null ? (
                <p className="result-placeholder">
                  👆 参加者を選ぶと、結果がここに表示されます。
                </p>
              ) : revealed ? (
                <>
                  <p className="result-caption">
                    {participants[selectedParticipant]} さんの結果は…
                  </p>
                  <p className="result-value">
                    {geometry.selectedResult}
                  </p>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setSelectedParticipant(null);
                      setRevealed(false);
                    }}
                  >
                    次の人を選ぶ
                  </button>
                </>
              ) : (
                <p className="result-placeholder">
                  ✨ ルートをたどっています…
                </p>
              )}
            </div>
          </>
        )}
      </section>

      <footer className="footer">
        <p>みんなで楽しく、公平に。🎈</p>
        <p>あみだくじ PARTY TOOL</p>
      </footer>
    </main>
  );
}

export default App;
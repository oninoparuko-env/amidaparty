
import "./home.css";

export default function Home() {
  return (
    <main className="home">
      <header className="home-header">
        <p className="home-eyebrow">PARUKO'S TOOLBOX</p>
        <h1>ぱる子の部屋</h1>
        <p className="home-description">
          日々をちょっと便利にする、小さなツール置き場。
        </p>
      </header>

      <section className="tool-section">
        <h2>ツール一覧</h2>

        <a className="tool-card" href="/amidaparty">
          <span className="tool-icon">🎲</span>
          <span className="tool-info">
            <strong>あみだパーティー</strong>
            <span>抽選や順番決めを楽しく簡単に。</span>
          </span>
          <span className="tool-arrow">→</span>
        </a>

       
        <a className="tool-card" href="/schedule">
          <span className="tool-icon">📅</span>
          <span className="tool-info">
            <strong>スケジュール調整</strong>
            <span>みんなの空き時間を集めて、予定を決めよう。</span>
          </span>
          <span className="tool-arrow">→</span>
        </a>

      </section>

      <footer className="home-footer">
        © ぱる子の部屋
      </footer>
    </main>
  );
}

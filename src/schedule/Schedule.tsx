
import { useState } from "react";
import "./schedule.css";

type Slot = {
  id: number;
  date: string;
  time: string;
};

type Participant = {
  id: number;
  name: string;
  answers: Record<number, string>;
};

export default function Schedule() {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [slots, setSlots] = useState<Slot[]>([
    { id: 1, date: "", time: "" },
    { id: 2, date: "", time: "" },
  ]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [created, setCreated] = useState(false);

  const addSlot = () => {
    setSlots((current) => [
      ...current,
      { id: Date.now(), date: "", time: "" },
    ]);
  };

  const updateSlot = (
    id: number,
    field: "date" | "time",
    value: string,
  ) => {
    setSlots((current) =>
      current.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot,
      ),
    );
  };

  const addParticipant = () => {
    const name = participantName.trim();

    if (!name) return;

    setParticipants((current) => [
      ...current,
      { id: Date.now(), name, answers: {} },
    ]);
    setParticipantName("");
  };

  const updateAnswer = (
    participantId: number,
    slotId: number,
    answer: string,
  ) => {
    setParticipants((current) =>
      current.map((participant) =>
        participant.id === participantId
          ? {
              ...participant,
              answers: {
                ...participant.answers,
                [slotId]: answer,
              },
            }
          : participant,
      ),
    );
  };

  const validSlots = slots.filter((slot) => slot.date && slot.time);

  const getCount = (slotId: number, answer: string) =>
    participants.filter(
      (participant) => participant.answers[slotId] === answer,
    ).length;

  const bestSlot = validSlots.reduce<Slot | null>((best, slot) => {
    if (!best) return slot;

    return getCount(slot.id, "○") > getCount(best.id, "○")
      ? slot
      : best;
  }, null);

  return (
    <main className="schedule-page">
      <header className="schedule-header">
        <a className="schedule-back" href="/">
          ← ぱる子の部屋へ戻る
        </a>
        <p className="schedule-eyebrow">SCHEDULE PLANNER</p>
        <h1>みんなの予定、合わせよう。</h1>
        <p>
          候補日を決めて、みんなの都合を見える化しよう。
        </p>
      </header>

      <section className="schedule-panel">
        <h2>1. イベントを作成</h2>

        <label className="schedule-field">
          イベント名
          <input
            value={eventName}
            onChange={(event) => setEventName(event.target.value)}
            placeholder="例：みんなでご飯会"
          />
        </label>

        <label className="schedule-field">
          説明（任意）
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="集合場所や持ち物など"
            rows={3}
          />
        </label>

        <div className="schedule-section-heading">
          <h3>候補日時</h3>
          <button type="button" className="schedule-button secondary" onClick={addSlot}>
            ＋ 候補を追加
          </button>
        </div>

        {slots.map((slot, index) => (
          <div className="schedule-slot-input" key={slot.id}>
            <span className="schedule-slot-number">{index + 1}</span>
            <input
              aria-label={`候補${index + 1}の日付`}
              type="date"
              value={slot.date}
              onChange={(event) =>
                updateSlot(slot.id, "date", event.target.value)
              }
            />
            <input
              aria-label={`候補${index + 1}の時刻`}
              type="time"
              value={slot.time}
              onChange={(event) =>
                updateSlot(slot.id, "time", event.target.value)
              }
            />
          </div>
        ))}

        <button
          type="button"
          className="schedule-button primary"
          onClick={() => setCreated(true)}
          disabled={!eventName.trim() || validSlots.length === 0}
        >
          イベントを表示する
        </button>

        {created && (
          <p className="schedule-notice">
            試作品としてイベントを表示しています。ページを再読み込みするとデータは消えます。
          </p>
        )}
      </section>

      {created && (
        <>
          <section className="schedule-panel">
            <p className="schedule-eyebrow">YOUR EVENT</p>
            <h2>{eventName}</h2>
            {description && <p className="schedule-description">{description}</p>}

            <h3>2. 参加者を追加</h3>
            <p className="schedule-help">
              名前を追加し、各候補日時への参加可否を入力します。
            </p>

            <div className="schedule-add-person">
              <input
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                placeholder="参加者の名前"
                aria-label="参加者の名前"
                onKeyDown={(event) => {
                  if (event.key === "Enter") addParticipant();
                }}
              />
              <button
                type="button"
                className="schedule-button secondary"
                onClick={addParticipant}
              >
                追加
              </button>
            </div>
          </section>

          <section className="schedule-panel">
            <h2>3. 予定を集計</h2>

            {validSlots.length === 0 ? (
              <p>候補日時を入力してください。</p>
            ) : (
              <div className="schedule-results">
                {validSlots.map((slot) => (
                  <div className="schedule-result" key={slot.id}>
                    <div>
                      <strong>{slot.date}</strong>
                      <span>{slot.time}〜</span>
                    </div>
                    <div className="schedule-counts">
                      <span>○ {getCount(slot.id, "○")}</span>
                      <span>△ {getCount(slot.id, "△")}</span>
                      <span>× {getCount(slot.id, "×")}</span>
                    </div>
                    {bestSlot?.id === slot.id && participants.length > 0 && (
                      <span className="schedule-best">現在の最多候補</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {participants.length > 0 && (
              <div className="schedule-table-wrap">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>参加者</th>
                      {validSlots.map((slot) => (
                        <th key={slot.id}>
                          {slot.date}
                          <br />
                          {slot.time}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant) => (
                      <tr key={participant.id}>
                        <th>{participant.name}</th>
                        {validSlots.map((slot) => (
                          <td key={slot.id}>
                            <select
                              aria-label={`${participant.name}・${slot.date}の回答`}
                              value={participant.answers[slot.id] ?? ""}
                              onChange={(event) =>
                                updateAnswer(
                                  participant.id,
                                  slot.id,
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">未回答</option>
                              <option value="○">○</option>
                              <option value="△">△</option>
                              <option value="×">×</option>
                            </select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

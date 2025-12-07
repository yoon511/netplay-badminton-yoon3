"use client";

import { onValue, ref, set } from "firebase/database";
import { Clock, Plus, RotateCcw, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { rtdb } from "../lib/firebase";

type Player = {
  id: number;
  name: string;
  grade: string;
  gender: string;
  playCount: number;
};

type Court = {
  id: number;
  players: Player[];
  startTime: number | null;
};

const DEFAULT_COURTS: Court[] = [
  { id: 1, players: [], startTime: null },
  { id: 2, players: [], startTime: null },
  { id: 3, players: [], startTime: null },
];

const DEFAULT_WAITING: number[][] = [[], [], []];

export default function BadmintonManager({ isAdmin }: { isAdmin: boolean }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<any>(DEFAULT_COURTS);
  const [waitingQueues, setWaitingQueues] = useState<any>(DEFAULT_WAITING);

  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("D");
  const [newGender, setNewGender] = useState("male");

  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  /* 시간 업데이트 */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* Firebase 읽기 */
  useEffect(() => {
    const playersRef = ref(rtdb, "players");
    const courtsRef = ref(rtdb, "courts");
    const waitingRef = ref(rtdb, "waitingQueues");

    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setPlayers([]);

      const arr = Array.isArray(data) ? data : Object.values(data);
      setPlayers(
        arr.filter(Boolean).map((p: any) => ({
          id: p.id ?? Date.now(),
          name: p.name ?? "",
          grade: p.grade ?? "D",
          gender: p.gender ?? "male",
          playCount: p.playCount ?? 0,
        }))
      );
    });

    onValue(courtsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setCourts(DEFAULT_COURTS);

      const arr = Array.isArray(data) ? data : Object.values(data);

      const cleaned = arr
        .filter(Boolean)
        .map((c: any, i: number) => ({
          id: c.id ?? i + 1,
          players: Array.isArray(c.players)
            ? c.players.filter(Boolean)
            : [],
          startTime: typeof c.startTime === "number" ? c.startTime : null,
        }));

      while (cleaned.length < 3)
        cleaned.push({ id: cleaned.length + 1, players: [], startTime: null });

      setCourts(cleaned);
    });

    onValue(waitingRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setWaitingQueues(DEFAULT_WAITING);

      const arr = Array.isArray(data) ? data : Object.values(data);

      const cleaned = arr.map((q: any) =>
        Array.isArray(q) ? q.filter((id) => typeof id === "number") : []
      );

      while (cleaned.length < 3) cleaned.push([]);

      setWaitingQueues(cleaned);
    });
  }, []);

  /* 안전한 형태로 정규화 */
  const safeCourts: Court[] = useMemo(() => {
    const arr = Array.isArray(courts) ? courts : [];

    const cleaned = arr.map((c: any, i: number) => ({
      id: c.id ?? i + 1,
      players: Array.isArray(c.players)
        ? c.players.filter(Boolean)
        : [],
      startTime: typeof c.startTime === "number" ? c.startTime : null,
    }));

    while (cleaned.length < 3)
      cleaned.push({ id: cleaned.length + 1, players: [], startTime: null });

    return cleaned;
  }, [courts]);

  const safeWaitingQueues = useMemo(() => {
    const arr = Array.isArray(waitingQueues) ? waitingQueues : [];

    const cleaned = arr.map((q: any) =>
      Array.isArray(q) ? q.filter((id) => typeof id === "number") : []
    );

    while (cleaned.length < 3) cleaned.push([]);

    return cleaned;
  }, [waitingQueues]);

  const playersInCourts = useMemo(
    () =>
      new Set(
        safeCourts.flatMap((c) =>
          Array.isArray(c.players) ? c.players.map((p) => p.id) : []
        )
      ),
    [safeCourts]
  );

  /* Firebase 저장 */
  const savePlayers = (list: Player[]) => {
    setPlayers(list);
    set(ref(rtdb, "players"), list);
  };

  const saveCourts = (list: Court[]) => {
    setCourts(list);
    set(ref(rtdb, "courts"), list);
  };

  const saveWaiting = (list: number[][]) => {
    const cleaned = list.map((q) =>
      Array.isArray(q) ? q.filter((id) => typeof id === "number") : []
    );
    while (cleaned.length < 3) cleaned.push([]);
    setWaitingQueues(cleaned);
    set(ref(rtdb, "waitingQueues"), cleaned);
  };

  /* 참가자 선택 */
  const togglePlayerSelection = (id: number) => {
    if (!isAdmin) return;

    if (selectedPlayers.includes(id))
      setSelectedPlayers(selectedPlayers.filter((x) => x !== id));
    else if (selectedPlayers.length < 4)
      setSelectedPlayers([...selectedPlayers, id]);
    else alert("최대 4명까지 선택할 수 있습니다.");
  };

  /* 참가자 추가 */
  const addPlayer = () => {
    if (!newName.trim()) return;

    const newPlayer: Player = {
      id: Date.now(),
      name: newName.trim(),
      grade: newGrade,
      gender: newGender,
      playCount: 0,
    };

    savePlayers([...players, newPlayer]);
    setNewName("");
  };

  /* 참가자 삭제 */
  const removePlayer = (id: number) => {
    if (!isAdmin) return;

    const p = players.find((x) => x.id === id);
    if (!p) return;

    if (!confirm(`${p.name}님을 삭제하시겠습니까?`)) return;

    savePlayers(players.filter((x) => x.id !== id));

    saveWaiting(
      safeWaitingQueues.map((q) => q.filter((x) => x !== id))
    );

    setSelectedPlayers(selectedPlayers.filter((x) => x !== id));
  };

  /* 대기열 이동 — 원래 기능 100% 복원 */
  const moveToWaitingQueue = () => {
    if (!isAdmin) return;

    if (selectedPlayers.length === 0)
      return alert("최소 1명 선택해야 합니다.");

    if (selectedPlayers.length > 4)
      return alert("대기열에는 최대 4명까지 등록할 수 있습니다.");

    const playingSelected = selectedPlayers.filter((id) =>
      playersInCourts.has(id)
    );

    if (playingSelected.length > 0) {
      const names = players
        .filter((p) => playingSelected.includes(p.id))
        .map((p) => p.name)
        .join(", ");

      if (!confirm(`${names}님은 플레이 중입니다. 대기열에 추가할까요?`))
        return;
    }

    let newQueues = [...safeWaitingQueues];

    if (selectedPlayers.length >= 3) {
      newQueues.push(selectedPlayers);
      saveWaiting(newQueues);
      setSelectedPlayers([]);
      return;
    }

    const available: number[] = [];
    newQueues.forEach((q, i) => {
      if (q.length === 0 || q.length + selectedPlayers.length <= 4) {
        available.push(i);
      }
    });

    let msg = "대기열을 선택하세요:\n\n";
    available.forEach((idx, i) => {
      msg += `${i + 1}. 대기 ${idx + 1} (${newQueues[idx].length}/4)\n`;
    });
    msg += `${available.length + 1}. 새 대기열 생성\n\n0 = 취소`;

    const choice = prompt(msg);
    if (!choice || choice === "0") return;

    const selected = Number(choice);

    if (selected === available.length + 1) {
      newQueues.push(selectedPlayers);
    } else {
      const target = available[selected - 1];
      if (target == null) return alert("잘못된 번호입니다.");
      newQueues[target] = [...newQueues[target], ...selectedPlayers];
    }

    saveWaiting(newQueues);
    setSelectedPlayers([]);
  };

  /* 대기열 제거 */
  const removeFromWaitingQueue = (id: number, qIndex: number) => {
    if (!isAdmin) return;

    const p = players.find((x) => x.id === id);
    if (!p) return;

    if (!confirm(`${p.name}님을 대기열에서 제거할까요?`)) return;

    let newQueues = [...safeWaitingQueues];
    newQueues[qIndex] = newQueues[qIndex].filter((x) => x !== id);

    saveWaiting(newQueues);
  };

  /* 코트 배정 */
  const assignToCourt = (courtId: number, qIndex: number) => {
    if (!isAdmin) return;

    const queue = safeWaitingQueues[qIndex];
    if (!Array.isArray(queue) || queue.length !== 4) return;

    const assigned = players.filter((p) => queue.includes(p.id));

    const newCourts = safeCourts.map((c) =>
      c.id === courtId
        ? { ...c, players: assigned, startTime: Date.now() }
        : c
    );

    saveCourts(newCourts);

    savePlayers(
      players.map((p) =>
        queue.includes(p.id)
          ? { ...p, playCount: p.playCount + 1 }
          : p
      )
    );

    let newQueues = [...safeWaitingQueues];
    newQueues[qIndex] = [];
    saveWaiting(newQueues);
  };

  /* 코트 비우기 */
  const clearCourt = (courtId: number) => {
    if (!isAdmin) return;

    saveCourts(
      safeCourts.map((c) =>
        c.id === courtId ? { ...c, players: [], startTime: null } : c
      )
    );
  };

  const getElapsedTime = (startTime: number | null) => {
    if (!startTime) return "00:00";

    const diff = Math.floor((currentTime - startTime) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;

    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  /* UI */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F4FF] to-[#D6E8FF] p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-6">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3 items-center">
            <Users className="w-8 h-8 text-[#7DB9FF]" />
            <h1 className="text-3xl font-bold text-[#333333]">
              넷플레이 게임판 - 윤
            </h1>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                if (confirm("전체 초기화하시겠습니까? 모든 DB 데이터가 삭제됩니다.")) {
                  savePlayers([]);
                  saveCourts(DEFAULT_COURTS);
                  saveWaiting(DEFAULT_WAITING);
                }
              }}
              className="px-4 py-2 bg-[#FFB2B2] text-white rounded-lg flex gap-2 items-center"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
          )}
        </div>

        {/* 참가자 등록 */}
        <div className="bg-[#F4F6FA] p-4 rounded-xl mb-6">
          <h2 className="font-bold text-lg mb-3 text-[#333333]">
            참가자 등록 (누구나 가능)
          </h2>

          <div className="flex flex-wrap gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="이름"
              className="border p-2 rounded-lg text-[#333333] font-semibold bg-white"
            />

            <select
              value={newGrade}
              onChange={(e) => setNewGrade(e.target.value)}
              className="border p-2 rounded-lg text-[#333333] font-semibold bg-white"
            >
              <option value="A">A조</option>
              <option value="B">B조</option>
              <option value="C">C조</option>
              <option value="D">D조</option>
              <option value="E">E조</option>
            </select>

            <select
              value={newGender}
              onChange={(e) => setNewGender(e.target.value)}
              className="border p-2 rounded-lg text-[#333333] font-semibold bg-white"
            >
              <option value="male">남자</option>
              <option value="female">여자</option>
            </select>

            <button
              onClick={addPlayer}
              className="px-4 py-2 bg-[#7DB9FF] text-white rounded-lg flex gap-2 items-center"
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          </div>
        </div>

        {/* 전체 참가자 */}
        <h2 className="font-bold text-lg mb-3 text-[#333333]">
          전체 참가자 ({players.length}명)
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {players.map((p) => {
            const isWaiting = safeWaitingQueues.some((q) => q.includes(p.id));
            const isSelected = selectedPlayers.includes(p.id);

            return (
              <div
                key={p.id}
                onClick={() => !isWaiting && isAdmin && togglePlayerSelection(p.id)}
                className={`p-4 rounded-xl border relative transition cursor-pointer
                  ${p.gender === "male"
                    ? "bg-[#D9EDFF] border-[#A7D8FF]"
                    : "bg-[#FFE7EE] border-[#FFD2E1]"}
                  ${isSelected ? "ring-4 ring-[#FFF7B2]" : ""}
                  ${isWaiting ? "opacity-40" : ""}
                `}
              >
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePlayer(p.id);
                    }}
                    className="absolute top-2 right-2 bg-[#FF8A8A] text-white p-1 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                <div className="font-bold text-[#333333]">{p.name}</div>
                <div className="text-sm font-semibold text-[#333333]">
                  {p.grade}조
                </div>
                <div className="text-xs mt-1 font-semibold text-[#333333]">
                  참여: {p.playCount}회
                </div>

                {playersInCourts.has(p.id) && (
                  <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-0.5 rounded">
                    플레이 중
                  </div>
                )}

                {isWaiting && (
                  <div className="absolute top-1 left-1 bg-[#FFC870] text-white text-xs px-2 py-0.5 rounded">
                    대기 중
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 대기 넣기 버튼 */}
        {isAdmin && selectedPlayers.length > 0 && selectedPlayers.length <= 4 && (
          <div className="flex justify-center mb-6">
            <button
              onClick={moveToWaitingQueue}
              className="px-6 py-3 rounded-xl font-bold bg-[#FFC870] text-[#333333]"
            >
              대기 넣기 ({selectedPlayers.length}명)
            </button>
          </div>
        )}

        {/* 대기열 */}
        <h2 className="font-bold text-lg mb-3 text-[#333333]">대기 현황</h2>

        {safeWaitingQueues.map((q, i) => (
          <div
            key={i}
            className="bg-[#FFF7B2] border border-[#FFEFA1] rounded-xl p-4 mb-3"
          >
            <div className="flex justify-between">
              <span className="font-bold text-[#333333]">대기 {i + 1}</span>
              <span className="font-semibold text-[#333333]">
                {q.length}/4명
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {q.map((id) => {
                const p = players.find((x) => x.id === id);
                if (!p) return null;

                return (
                  <div
                    key={id}
                    className={`p-2 rounded text-sm font-semibold relative
                      ${p.gender === "male" ? "bg-[#A7D8FF]" : "bg-[#FFD2E1]"}
                      text-[#333333]`}
                  >
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWaitingQueue(id, i);
                        }}
                        className="absolute top-1 right-1 bg-[#FF8A8A] text-white p-0.5 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {p.name} ({p.grade})
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 코트 */}
        <h2 className="font-bold text-lg mb-3 text-[#333333]">코트 현황</h2>

        {safeCourts.map((court) => (
          <div
            key={court.id}
            className="bg-[#CDEBFF] border border-[#B8E0FF] rounded-xl p-4 mb-3"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-[#333333]">코트 {court.id}</h3>

              {court.startTime && (
                <div className="flex gap-2 items-center">
                  <Clock className="w-4 h-4 text-[#7DB9FF]" />
                  <span className="font-mono font-bold text-[#333333]">
                    {getElapsedTime(court.startTime)}
                  </span>
                </div>
              )}
            </div>

            {!court.players?.length ? (
              <div>
                <div className="text-center text-[#333333] font-semibold mb-2">
                  빈 코트
                </div>

                <div className="flex gap-2">
                  {safeWaitingQueues.map((q, i) => (
                    <button
                      key={i}
                      disabled={!isAdmin || q.length !== 4}
                      onClick={() => assignToCourt(court.id, i)}
                      className={`flex-1 py-2 rounded-xl font-semibold
                        ${
                          q.length !== 4 || !isAdmin
                            ? "bg-gray-300 text-[#333333]"
                            : "bg-[#7DB9FF] text-white"
                        }`}
                    >
                      대기 {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {court.players.map((p) => (
                    <div
                      key={p.id}
                      className={`p-2 rounded text-sm font-semibold
                        ${p.gender === "male" ? "bg-[#A7D8FF]" : "bg-[#FFD2E1]"}
                        text-[#333333]`}
                    >
                      {p.name} ({p.grade})
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => clearCourt(court.id)}
                    className="w-full py-2 bg-[#FF8A8A] text-white rounded-xl"
                  >
                    코트 비우기
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

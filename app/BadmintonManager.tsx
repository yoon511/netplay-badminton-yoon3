"use client";

import { onValue, ref, set } from "firebase/database";
import { Clock, Plus, RotateCcw, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";

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

export default function BadmintonManager({ isAdmin }: { isAdmin: boolean }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("D");
  const [newGender, setNewGender] = useState("male");

  const [courts, setCourts] = useState<Court[]>([
    { id: 1, players: [], startTime: null },
    { id: 2, players: [], startTime: null },
    { id: 3, players: [], startTime: null },
  ]);

  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [waitingQueues, setWaitingQueues] = useState<number[][]>([[], [], []]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 대기열 자동 정리 (최소 3개 유지) ---
  const compactWaitingQueues = (queues: number[][]) => {
    const newQueues = [...queues];
    // 최소 3개의 대기열 유지 (비어있어도 상관없음)
    while (newQueues.length < 3) {
      newQueues.push([]);
    }
    return newQueues;
  };
  // ============================
  // 🔥 Firebase 실시간 데이터 읽기
  // ============================
  useEffect(() => {
    const playersRef = ref(db, "players");
    const courtsRef = ref(db, "courts");
    const waitingRef = ref(db, "waitingQueues");

    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase에서 배열이 객체로 저장될 수 있으므로 배열로 변환
        const playersArray = Array.isArray(data) ? data : Object.values(data);
        setPlayers(playersArray);
      }
    });

    onValue(courtsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase에서 배열이 객체로 저장될 수 있으므로 배열로 변환
        const courtsArray = Array.isArray(data) 
          ? data 
          : Object.values(data).map((court: any) => ({
              ...court,
              players: Array.isArray(court.players) ? court.players : []
            }));
        setCourts(courtsArray);
      }
    });

    onValue(waitingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase에서 배열이 객체로 저장될 수 있으므로 배열로 변환
        let queuesArray = Array.isArray(data)
          ? data
          : Object.values(data).map((q: any) => Array.isArray(q) ? q : []);
        // 최소 3개의 대기열 유지
        while (queuesArray.length < 3) {
          queuesArray.push([]);
        }
        setWaitingQueues(queuesArray);
      }
    });
  }, []);

  // ============================
  // 🔥 Firebase 저장 헬퍼 함수
  // ============================
  const savePlayers = (list: Player[]) => {
    setPlayers(list);
    set(ref(db, "players"), list);
  };

  const saveCourts = (list: Court[]) => {
    setCourts(list);
    set(ref(db, "courts"), list);
  };

  const saveWaiting = (list: number[][]) => {
    setWaitingQueues(list);
    set(ref(db, "waitingQueues"), list);
  };
  // ============================
  // 🟦 참가자 추가
  // ============================
  const addPlayer = () => {
    if (!newName.trim()) return;

    const newPlayer: Player = {
      id: Date.now(),
      name: newName.trim(),
      grade: newGrade,
      gender: newGender,
      playCount: 0,
    };

    const updated = [...players, newPlayer];
    savePlayers(updated);
    setNewName("");
  };

  // ============================
  // 🟥 참가자 삭제
  // ============================
  const removePlayer = (id: number) => {
    if (!isAdmin) return;

    const player = players.find((p) => p.id === id);
    if (!player) return;

    if (!confirm(`${player.name}님을 삭제하시겠습니까?`)) {
      return;
    }

    savePlayers(players.filter((p) => p.id !== id));

    // 대기열에서 제거
    saveWaiting(waitingQueues.map((q) => q.filter((x) => x !== id)));

    // 선택된 플레이어에서도 제거
    setSelectedPlayers(selectedPlayers.filter((x) => x !== id));
  };

  // ============================
  // 🟨 플레이어 선택 (관리자만)
  // ============================
  const togglePlayerSelection = (id: number) => {
    if (!isAdmin) return;

    if (selectedPlayers.includes(id)) {
      setSelectedPlayers(selectedPlayers.filter((x) => x !== id));
    } else if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, id]);
    } else {
      alert("최대 4명까지 선택할 수 있습니다.");
    }
  };

  // ============================
  // 🟧 대기열로 이동
  // ============================
  const moveToWaitingQueue = () => {
    if (!isAdmin) return;
    
    // 1명 이상 4명 이하만 허용
    if (selectedPlayers.length === 0) {
      alert("최소 1명 이상 선택해야 합니다.");
      return;
    }
    
    if (selectedPlayers.length > 4) {
      alert("대기열에는 최대 4명까지 등록할 수 있습니다.");
      return;
    }

    // 플레이 중인 사람이 선택되었는지 확인
    const currentPlayersInCourts = new Set(
      courts
        .filter((court) => court && Array.isArray(court.players))
        .flatMap((court) => court.players.map((p) => p?.id).filter(Boolean))
    );
    
    const playingPlayers = selectedPlayers.filter((id) => currentPlayersInCourts.has(id));
    if (playingPlayers.length > 0) {
      const playingNames = players
        .filter((p) => playingPlayers.includes(p.id))
        .map((p) => p.name)
        .join(", ");
      if (!confirm(`${playingNames}님은 현재 플레이 중입니다. 대기열에 추가하시겠습니까?`)) {
        return;
      }
    }

    // 3명 또는 4명이면 새로운 대기열 생성
    if (selectedPlayers.length >= 3) {
      let newQueues = [...waitingQueues];
      newQueues.push(selectedPlayers);
      saveWaiting(newQueues);
      setSelectedPlayers([]);
      return;
    }

    // 1명 또는 2명이면 팝업으로 선택
    // 추가 가능한 대기열 찾기
    const availableQueues: number[] = [];
    
    // 빈 대기열 찾기
    waitingQueues.forEach((q, index) => {
      if (q && q.length === 0) {
        availableQueues.push(index);
      } else if (q && q.length > 0 && q.length + selectedPlayers.length <= 4) {
        availableQueues.push(index);
      }
    });

    // 선택 옵션 생성
    let options = "대기열을 선택하세요:\n\n";
    availableQueues.forEach((index, i) => {
      const queue = waitingQueues[index];
      const currentCount = queue ? queue.length : 0;
      const queueNum = index + 1;
      if (currentCount === 0) {
        options += `${i + 1}. 대기 ${queueNum} (빈 대기열)\n`;
      } else {
        options += `${i + 1}. 대기 ${queueNum} (${currentCount}/4명, 추가 후 ${currentCount + selectedPlayers.length}/4명)\n`;
      }
    });
    
    // 항상 새로운 대기열 만들기 옵션 제공
    const newQueueOptionNum = availableQueues.length + 1;
    options += `${newQueueOptionNum}. 새로운 대기열 만들기\n`;
    options += `\n취소하려면 0을 입력하세요.`;

    const choice = prompt(options);
    
    if (choice === null || choice === "0") {
      return; // 취소
    }

    const choiceNum = parseInt(choice);
    
    if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > newQueueOptionNum) {
      alert("올바른 번호를 입력해주세요.");
      return;
    }

    let target: number;
    
    // 새로운 대기열 만들기 선택
    if (choiceNum === newQueueOptionNum) {
      let newQueues = [...waitingQueues];
      newQueues.push(selectedPlayers);
      saveWaiting(newQueues);
      setSelectedPlayers([]);
      return;
    }

    // 기존 대기열 선택
    target = availableQueues[choiceNum - 1];
    
    let newQueues = [...waitingQueues];
    
    // 빈 대기열이면 새로 추가, 기존 대기열이면 추가
    if (!waitingQueues[target] || waitingQueues[target].length === 0) {
      newQueues[target] = selectedPlayers;
    } else {
      newQueues[target] = [...waitingQueues[target], ...selectedPlayers];
    }

    // 자동 정리
    newQueues = compactWaitingQueues(newQueues);

    saveWaiting(newQueues);
    setSelectedPlayers([]);
  };

  // ============================
  // 🟥 대기열에서 제거
  // ============================
  const removeFromWaitingQueue = (playerId: number, queueIndex: number) => {
    if (!isAdmin) return;

    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    if (!confirm(`${player.name}님을 대기열에서 제거하시겠습니까?`)) {
      return;
    }

    let newQueues = [...waitingQueues];
    if (!newQueues[queueIndex] || !Array.isArray(newQueues[queueIndex])) {
      return;
    }
    newQueues[queueIndex] = newQueues[queueIndex].filter((id) => id !== playerId);

    // 자동 정리
    newQueues = compactWaitingQueues(newQueues);

    saveWaiting(newQueues);
  };

  // ============================
  // 🟩 대기열 → 코트 투입
  // ============================
  const assignToCourt = (courtId: number, queueIndex: number) => {
    if (!isAdmin) return;

    const queue = waitingQueues[queueIndex];
    if (!queue || !Array.isArray(queue) || queue.length !== 4) return;

    // 다른 코트에서 플레이 중인 사람이 있는지 확인
    const playersInOtherCourts = new Set(
      courts
        .filter((court) => court && court.id !== courtId && Array.isArray(court.players))
        .flatMap((court) => court.players.map((p) => p?.id).filter(Boolean))
    );
    
    const playersInQueue = queue.filter((id) => playersInOtherCourts.has(id));
    if (playersInQueue.length > 0) {
      const playerNames = players
        .filter((p) => playersInQueue.includes(p.id))
        .map((p) => p.name)
        .join(", ");
      alert(`${playerNames}님은 이미 다른 코트에서 플레이 중입니다.`);
      return;
    }

    const assignedPlayers = players.filter((p) => queue.includes(p.id));

    const updatedCourts = courts.map((court) =>
      court.id === courtId
        ? { ...court, players: assignedPlayers, startTime: Date.now() }
        : court
    );

    saveCourts(updatedCourts);

    // 참여 횟수 증가
    const updatedPlayers = players.map((p) =>
      queue.includes(p.id) ? { ...p, playCount: p.playCount + 1 } : p
    );
    savePlayers(updatedPlayers);

    // 대기열 정리
    let newQueues = [...waitingQueues];
    newQueues[queueIndex] = [];
    newQueues = compactWaitingQueues(newQueues);

    saveWaiting(newQueues);
  };

  // ============================
  // 🟥 코트 비우기
  // ============================
  const clearCourt = (courtId: number) => {
    if (!isAdmin) return;

    const updated = courts.map((court) =>
      court.id === courtId ? { ...court, players: [], startTime: null } : court
    );
    saveCourts(updated);
  };

  // ============================
  // ⏱️ 코트 시간 계산
  // ============================
  const getElapsedTime = (startTime: number | null) => {
    if (!startTime) return "00:00";

    const sec = Math.floor((currentTime - startTime) / 1000);
    const min = Math.floor(sec / 60);
    const s = sec % 60;

    return `${min.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  const playersInCourts = new Set(
    courts
      .filter((court) => court && Array.isArray(court.players))
      .flatMap((court) => court.players.map((p) => p?.id).filter(Boolean))
  );
  // ============================
  // 🟦 UI 렌더링
  // ============================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-6">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3 items-center">
            <Users className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-[#333333]">넷플레이 게임판</h1>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                if (confirm("전체 초기화할까요?")) {
                  savePlayers([]);
                  saveCourts([
                    { id: 1, players: [], startTime: null },
                    { id: 2, players: [], startTime: null },
                    { id: 3, players: [], startTime: null },
                  ]);
                  saveWaiting([[], [], []]);
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg flex gap-2 items-center"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
          )}
        </div>

        {/* 참가자 등록 */}
        <div className="bg-gray-100 p-4 rounded-xl mb-6">
          <h2 className="font-bold text-lg mb-3 text-[#333333]">참가자 등록 (누구나 가능)</h2>

          <div className="flex flex-wrap gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="이름"
              className="border p-2 rounded-lg text-[#333333] font-semibold"
            />

            <select
              value={newGrade}
              onChange={(e) => setNewGrade(e.target.value)}
              className="border p-2 rounded-lg text-[#333333] font-semibold"
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
              className="border p-2 rounded-lg text-[#333333] font-semibold"
            >
              <option value="male">남자</option>
              <option value="female">여자</option>
            </select>

            <button
              onClick={addPlayer}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex gap-2 items-center"
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          </div>
        </div>

        {/* 전체 참가자 목록 */}
        <h2 className="font-bold text-lg mb-3 text-[#333333]">전체 참가자 ({players.length}명)</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {players.map((p) => {
            const isWaiting = waitingQueues.some((q) => q.includes(p.id));
            const isSelected = selectedPlayers.includes(p.id);

            return (
              <div
                key={p.id}
                onClick={() => !isWaiting && isAdmin && togglePlayerSelection(p.id)}
                className={`p-4 rounded-xl border relative transition cursor-pointer
                  ${p.gender === "male" ? "bg-blue-100 border-blue-300" : "bg-pink-100 border-pink-300"}
                  ${isSelected ? "ring-4 ring-yellow-400" : ""}
                  ${isWaiting ? "opacity-40" : ""}
                `}
              >
                {/* 삭제 버튼 */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePlayer(p.id);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* 정보 */}
                <div className="font-bold text-[#333333]">{p.name}</div>
                <div className="text-sm font-semibold text-[#333333]">{p.grade}조</div>
                <div className="text-xs mt-1 font-semibold text-[#333333]">참여: {p.playCount}회</div>

                {/* 상태 표시 */}
                {playersInCourts.has(p.id) && (
                  <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded z-20">
                    플레이 중
                  </div>
                )}

                {isWaiting && (
                  <div className="absolute top-1 left-1 bg-orange-500 bg-opacity-70 text-white text-xs px-2 py-0.5 rounded z-20">
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
              className="px-6 py-3 rounded-xl font-bold bg-orange-500 text-white"
            >
              대기 넣기 ({selectedPlayers.length}명)
            </button>
          </div>
        )}

        {/* 대기 & 코트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 대기 */}
          <div>
            <h2 className="font-bold text-lg mb-3 text-[#333333]">대기 현황</h2>

            {(() => {
              // 최소 3개의 대기열 보장
              const displayQueues = [...waitingQueues];
              while (displayQueues.length < 3) {
                displayQueues.push([]);
              }
              return displayQueues;
            })().map((q, i) => (
              <div
                key={i}
                className="bg-orange-100 border border-orange-300 rounded-xl p-4 mb-3"
              >
                <div className="flex justify-between">
                  <span className="font-bold text-[#333333]">대기 {i + 1}</span>
                  <span className="font-semibold text-[#333333]">{q.length}/4명</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {q.map((id) => {
                    const p = players.find((x) => x.id === id);
                    if (!p) return null;

                    return (
                      <div
                        key={p.id}
                        className={`p-2 rounded text-sm font-semibold relative ${
                          p.gender === "male"
                            ? "bg-blue-200 text-[#333333]"
                            : "bg-pink-200 text-[#333333]"
                        }`}
                      >
                        {/* 대기 취소 버튼 */}
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromWaitingQueue(p.id, i);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600"
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
          </div>

          {/* 코트 */}
          <div>
            <h2 className="font-bold text-lg mb-3 text-[#333333]">코트 현황</h2>

            {courts.map((court) => (
              <div
                key={court.id}
                className="bg-green-100 border border-green-300 rounded-xl p-4 mb-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-[#333333]">코트 {court.id}</h3>

                  {court.startTime && (
                    <div className="flex gap-2 items-center">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono font-bold text-[#333333]">
                        {getElapsedTime(court.startTime)}
                      </span>
                    </div>
                  )}
                </div>

                {(!court.players || !Array.isArray(court.players) || court.players.length === 0) ? (
                  <div>
                    <div className="text-center text-[#333333] font-semibold mb-2">빈 코트</div>

                    <div className="flex gap-2">
                      {waitingQueues.map((q, i) => (
                        <button
                          key={i}
                          disabled={!isAdmin || !q || !Array.isArray(q) || q.length !== 4}
                          onClick={() => assignToCourt(court.id, i)}
                          className={`flex-1 py-2 rounded-xl font-semibold ${
                            !isAdmin
                              ? "bg-gray-300 text-[#333333]"
                              : q && Array.isArray(q) && q.length === 4
                              ? "bg-green-600 text-white"
                              : "bg-gray-300 text-[#333333]"
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
                          key={p?.id}
                          className={`p-2 rounded text-sm font-semibold ${
                            p?.gender === "male"
                              ? "bg-blue-200 text-[#333333]"
                              : "bg-pink-200 text-[#333333]"
                          }`}
                        >
                          {p?.name} ({p?.grade})
                        </div>
                      ))}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => clearCourt(court.id)}
                        className="w-full py-2 bg-red-500 text-white rounded-xl"
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

        <p className="text-sm mt-6 text-[#333333] font-semibold">
          관리자 모드: URL 끝에 <b>?admin=yoon511</b> 을 붙이세요.   version 1.0.1
        </p>
      </div>
    </div>
  );
}

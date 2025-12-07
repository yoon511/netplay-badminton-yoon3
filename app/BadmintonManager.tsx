/* 🔵 상단 전체 배경: 파스텔 블루 그라데이션 */
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
              ${
                p.gender === "male"
                  ? "bg-[#D9EDFF] border-[#A7D8FF]"
                  : "bg-[#FFE7EE] border-[#FFD2E1]"
              }
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

    {/* 대기열 */}
    <div>
      <h2 className="font-bold text-lg mb-3 text-[#333333]">대기 현황</h2>

      {safeWaitingQueues.map((q, i) => (
        <div
          key={i}
          className="bg-[#FFF7B2] border border-[#FFEFA1] rounded-xl p-4 mb-3"
        >
          <div className="flex justify-between">
            <span className="font-bold text-[#333333]">대기 {i + 1}</span>
            <span className="font-semibold text-[#333333]">
              {Array.isArray(q) ? q.length : 0}/4명
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {Array.isArray(q) &&
              q.map((id) => {
                const p = players.find((x) => x.id === id);
                if (!p) return null;

                return (
                  <div
                    key={id}
                    className={`p-2 rounded text-sm font-semibold relative ${
                      p.gender === "male"
                        ? "bg-[#A7D8FF]"
                        : "bg-[#FFD2E1]"
                    } text-[#333333]`}
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
    </div>

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

        {!Array.isArray(court.players) || court.players.length === 0 ? (
          <div>
            <div className="text-center text-[#333333] font-semibold mb-2">
              빈 코트
            </div>

            <div className="flex gap-2">
              {safeWaitingQueues.map((q, i) => (
                <button
                  key={i}
                  disabled={!isAdmin || !Array.isArray(q) || q.length !== 4}
                  onClick={() => assignToCourt(court.id, i)}
                  className={`flex-1 py-2 rounded-xl font-semibold ${
                    !isAdmin || !Array.isArray(q) || q.length !== 4
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
                  className={`p-2 rounded text-sm font-semibold ${
                    p.gender === "male"
                      ? "bg-[#A7D8FF]"
                      : "bg-[#FFD2E1]"
                  } text-[#333333]`}
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

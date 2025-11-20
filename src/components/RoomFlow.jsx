import { useState, useEffect } from "react";

const API_BASE = "https://word-chain-server.onrender.com/api";

export default function RoomFlow() {
  // ===== 공통 상태 =====
  // 1 = 국적 선택, 2 = 방 리스트, 3 = 방 안
  const [step, setStep] = useState(1);

  // 화면용 국적: "ko" | "ja"
  const [language, setLanguage] = useState("ko");
  // 서버용 플레이어 타입: "korean" | "japanese"
  const [playerType, setPlayerType] = useState(null);
  // 서버에서 받은 유저 ID
  const [userId, setUserId] = useState(null);

  // ===== 방 관련 상태 =====
  const [rooms, setRooms] = useState([]); // GET /api/rooms 결과
  const [isCreating, setIsCreating] = useState(false);
  const [roomTitleInput, setRoomTitleInput] = useState("");
  const [roomPasswordInput, setRoomPasswordInput] = useState("");
  const [titleError, setTitleError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [selectedRoom, setSelectedRoom] = useState(null); // 입장하려고 고른 방
  const [joinPasswordInput, setJoinPasswordInput] = useState("");

  // 현재 내가 들어간 방(간단 정보: 목록에서 쓰는 형식)
  const [currentRoom, setCurrentRoom] = useState(null); // { roomId, roomName, creatorType, hasPassword }

  // 서버에서 폴링해 온 방 상세 정보 (creatorId, guestId, status, gameId 등)
  const [roomInfo, setRoomInfo] = useState(null);

  // 내가 이 방의 방장인지?
  const [isHost, setIsHost] = useState(false);

  // 방 안 상태: waiting(게임 전) / playing(게임 중) / finished(게임 끝)
  const [roomStage, setRoomStage] = useState("waiting");

  // ===== 게임 관련 상태 =====
  const [gameId, setGameId] = useState(null); // Game 문서의 gameId
  const [gameState, setGameState] = useState(null); // /games/:gameId/status 결과
  const [inputWord, setInputWord] = useState(""); // 입력 단어

  // ===== 유틸 =====

  const getLanguageLabel = (lang) => {
    if (lang === "ko") return "한국인";
    if (lang === "ja") return "일본인";
    return "알 수 없음";
  };

  const getPlayerTypeLabel = (type) => {
    if (type === "korean") return "한국인";
    if (type === "japanese") return "일본인";
    return "알 수 없음";
  };

  const resetAllGameState = () => {
    setGameId(null);
    setGameState(null);
    setRoomStage("waiting");
    setInputWord("");
  };

  const resetRoomAndGame = () => {
    setCurrentRoom(null);
    setRoomInfo(null);
    setIsHost(false);
    resetAllGameState();
  };

  // ===== 1. 국적 선택 & 로그인 =====

  const handleSelectLanguage = async (lang) => {
    setLanguage(lang);
    const type = lang === "ko" ? "korean" : "japanese";

    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerType: type }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "로그인 실패");
        return;
      }

      setPlayerType(data.playerType); // "korean" | "japanese"
      setUserId(data.userId);
      setStep(2); // 방 목록으로 이동
    } catch (e) {
      console.error(e);
      alert("서버 연결 실패 (로그인)");
    }
  };

  const handleChangeLanguage = () => {
    setStep(1);
    setPlayerType(null);
    setUserId(null);
    setRooms([]);
    resetRoomAndGame();
    setIsCreating(false);
    setRoomTitleInput("");
    setRoomPasswordInput("");
    setTitleError("");
    setPasswordError("");
  };

  // ===== 2. 방 목록 가져오기 =====

  const fetchRooms = async () => {
    if (!playerType) return;
    try {
      const res = await fetch(
        `${API_BASE}/rooms?playerType=${encodeURIComponent(playerType)}`
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "방 목록 불러오기 실패");
        return;
      }
      setRooms(data); // [{ roomId, roomName, creatorType, hasPassword }, ...]
    } catch (e) {
      console.error(e);
      alert("방 목록을 불러오는 데 실패했습니다.");
    }
  };

  // step = 2 로 들어갈 때마다 한 번 불러오기
  useEffect(() => {
    if (step === 2 && playerType) {
      fetchRooms();
    }
  }, [step, playerType]);

  const handleRefreshRooms = () => {
    fetchRooms();
  };

  // ===== 3. 방 만들기 =====

  const handleToggleCreateRoom = () => {
    setIsCreating((prev) => !prev);
  };

  const handleRoomTitleChange = (e) => {
    const value = e.target.value;
    setRoomTitleInput(value);

    const length = value.trim().length;
    if (length > 10) {
      setTitleError(
        `제목은 최대 10글자까지 가능합니다. (현재 ${length}글자)`
      );
    } else {
      setTitleError("");
    }
  };

  const handleRoomPasswordChange = (e) => {
    const value = e.target.value;
    setRoomPasswordInput(value);

    if (value && !/^[0-9]*$/.test(value)) {
      setPasswordError("비밀번호는 숫자만 입력 가능합니다.");
    } else if (value.length > 4) {
      setPasswordError("비밀번호는 최대 4자리까지 가능합니다.");
    } else {
      setPasswordError("");
    }
  };

  const handleCreateRoom = async () => {
    const trimmedTitle = roomTitleInput.trim();
    const password = roomPasswordInput;

    if (!trimmedTitle) {
      alert("방 제목을 입력해주세요.");
      return;
    }
    if (trimmedTitle.length > 10) {
      alert("제목은 최대 10글자까지 가능합니다.");
      return;
    }
    if (password) {
      if (!/^[0-9]+$/.test(password) || password.length > 4) {
        alert("비밀번호는 숫자만, 최대 4자리까지 가능합니다.");
        return;
      }
    }
    if (!userId || !playerType) {
      alert("로그인 정보가 없습니다.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/rooms/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          playerType,
          roomName: trimmedTitle,
          password: password || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "방 생성 실패");
        return;
      }

      const newRoom = {
        roomId: data.roomId,
        roomName: trimmedTitle,
        creatorType: playerType,
        hasPassword: !!password,
      };

      setCurrentRoom(newRoom);
      setIsHost(true);
      setIsCreating(false);
      setRoomTitleInput("");
      setRoomPasswordInput("");
      setTitleError("");
      setPasswordError("");
      resetAllGameState();
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("서버 오류 (방 생성)");
    }
  };

  // ===== 4. 방 입장 =====

  const handleSelectRoomForJoin = (room) => {
    setSelectedRoom(room);
    setJoinPasswordInput("");
  };

  const handleJoinRoom = async () => {
    if (!selectedRoom) return;
    if (!userId) {
      alert("로그인 정보가 없습니다.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.roomId,
          userId,
          password: joinPasswordInput || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "입장 실패");
        return;
      }

      setCurrentRoom(selectedRoom);
      setIsHost(false);
      setSelectedRoom(null);
      setJoinPasswordInput("");
      resetAllGameState();
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("서버 오류 (방 입장)");
    }
  };

  const handleLeaveRoom = () => {
    // 서버에 나가기 API는 없으니 프론트 상태만 리셋
    resetRoomAndGame();
    setStep(2);
  };

  // ===== 5. 방 정보 폴링 (게스트 입장 확인, gameId 확인용) =====

  useEffect(() => {
    if (step !== 3 || !currentRoom) {
      setRoomInfo(null);
      return;
    }

    const roomId = currentRoom.roomId;
    let stopped = false;

    const pollRoom = async () => {
      try {
        const res = await fetch(`${API_BASE}/rooms/${roomId}`);
        const data = await res.json();
        if (!res.ok) {
          console.error(data.error || "방 정보 조회 실패");
          return;
        }
        if (stopped) return;

        setRoomInfo(data);

        // 방에 gameId가 생겼는데 프론트에는 아직 없으면 세팅
        if (data.gameId && !gameId) {
          setGameId(data.gameId);
          setRoomStage("playing");
        }
      } catch (e) {
        if (!stopped) console.error("방 폴링 실패:", e);
      }
    };

    pollRoom();
    const intervalId = setInterval(pollRoom, 1000);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
    // gameId는 의도적으로 deps에 안 넣음 (초기 연결용)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentRoom?.roomId]);

  // ===== 6. 게임 시작 (방장만) =====

  const handleGameStart = async () => {
    if (!currentRoom || !userId || !playerType) return;
    if (!isHost) return;

    const roomId = currentRoom.roomId;

    try {
      // 1. 방 정보 가져오기 (creatorId, guestId, creatorType)
      const roomRes = await fetch(`${API_BASE}/rooms/${roomId}`);
      const roomData = await roomRes.json();
      if (!roomRes.ok) {
        alert(roomData.error || "방 정보 조회 실패");
        return;
      }

      if (!roomData.guestId) {
        alert("아직 상대가 입장하지 않았습니다.");
        return;
      }

      // 2. 한국 / 일본 플레이어 ID 결정
      const koreanPlayerId =
        roomData.creatorType === "korean"
          ? roomData.creatorId
          : roomData.guestId;
      const japanesePlayerId =
        roomData.creatorType === "japanese"
          ? roomData.creatorId
          : roomData.guestId;

      // 3. 게임 시작 요청
      const gameRes = await fetch(`${API_BASE}/games/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          koreanPlayerId,
          japanesePlayerId,
        }),
      });

      const gameData = await gameRes.json();
      if (!gameRes.ok) {
        alert(gameData.error || "게임 시작 실패");
        return;
      }

      // 4. 방에 gameId 연결 (게스트가 이걸 보고 따라옴)
      await fetch(`${API_BASE}/rooms/${roomId}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: gameData.gameId }),
      });

      setGameId(gameData.gameId);
      setGameState(gameData.gameData);
      setRoomStage("playing");
    } catch (e) {
      console.error(e);
      alert("서버 오류 (게임 시작)");
    }
  };

  // ===== 7. 게임 상태 폴링 =====

  useEffect(() => {
    if (!gameId || roomStage !== "playing") return;

    let stopped = false;

    const pollGame = async () => {
      try {
        const res = await fetch(`${API_BASE}/games/${gameId}/status`);
        const data = await res.json();
        if (!res.ok) {
          console.error(data.error || "게임 상태 조회 실패");
          return;
        }
        if (stopped) return;

        setGameState(data);

        if (data.status === "finished") {
          setRoomStage("finished");
        }
      } catch (e) {
        if (!stopped) console.error("게임 상태 폴링 실패:", e);
      }
    };

    pollGame();
    const intervalId = setInterval(pollGame, 1000);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, [gameId, roomStage]);

  // ===== 8. 단어 제출 =====

  const handleSubmitWord = async (e) => {
    e.preventDefault();
    const word = inputWord.trim();
    if (!word || !gameId || !gameState) return;
    if (roomStage !== "playing") return;

    if (gameState.currentTurn !== playerType) {
      alert("지금은 내 턴이 아닙니다.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          playerType,
          word,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "단어 제출 실패");
        return;
      }

      setInputWord("");
      setGameState(data.gameData);

      if (data.gameData.status === "finished") {
        setRoomStage("finished");
      }
    } catch (e) {
      console.error(e);
      alert("서버 오류 (단어 제출)");
    }
  };

  // ===== 9. 파생 값들 (화면용) =====

  const myTime =
    gameState && playerType && gameState.timers
      ? Math.max(0, Math.floor(gameState.timers[playerType] ?? 0))
      : null;

  const isMyTurn = gameState?.currentTurn === playerType;

  const currentWordText =
    language === "ko"
      ? gameState?.currentWord?.ko
      : gameState?.currentWord?.ja;

  const winnerType = gameState?.winner;
  const winnerLabel =
    winnerType == null
      ? ""
      : winnerType === playerType
      ? "나"
      : winnerType === "korean"
      ? "한국인"
      : "일본인";

  const timerUnit = language === "ja" ? "秒" : "초";

  // ===== 스타일 =====

  const pageStyle = {
    maxWidth: "900px",
    margin: "20px auto",
    padding: "0 12px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#111827",
  };

  const cardStyle = {
    border: "1px solid #d1d5db",
    padding: "16px",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
    boxShadow: "0 2px 4px rgba(15, 23, 42, 0.06)",
  };

  const buttonStyle = {
    padding: "8px 16px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f3f4f6",
    cursor: "pointer",
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#3b82f6",
    borderColor: "#2563eb",
    color: "white",
  };

  const inputStyle = {
    padding: "8px",
    width: "100%",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
  };

  // ===== 화면 렌더링 =====

  // step 1: 국적 선택
  if (step === 1) {
    return (
      <div style={{ ...pageStyle, textAlign: "center", marginTop: "80px" }}>
        <div style={{ ...cardStyle, maxWidth: "400px", margin: "0 auto" }}>
          <h1 style={{ marginTop: 0 }}>국적 선택</h1>
          <p>한국인인지 일본인인지 선택해주세요.</p>
          <div style={{ marginTop: "16px" }}>
            <button
              onClick={() => handleSelectLanguage("ko")}
              style={{ ...primaryButtonStyle, marginRight: "8px" }}
            >
              한국인
            </button>
            <button
              onClick={() => handleSelectLanguage("ja")}
              style={primaryButtonStyle}
            >
              일본인
            </button>
          </div>
        </div>
      </div>
    );
  }

  // step 2: 방 리스트
  if (step === 2) {
    return (
      <div style={pageStyle}>
        {/* 상단: 내 국적 / 변경 / 방 만들기 */}
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <strong>내 국적: </strong>
            {getLanguageLabel(language)}
            <button
              onClick={handleChangeLanguage}
              style={{ ...buttonStyle, marginLeft: "8px", fontSize: "12px" }}
            >
              변경
            </button>
          </div>
          <button onClick={handleToggleCreateRoom} style={primaryButtonStyle}>
            방 만들기
          </button>
        </div>

        {/* 방 목록 헤더 + 새로고침 */}
        <div
          style={{
            marginBottom: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>방 목록</h2>
          <button
            onClick={handleRefreshRooms}
            style={{ ...buttonStyle, fontSize: "12px" }}
          >
            새로고침
          </button>
        </div>

        {/* 방 리스트 카드 */}
        <div style={{ ...cardStyle, marginBottom: "12px" }}>
          {rooms.length === 0 ? (
            <p>아직 만들어진 방이 없습니다.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {rooms.map((room) => (
                <li
                  key={room.roomId}
                  onClick={() => handleSelectRoomForJoin(room)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    marginBottom: "6px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{room.roomName}</strong>{" "}
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      ({getPlayerTypeLabel(room.creatorType)})
                    </span>
                    {room.hasPassword && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#b91c1c",
                          marginLeft: "6px",
                        }}
                      >
                        🔒 비밀번호
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    대기 중
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 방 입장 카드 */}
        {selectedRoom && (
          <div style={{ ...cardStyle, marginBottom: "12px" }}>
            <h3 style={{ marginTop: 0 }}>방 입장</h3>
            <p>
              선택한 방: <strong>{selectedRoom.roomName}</strong>
            </p>
            <p style={{ fontSize: "12px", color: "#6b7280" }}>
              이 방은 <strong>상대 국적</strong>의 방입니다.
            </p>

            {selectedRoom.hasPassword ? (
              <>
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={joinPasswordInput}
                  onChange={(e) => setJoinPasswordInput(e.target.value)}
                  style={inputStyle}
                />
                <button
                  onClick={handleJoinRoom}
                  style={{ ...primaryButtonStyle, width: "100%" }}
                >
                  입장
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: "12px", color: "#6b7280" }}>
                  이 방은 비밀번호가 없습니다.
                </p>
                <button
                  onClick={handleJoinRoom}
                  style={{ ...primaryButtonStyle, width: "100%" }}
                >
                  바로 입장
                </button>
              </>
            )}
          </div>
        )}

        {/* 방 만들기 카드 */}
        {isCreating && (
          <div style={{ ...cardStyle, marginBottom: "12px" }}>
            <h3 style={{ marginTop: 0 }}>새 방 만들기</h3>
            <input
              type="text"
              placeholder="방 제목 (최대 10글자)"
              value={roomTitleInput}
              onChange={handleRoomTitleChange}
              style={inputStyle}
            />
            {titleError && (
              <p style={{ color: "#b91c1c", fontSize: "12px" }}>{titleError}</p>
            )}

            <input
              type="password"
              placeholder="비밀번호 (숫자 4자리 이내, 선택)"
              value={roomPasswordInput}
              onChange={handleRoomPasswordChange}
              style={{ ...inputStyle, marginTop: "6px" }}
            />
            {passwordError && (
              <p style={{ color: "#b91c1c", fontSize: "12px" }}>
                {passwordError}
              </p>
            )}

            <button
              onClick={handleCreateRoom}
              style={{ ...primaryButtonStyle, width: "100%", marginTop: "4px" }}
            >
              방 생성
            </button>
          </div>
        )}
      </div>
    );
  }

  // step 3: 방 안
  if (step === 3 && currentRoom) {
    return (
      <div style={pageStyle}>
        {/* 방 정보 카드 */}
        <div style={{ ...cardStyle, marginBottom: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <strong>방 이름: </strong>
              {currentRoom.roomName}
            </div>
            <div>
              <strong>내 국적: </strong>
              {getLanguageLabel(language)}
            </div>
            <div>
              <strong>역할: </strong>
              {isHost ? "방장" : "게스트"}
            </div>
            <div>
              <strong>방 상태: </strong>
              {roomInfo?.status || "알 수 없음"}
            </div>
          </div>
        </div>

        {/* 방 안 메인 카드 */}
        <div style={cardStyle}>
          {/* 아직 게임 시작 전 */}
          {roomStage === "waiting" && (
            <div style={{ textAlign: "center" }}>
              <p>
                {isHost
                  ? roomInfo?.guestId
                    ? "상대가 입장했습니다. 게임을 시작할 수 있습니다."
                    : "상대방 기다리는 중..."
                  : "방장이 게임을 시작하기를 기다리는 중..."}
              </p>
              {isHost && (
                <button
                  onClick={handleGameStart}
                  style={primaryButtonStyle}
                  disabled={!roomInfo?.guestId}
                >
                  게임 시작 (방장 전용)
                </button>
              )}
            </div>
          )}

          {/* 게임 진행 중 */}
          {roomStage === "playing" && gameState && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    현재 단어
                  </div>
                  <div style={{ fontWeight: 600, marginTop: "4px" }}>
                    {currentWordText || "아직 단어 없음"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    내 남은 시간
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      marginTop: "4px",
                      color: "#b91c1c",
                    }}
                  >
                    {myTime != null ? myTime : "-"}
                    {timerUnit}
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>턴</div>
                  <div style={{ fontWeight: 600, marginTop: "4px" }}>
                    {isMyTurn ? "내 턴" : "상대 턴"}
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSubmitWord}
                style={{ display: "flex", gap: "8px" }}
              >
                <input
                  type="text"
                  value={inputWord}
                  onChange={(e) => setInputWord(e.target.value)}
                  placeholder="단어를 입력하세요"
                  disabled={!isMyTurn}
                  style={inputStyle}
                />
                <button
                  type="submit"
                  disabled={!isMyTurn}
                  style={{
                    ...primaryButtonStyle,
                    opacity: isMyTurn ? 1 : 0.5,
                    cursor: isMyTurn ? "pointer" : "not-allowed",
                  }}
                >
                  제출
                </button>
              </form>

              <div
                style={{
                  marginTop: "4px",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  maxHeight: "200px",
                  overflowY: "auto",
                  backgroundColor: "#f9fafb",
                }}
              >
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  히스토리
                </div>
                {!gameState.history || gameState.history.length === 0 ? (
                  <p style={{ fontSize: "13px", marginTop: "4px" }}>
                    아직 나온 단어가 없습니다.
                  </p>
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      marginTop: "4px",
                    }}
                  >
                    {gameState.history.map((h, idx) => (
                      <li key={idx} style={{ fontSize: "13px" }}>
                        {idx + 1}. [{getPlayerTypeLabel(h.player)}] {h.word} /{" "}
                        {h.translated}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* 게임 종료 */}
          {roomStage === "finished" && gameState && (
            <div style={{ textAlign: "center" }}>
              <h3>게임 종료</h3>
              <p>
                승자: <strong>{winnerLabel || "알 수 없음"}</strong>
              </p>
              <p style={{ fontSize: "13px", color: "#6b7280" }}>
                (다시 하려면 방을 나갔다가 새로 방을 만들거나 들어가세요.)
              </p>
            </div>
          )}

          {/* 방 나가기 버튼 */}
          <div style={{ marginTop: "16px", textAlign: "right" }}>
            <button onClick={handleLeaveRoom} style={buttonStyle}>
              방 나가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 예외 처리
  return (
    <div style={{ ...pageStyle, textAlign: "center", marginTop: "80px" }}>
      <div style={{ ...cardStyle, maxWidth: "400px", margin: "0 auto" }}>
        <p>오류가 발생했습니다. 처음으로 돌아갑니다.</p>
        <button onClick={() => setStep(1)} style={primaryButtonStyle}>
          처음으로
        </button>
      </div>
    </div>
  );
}

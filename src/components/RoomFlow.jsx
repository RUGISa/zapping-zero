import { useState, useEffect } from "react";

// Render 서버 사용
const API_BASE = "https://word-chain-server.onrender.com/api";

// ===== 한/일 UI 텍스트 =====
const KO_TEXT = {
  // 공통/헤더
  uiToggleToJa: "日本語로 보기",
  uiToggleToKo: "한국어로 보기",

  // 국적 선택 단계
  selectTitle: "국적 선택",
  selectDesc: "한국인인지 일본인인지 선택해주세요.",
  btnKorean: "한국인",
  btnJapanese: "日本人",

  // 방 리스트 단계
  myNationLabel: "내 국적",
  btnChangeNation: "변경",
  roomListTitle: "방 목록",
  btnRefresh: "새로고침",
  noRooms: "아직 만들어진 방이 없습니다.",
  createRoomTitle: "새 방 만들기",
  createRoomBtn: "방 만들기",

  // 방/방 안 정보 라벨
  roomNameLabel: "방 이름",
  roleLabel: "역할",
  roomStatusLabel: "방 상태",
  roomWaitingLabel: "대기 중",

  // 방 입장/생성 관련
  enterRoomTitle: "방 입장",
  selectedRoomLabel: "선택한 방",
  thisIsOppNationRoom: "이 방은 상대 국적의 방입니다.",
  inputPasswordPlaceholder: "비밀번호를 입력하세요",
  btnEnter: "입장",
  noPasswordRoom: "이 방은 비밀번호가 없습니다.",
  btnEnterDirect: "바로 입장",
  roomTitlePlaceholder: "방 제목 (최대 10글자)",
  roomPasswordPlaceholder: "비밀번호 (숫자 4자리 이내, 선택)",

  // 게임
  currentWord: "현재 단어",
  myTime: "내 남은 시간",
  turn: "턴",
  myTurn: "내 턴",
  oppTurn: "상대 턴",
  history: "히스토리",
  noHistory: "아직 나온 단어가 없습니다.",
  nextCharKo: "이어야 할 글자 (한국어)",
  nextCharJa: "이어야 할 글자 (일본어)",
  waitingHost: "방장이 게임을 시작하기를 기다리는 중...",
  waitingGuest: "상대방 기다리는 중...",
  startGame: "게임 시작 (방장 전용)",
  gameOver: "게임 종료",
  winner: "승자",
  leaveRoom: "방 나가기",
};

const JA_TEXT = {
  // 공통/헤더
  uiToggleToJa: "日本語で表示",
  uiToggleToKo: "한국어で表示",

  // 국적 선택 단계
  selectTitle: "国籍を選択",
  selectDesc: "韓国人か日本人かを選んでください。",
  btnKorean: "韓国人",
  btnJapanese: "日本人",

  // 방 리스트 단계
  myNationLabel: "自分の国籍",
  btnChangeNation: "変更",
  roomListTitle: "部屋リスト",
  btnRefresh: "更新",
  noRooms: "まだ部屋がありません。",
  createRoomTitle: "新しい部屋を作成",
  createRoomBtn: "部屋作成",

  // 방/방 안 정보 라벨
  roomNameLabel: "部屋名",
  roleLabel: "役割",
  roomStatusLabel: "部屋状態",
  roomWaitingLabel: "待機中",

  // 방 입장/생성 관련
  enterRoomTitle: "部屋に入る",
  selectedRoomLabel: "選択した部屋",
  thisIsOppNationRoom: "この部屋は相手の国籍の部屋です。",
  inputPasswordPlaceholder: "パスワードを入力してください",
  btnEnter: "入室",
  noPasswordRoom: "この部屋にはパスワードがありません。",
  btnEnterDirect: "すぐ入室",
  roomTitlePlaceholder: "部屋名（最大10文字）",
  roomPasswordPlaceholder:
    "パスワード（数字4桁まで、未入力でも可）",

  // 게임
  currentWord: "現在の単語",
  myTime: "自分の残り時間",
  turn: "ターン",
  myTurn: "自分のターン",
  oppTurn: "相手のターン",
  history: "履歴",
  noHistory: "まだ単語がありません。",
  nextCharKo: "次の頭文字（韓国語）",
  nextCharJa: "次の頭文字（日本語）",
  waitingHost: "ホストがゲームを開始するのを待っています…",
  waitingGuest: "相手を待っています…",
  startGame: "ゲーム開始（ホストのみ）",
  gameOver: "ゲーム終了",
  winner: "勝者",
  leaveRoom: "部屋から退出",
};

// ===== 힌트 계산 유틸 =====

// 한국어: 마지막 글자 1개
const getKoreanNextChar = (word) => {
  if (!word) return null;
  const trimmed = word.trim();
  if (!trimmed) return null;
  return trimmed[trimmed.length - 1];
};

// 일본어: 복합음/장음/촉음 규칙 + 가나만 추출
//  - 원본문자에서 가나(ひらがな/カタカナ/ー)만 추출
//  - 작은ゃ/ゅ/ょ/… 로 끝나면: 앞글자 / 작은글자  → しゅ → し / ゅ
//  - 장음(ー)으로 끝나면: 앞글자의 모음에 따라 あ/い/う/え/お → レー → レ / え
//  - 촉음(っ/ッ)으로 끝나면: 그 전 글자만 → きっと → と
//  - 그 외: 마지막 글자 하나만 → オレンジ → ジ
const isKana = (ch) => !!ch && /[ぁ-ゟ゠-ヿー]/.test(ch);

// 모음 판별용 그룹
const VOWEL_A =
  "あかさたなはまやらわがざだばぱぁゃァャアカサタナハマヤラワガザダバパ";
const VOWEL_I =
  "いきしちにひみりぎじぢびぴぃィイキシチニヒミリギジヂビピ";
const VOWEL_U =
  "うくすつぬふむゆるゔぐずづぶぷぅゅゥュウクスツヌフムユルヴグズヅブプ";
const VOWEL_E =
  "えけせてねへめれげぜでべぺぇエケセテネヘメレゲゼデベペェれレ";
const VOWEL_O =
  "おこそとのほもよろをごぞどぼぽぉょオコソトノホモヨロヲゴゾドボポォョ";

// base 가 어떤 모음인지 보고, 그 모음에 해당하는 히라가나(あ/い/う/え/お) 리턴
const getVowelHiragana = (ch) => {
  if (!ch) return null;
  if (VOWEL_A.includes(ch)) return "あ";
  if (VOWEL_I.includes(ch)) return "い";
  if (VOWEL_U.includes(ch)) return "う";
  if (VOWEL_E.includes(ch)) return "え";
  if (VOWEL_O.includes(ch)) return "お";
  return null;
};

// 복합음용 작은 글자들
const SMALL_KANA = "ゃゅょャュョァィゥェォヮ";
// 장음, 촉음
const LONG_MARK = "ー";
const SOKUON = "っッ";

const getJapaneseNextChars = (word) => {
  if (!word) return { first: null, second: null };

  // 가나만 추출 (한자, 괄호, 알파벳 등 제거)
  // 예: "無知(むち)" -> "むち", "ボカロ(ぼかろ)" -> "ぼかろ"
  const kanaOnly = word.replace(/[^ぁ-ゟ゠-ヿー]/g, "");
  const trimmed = kanaOnly.trim();
  const len = trimmed.length;
  if (len === 0) return { first: null, second: null };

  let first = null;
  let second = null;
  const last = trimmed[len - 1];

  // 1) 마지막이 작은ゃ/ゅ/ょ/… 인 경우 → 앞글자 / 작은글자
  if (SMALL_KANA.includes(last)) {
    const base = len >= 2 ? trimmed[len - 2] : null;
    if (isKana(base)) first = base;
    if (isKana(last)) second = last;
    return { first, second };
  }

  // 2) 마지막이 장음(ー)인 경우 → 앞글자의 모음에 따라 あ/い/う/え/お
  if (LONG_MARK.includes(last)) {
    const base = len >= 2 ? trimmed[len - 2] : null;
    if (isKana(base)) {
      first = base;
      const vowel = getVowelHiragana(base);
      second = vowel; // 모음이 없으면 null
      return { first, second };
    }
    return { first: null, second: null };
  }

  // 3) 마지막이 촉음(っ/ッ)인 경우 → 그 전 글자만 사용
  if (SOKUON.includes(last)) {
    const base = len >= 2 ? trimmed[len - 2] : null;
    if (isKana(base)) return { first: base, second: null };
    return { first: null, second: null };
  }

  // 4) 그 외: 마지막 글자 하나만 사용
  if (isKana(last)) {
    return { first: null, second: last };
  }

  return { first: null, second: null };
};

export default function RoomFlow() {
  // 1 = 국적 선택, 2 = 방 리스트, 3 = 방 안
  const [step, setStep] = useState(1);

  // UI 언어: "ko" | "ja"
  const [language, setLanguage] = useState("ko");
  // 서버용 플레이어 타입: "korean" | "japanese"
  const [playerType, setPlayerType] = useState(null);
  const [userId, setUserId] = useState(null);

  // 방 목록 / 선택
  const [rooms, setRooms] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [roomTitleInput, setRoomTitleInput] = useState("");
  const [roomPasswordInput, setRoomPasswordInput] = useState("");
  const [titleError, setTitleError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [joinPasswordInput, setJoinPasswordInput] = useState("");

  // 현재 들어간 방
  const [currentRoom, setCurrentRoom] = useState(null); // { roomId, roomName, creatorType, hasPassword }
  const [roomInfo, setRoomInfo] = useState(null); // /rooms/:id 폴링 결과
  const [isHost, setIsHost] = useState(false);

  // 방 안 상태: waiting / playing / finished
  const [roomStage, setRoomStage] = useState("waiting");

  // 게임 상태
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null); // /games/:id/status
  const [inputWord, setInputWord] = useState("");

  // ===== 공통 유틸 =====
  const getPlayerTypeLabel = (type) => {
    if (type === "korean")
      return language === "ja" ? "韓国人" : "한국인";
    if (type === "japanese")
      return language === "ja" ? "日本人" : "일본인";
    return language === "ja" ? "不明" : "알 수 없음";
  };

  const resetGameStateAll = () => {
    setGameId(null);
    setGameState(null);
    setRoomStage("waiting");
    setInputWord("");
  };

  const resetRoomAndGame = () => {
    setCurrentRoom(null);
    setRoomInfo(null);
    setIsHost(false);
    resetGameStateAll();
  };

  // 현재 UI 텍스트 세트
  const T = language === "ko" ? KO_TEXT : JA_TEXT;

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

      setPlayerType(data.playerType);
      setUserId(data.userId);
      setStep(2);
    } catch (e) {
      console.error(e);
      alert("서버 연결 실패 (로그인)");
    }
  };

  // 국적/로그인 상태를 전부 초기화하고 처음으로 돌아가기
  const handleChangeLanguageAll = () => {
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
    setLanguage("ko");
  };

  // 페이지 오른쪽 위 UI 언어 토글 (한국어 <-> 일본어)
  const handleToggleUiLanguage = () => {
    setLanguage((prev) => (prev === "ko" ? "ja" : "ko"));
  };

  // ===== 2. 방 목록 =====
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
      setRooms(data);
    } catch (e) {
      console.error(e);
      alert("방 목록을 불러오는 데 실패했습니다.");
    }
  };

  useEffect(() => {
    if (step === 2 && playerType) {
      fetchRooms();
    }
  }, [step, playerType]);

  const handleRefreshRooms = () => {
    fetchRooms();
  };

  // ===== 방 만들기 =====
  const handleToggleCreateRoom = () => {
    setIsCreating((prev) => !prev);
  };

  const handleRoomTitleChange = (e) => {
    const value = e.target.value;
    setRoomTitleInput(value);
    const length = value.trim().length;
    if (length > 10) {
      setTitleError(`제목은 최대 10글자까지 가능합니다. (현재 ${length}글자)`);
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
      resetGameStateAll();
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("서버 오류 (방 생성)");
    }
  };

  // ===== 방 입장 =====
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
      resetGameStateAll();
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("서버 오류 (방 입장)");
    }
  };

  const handleLeaveRoom = () => {
    // 서버랑 방 삭제 연동은 나중에 맞추고,
    // 일단 프론트 상태만 초기화
    resetRoomAndGame();
    setStep(2);
  };

  // ===== 3. 방 정보 폴링 =====
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentRoom?.roomId]);

  // ===== 게임 시작 (1판) =====
  const handleGameStart = async () => {
    if (!currentRoom || !userId || !playerType) return;
    if (!isHost) return;

    const roomId = currentRoom.roomId;

    try {
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

      const koreanPlayerId =
        roomData.creatorType === "korean"
          ? roomData.creatorId
          : roomData.guestId;
      const japanesePlayerId =
        roomData.creatorType === "japanese"
          ? roomData.creatorId
          : roomData.guestId;

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

  // ===== 게임 상태 폴링 =====
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

  // ===== 단어 제출 =====
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

  // ===== 파생 값 (표시용) =====
  const myTime =
    gameState && playerType && gameState.timers
      ? Math.max(0, Math.floor(gameState.timers[playerType] ?? 0))
      : null;

  const isMyTurn = gameState?.currentTurn === playerType;

  const winnerType = gameState?.winner;
  const winnerLabel =
    winnerType == null
      ? ""
      : winnerType === playerType
      ? "나"
      : winnerType === "korean"
      ? (language === "ja" ? "韓国人" : "한국인")
      : (language === "ja" ? "日本人" : "일본인");

  const timerUnit = language === "ja" ? "秒" : "초";

  const nextKoChar = getKoreanNextChar(gameState?.currentWord?.ko);
  const { first: nextJaFirst, second: nextJaSecond } = getJapaneseNextChars(
    gameState?.currentWord?.ja || ""
  );

  // 현재 턴 기준으로 어떤 힌트를 보여줄지
  const showKoHint = gameState?.currentTurn === "korean";
  const showJaHint = gameState?.currentTurn === "japanese";

  // ===== 스타일 =====
  const pageStyle = {
    maxWidth: "900px",
    margin: "20px auto",
    padding: "0 12px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystem, 'Segoe UI', sans-serif",
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

  // ===== 렌더링 =====

  // 1단계: 국적 선택
  if (step === 1) {
    return (
      <div style={{ ...pageStyle, position: "relative" }}>
        {/* 오른쪽 위 번역 버튼 */}
        <button
          onClick={handleToggleUiLanguage}
          style={{
            ...buttonStyle,
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 100,
          }}
        >
          {language === "ko" ? T.uiToggleToJa : T.uiToggleToKo}
        </button>

        <div style={{ textAlign: "center", marginTop: "80px" }}>
          <div style={{ ...cardStyle, maxWidth: "400px", margin: "0 auto" }}>
            <h1 style={{ marginTop: 0 }}>{T.selectTitle}</h1>
            <p>{T.selectDesc}</p>
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={() => handleSelectLanguage("ko")}
                style={{ ...primaryButtonStyle, marginRight: "8px" }}
              >
                {T.btnKorean}
              </button>
              <button
                onClick={() => handleSelectLanguage("ja")}
                style={primaryButtonStyle}
              >
                {T.btnJapanese}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2단계: 방 리스트
  if (step === 2) {
    return (
      <div style={{ ...pageStyle, position: "relative" }}>
        {/* 오른쪽 위 번역 버튼 */}
        <button
          onClick={handleToggleUiLanguage}
          style={{
            ...buttonStyle,
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 100,
          }}
        >
          {language === "ko" ? T.uiToggleToJa : T.uiToggleToKo}
        </button>

        {/* 상단 바 */}
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <strong>{T.myNationLabel}: </strong>
            {getPlayerTypeLabel(playerType)}
            <button
              onClick={handleChangeLanguageAll}
              style={{ ...buttonStyle, marginLeft: "8px", fontSize: "12px" }}
            >
              {T.btnChangeNation}
            </button>
          </div>
          <button onClick={handleToggleCreateRoom} style={primaryButtonStyle}>
            {T.createRoomBtn}
          </button>
        </div>

        {/* 방 목록 헤더 */}
        <div
          style={{
            marginBottom: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>{T.roomListTitle}</h2>
          <button
            onClick={handleRefreshRooms}
            style={{ ...buttonStyle, fontSize: "12px" }}
          >
            {T.btnRefresh}
          </button>
        </div>

        {/* 방 리스트 */}
        <div style={{ ...cardStyle, marginBottom: "12px" }}>
          {rooms.length === 0 ? (
            <p>{T.noRooms}</p>
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
                        🔒
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    {T.roomWaitingLabel}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 방 입장 */}
        {selectedRoom && (
          <div style={{ ...cardStyle, marginBottom: "12px" }}>
            <h3 style={{ marginTop: 0 }}>{T.enterRoomTitle}</h3>
            <p>
              {T.selectedRoomLabel}:{" "}
              <strong>{selectedRoom.roomName}</strong>
            </p>
            <p style={{ fontSize: "12px", color: "#6b7280" }}>
              {T.thisIsOppNationRoom}
            </p>

            {selectedRoom.hasPassword ? (
              <>
                <input
                  type="password"
                  placeholder={T.inputPasswordPlaceholder}
                  value={joinPasswordInput}
                  onChange={(e) => setJoinPasswordInput(e.target.value)}
                  style={inputStyle}
                />
                <button
                  onClick={handleJoinRoom}
                  style={{ ...primaryButtonStyle, width: "100%" }}
                >
                  {T.btnEnter}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: "12px", color: "#6b7280" }}>
                  {T.noPasswordRoom}
                </p>
                <button
                  onClick={handleJoinRoom}
                  style={{ ...primaryButtonStyle, width: "100%" }}
                >
                  {T.btnEnterDirect}
                </button>
              </>
            )}
          </div>
        )}

        {/* 방 만들기 */}
        {isCreating && (
          <div style={{ ...cardStyle, marginBottom: "12px" }}>
            <h3 style={{ marginTop: 0 }}>{T.createRoomTitle}</h3>
            <input
              type="text"
              placeholder={T.roomTitlePlaceholder}
              value={roomTitleInput}
              onChange={handleRoomTitleChange}
              style={inputStyle}
            />
            {titleError && (
              <p style={{ color: "#b91c1c", fontSize: "12px" }}>{titleError}</p>
            )}

            <input
              type="password"
              placeholder={T.roomPasswordPlaceholder}
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
              {T.createRoomBtn}
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3단계: 방 안
  if (step === 3 && currentRoom) {
    return (
      <div style={{ ...pageStyle, position: "relative" }}>
        {/* 오른쪽 위 번역 버튼 */}
        <button
          onClick={handleToggleUiLanguage}
          style={{
            ...buttonStyle,
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 100,
          }}
        >
          {language === "ko" ? T.uiToggleToJa : T.uiToggleToKo}
        </button>

        {/* 방 정보 (가로 배치) */}
        <div style={{ ...cardStyle, marginBottom: "12px" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div>
              <strong>{T.roomNameLabel}: </strong>
              {currentRoom.roomName}
            </div>
            <div>
              <strong>{T.myNationLabel}: </strong>
              {getPlayerTypeLabel(playerType)}
            </div>
            <div>
              <strong>{T.roleLabel}: </strong>
              {isHost
                ? language === "ja"
                  ? "ホスト"
                  : "방장"
                : language === "ja"
                ? "ゲスト"
                : "게스트"}
            </div>
            <div>
              <strong>{T.roomStatusLabel}: </strong>
              {roomInfo?.status ||
                (language === "ja" ? "不明" : "알 수 없음")}
            </div>
          </div>
        </div>

        {/* 방 안 메인 */}
        <div style={cardStyle}>
          {/* 게임 전 */}
          {roomStage === "waiting" && (
            <div style={{ textAlign: "center" }}>
              <p>
                {isHost
                  ? roomInfo?.guestId
                    ? language === "ja"
                      ? "相手が入室しました。ゲームを開始できます。"
                      : "상대가 입장했습니다. 게임을 시작할 수 있습니다."
                    : T.waitingGuest
                  : T.waitingHost}
              </p>
              {isHost && (
                <button
                  onClick={handleGameStart}
                  style={primaryButtonStyle}
                  disabled={!roomInfo?.guestId}
                >
                  {T.startGame}
                </button>
              )}
            </div>
          )}

          {/* 게임 중 (1판) */}
          {roomStage === "playing" && gameState && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* 상단 정보 3개 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "8px",
                }}
              >
                {/* 현재 단어 (KO/JA 같이) */}
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {T.currentWord}
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "13px" }}>
                    <div>
                      <strong>KO:</strong>{" "}
                      {gameState?.currentWord?.ko || "-"}
                    </div>
                    <div>
                      <strong>JA:</strong>{" "}
                      {gameState?.currentWord?.ja || "-"}
                    </div>
                  </div>
                </div>

                {/* 내 남은 시간 */}
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {T.myTime}
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

                {/* 턴 */}
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {T.turn}
                  </div>
                  <div style={{ fontWeight: 600, marginTop: "4px" }}>
                    {isMyTurn ? T.myTurn : T.oppTurn}
                  </div>
                </div>
              </div>

              {/* 이어야 할 글자 힌트 – 현재 턴에 따라 한쪽만 */}
              {(showKoHint || showJaHint) && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "8px",
                  }}
                >
                  {showKoHint && (
                    <div
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{ fontSize: "12px", color: "#6b7280" }}
                      >
                        {T.nextCharKo}
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          marginTop: "4px",
                        }}
                      >
                        {nextKoChar || "-"}
                      </div>
                    </div>
                  )}

                  {showJaHint && (
                    <div
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{ fontSize: "12px", color: "#6b7280" }}
                      >
                        {T.nextCharJa}
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          marginTop: "4px",
                        }}
                      >
                        {nextJaFirst || nextJaSecond
                          ? `${nextJaFirst || ""}${
                              nextJaFirst && nextJaSecond ? " / " : ""
                            }${nextJaSecond || ""}`
                          : "-"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 입력 폼 */}
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

              {/* 히스토리 (강화 버전) */}
              <div
                style={{
                  marginTop: "4px",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  maxHeight: "240px",
                  overflowY: "auto",
                  backgroundColor: "#f9fafb",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  {T.history}
                </div>
                {!gameState.history || gameState.history.length === 0 ? (
                  <p style={{ fontSize: "13px", marginTop: "4px" }}>
                    {T.noHistory}
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {gameState.history.map((h, idx) => {
                      const isMine = h.player === playerType;
                      const playerLabel = getPlayerTypeLabel(h.player);

                      const wordLang =
                        h.player === "korean"
                          ? language === "ja"
                            ? "韓国語"
                            : "한국어"
                          : language === "ja"
                          ? "日本語"
                          : "일본어";

                      const translatedLang =
                        h.player === "korean"
                          ? language === "ja"
                            ? "日本語"
                            : "일본어"
                          : language === "ja"
                          ? "韓国語"
                          : "한국어";

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: "6px 8px",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                            backgroundColor: isMine
                              ? "#eff6ff"
                              : "#ffffff",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12px",
                              marginBottom: "2px",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                color: "#4b5563",
                              }}
                            >
                              #{idx + 1} · {playerLabel}
                            </span>
                            <span
                              style={{
                                padding: "0 6px",
                                borderRadius: "999px",
                                border: "1px solid #d1d5db",
                                fontSize: "11px",
                                backgroundColor: isMine
                                  ? "#dbeafe"
                                  : "#f3f4f6",
                              }}
                            >
                              {isMine
                                ? language === "ja"
                                  ? "自分"
                                  : "나"
                                : language === "ja"
                                ? "相手"
                                : "상대"}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            <div>
                              <strong>{wordLang}:</strong> {h.word}
                            </div>
                            <div>
                              <strong>{translatedLang}:</strong>{" "}
                              {h.translated}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 게임 종료 */}
          {roomStage === "finished" && gameState && (
            <div style={{ textAlign: "center" }}>
              <h3>{T.gameOver}</h3>
              <p>
                {T.winner}:{" "}
                <strong>{winnerLabel || "결과를 불러오지 못했습니다."}</strong>
              </p>
              <p style={{ fontSize: "13px", color: "#6b7280" }}>
                (다시 하려면 방을 나갔다가 새 방을 만들거나 입장해주세요.)
              </p>
            </div>
          )}

          {/* 방 나가기 */}
          <div style={{ marginTop: "16px", textAlign: "right" }}>
            <button onClick={handleLeaveRoom} style={buttonStyle}>
              {T.leaveRoom}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 안전망
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

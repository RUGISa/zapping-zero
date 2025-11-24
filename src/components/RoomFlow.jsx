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
  oppTime: "상대 남은 시간",
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

  // 규칙 보기
  showRules: "규칙 보기",
  close: "닫기",
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
  oppTime: "相手の残り時間",
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

  // 규칙 보기
  showRules: "ルールを見る",
  close: "閉じる",
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
const isKana = (ch) => !!ch && /[ぁ-ゟ゠-ヿー]/.test(ch);

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

const getVowelHiragana = (ch) => {
  if (!ch) return null;
  if (VOWEL_A.includes(ch)) return "あ";
  if (VOWEL_I.includes(ch)) return "い";
  if (VOWEL_U.includes(ch)) return "う";
  if (VOWEL_E.includes(ch)) return "え";
  if (VOWEL_O.includes(ch)) return "お";
  return null;
};

const SMALL_KANA = "ゃゅょャュョァィゥェォヮ";
const LONG_MARK = "ー";
const SOKUON = "っッ";

const getJapaneseNextChars = (word) => {
  if (!word) return { first: null, second: null };

  const kanaOnly = word.replace(/[^ぁ-ゟ゠-ヿー]/g, "");
  const trimmed = kanaOnly.trim();
  const len = trimmed.length;
  if (len === 0) return { first: null, second: null };

  let first = null;
  let second = null;
  const last = trimmed[len - 1];

  if (SMALL_KANA.includes(last)) {
    const base = len >= 2 ? trimmed[len - 2] : null;
    if (isKana(base)) first = base;
    if (isKana(last)) second = last;
    return { first, second };
  }

  if (LONG_MARK.includes(last)) {
    const base = len >= 2 ? trimmed[len - 2] : null;
    if (isKana(base)) {
      first = base;
      second = getVowelHiragana(base);
      return { first, second };
    }
    return { first: null, second: null };
  }

  if (SOKUON.includes(last)) {
    const base = len >= 2 ? trimmed[len - 2] : null;
    if (isKana(base)) return { first: base, second: null };
    return { first: null, second: null };
  }

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

  // 규칙 팝업
  const [showRules, setShowRules] = useState(false);

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
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // 방 안 상태: waiting / playing / finished
  const [roomStage, setRoomStage] = useState("waiting");

  // 게임 상태
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
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
    // 언어는 그대로 유지
  };

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
    // 이미 선택된 방을 다시 클릭하면 선택 해제
    if (selectedRoom?.roomId === room.roomId) {
      setSelectedRoom(null);
      setJoinPasswordInput("");
    } else {
      setSelectedRoom(room);
      setJoinPasswordInput("");
    }
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

  // ===== 파생 값 (표시용) =====
  const myTime =
    gameState && playerType && gameState.timers
      ? Math.max(0, Math.floor(gameState.timers[playerType] ?? 0))
      : null;

  const oppType =
    playerType === "korean"
      ? "japanese"
      : playerType === "japanese"
      ? "korean"
      : null;

  const oppTime =
    gameState && oppType && gameState.timers
      ? Math.max(0, Math.floor(gameState.timers[oppType] ?? 0))
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
      : language === "ja"
      ? "日本人"
      : "일본인";

  const timerUnit = language === "ja" ? "秒" : "초";

  const nextKoChar = getKoreanNextChar(gameState?.currentWord?.ko);
  const { first: nextJaFirst, second: nextJaSecond } = getJapaneseNextChars(
    gameState?.currentWord?.ja || ""
  );

  const showKoHint = gameState?.currentTurn === "korean";
  const showJaHint = gameState?.currentTurn === "japanese";

  const hintColumnCount =
    showKoHint && showJaHint ? 2 : showKoHint || showJaHint ? 1 : 0;

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

  const closeIconStyle = {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    padding: "0 4px",
    color: "#6b7280",
  };

  // ===== 규칙 팝업 내용 (한/일 버전) =====
  const renderRulesContent = () => {
    if (language === "ja") {
      // 일본어 설명
      return (
        <div>
          <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
            ゲームルール
          </h3>
          <p style={{ fontSize: "13px", marginBottom: "6px" }}>
            1. 基本説明
          </p>
          <p style={{ fontSize: "12px", margin: 0 }}>
            1-1. このゲームは韓国人と日本人が対戦する1対1のしりとりゲームです。
            <br />
            1-2. 韓国人は韓国語の単語、日本人は日本語の単語を使います。
            <br />
            1-3. ゲーム開始時に、韓国語と日本語でランダムな開始単語が表示されます。
            <br />
            1-4. 각 플레이어는 個人タイマー90秒を持ってゲームを行います。
          </p>

          <p
            style={{
              fontSize: "13px",
              marginBottom: "6px",
              marginTop: "10px",
            }}
          >
            2. 単語をつなぐルール
          </p>
          <p style={{ fontSize: "12px", margin: 0 }}>
            2-1. 韓国人：前の単語의「韓国語の最後の文字」から始まる単語を出します。
            <br />
            2-2. 日本人：前の単語의「日本語の最後の音」につながる単語を出します。
            <br />
            2-3. 拗音（しゃ・しゅ・しょ など）、促音（っ）、長音（ー）は発音ルール에従って処理されます。
            <br />
            2-4. 画面の「次の頭文字」に、現在のターンでつなぐべき文字が表示されます。
          </p>

          <p
            style={{
              fontSize: "13px",
              marginBottom: "6px",
              marginTop: "10px",
            }}
          >
            3. 勝利条件
          </p>
          <p style={{ fontSize: "12px", margin: 0 }}>
            3-1. 相手の残り時間が0秒になった場合、勝利となります。
            <br />
            3-2. 相手がルールに合わない単語を出した場合も勝利になります。
          </p>

          <p
            style={{
              fontSize: "13px",
              marginBottom: "6px",
              marginTop: "10px",
            }}
          >
            4. 敗北条件
          </p>
          <p style={{ fontSize: "12px", margin: 0 }}>
            4-1. 韓国人が出した単語의「日本語訳」が「ん」で終わる場合、
            そのラウンドは韓国人の負けになります。
            <br />
            4-2. 自分の残り時間が0秒になった場合、負けになります。
          </p>
        </div>
      );
    }

    // 한국어 설명
    return (
      <div>
        <h3 style={{ marginTop: 0, marginBottom: "8px" }}>게임 규칙</h3>
        <p style={{ fontSize: "13px", marginBottom: "6px" }}>
          1. 기본 설명
        </p>
        <p style={{ fontSize: "12px", margin: 0 }}>
          1-1. 이 게임은 한국인과 일본인이 1대1로 겨루는 끝말잇기 게임입니다.
          <br />
          1-2. 한국인은 한국어 단어, 일본인은 일본어 단어를 사용합니다.
          <br />
          1-3. 게임 시작 시 한국어/일본어 랜덤 시작 단어가 함께 표시됩니다.
          <br />
          1-4. 각 플레이어는 개인 시간 90초를 가지고 게임을 진행합니다.
        </p>
        <p
          style={{
            fontSize: "13px",
            marginBottom: "6px",
            marginTop: "10px",
          }}
        >
          2. 단어 잇기 규칙
        </p>
        <p style={{ fontSize: "12px", margin: 0 }}>
          2-1. 한국인: 이전 단어의 “한국어 마지막 글자”로 시작하는 단어를 제출해야
          합니다.
          <br />
          2-2. 일본인: 이전 단어의 “일본어 끝나는 소리”에 맞게 이어야 합니다.
          <br />
          2-3. 복합음, 촉음(っ), 장음(ー)은 발음 규칙에 따라 처리됩니다.
          <br />
          2-4. 화면의 “이어야 할 글자”에 현재 턴에서 이어야 할 글자가 표시됩니다.
        </p>
        <p
          style={{
            fontSize: "13px",
            marginBottom: "6px",
            marginTop: "10px",
          }}
        >
          3. 승리 조건
        </p>
        <p style={{ fontSize: "12px", margin: 0 }}>
          3-1. 상대방의 시간이 0초가 되면 승리합니다.
          <br />
          3-2. 상대가 규칙에 맞지 않는 단어를 제출하면 승리합니다.
        </p>
        <p
          style={{
            fontSize: "13px",
            marginBottom: "6px",
            marginTop: "10px",
          }}
        >
          4. 패배 조건
        </p>
        <p style={{ fontSize: "12px", margin: 0 }}>
          4-1. 한국인이 낸 단어의 일본어 번역이 ‘ん’으로 끝나면 한국인이 즉시
          패배합니다.
          <br />
          4-2. 자신의 남은 시간이 0초가 되면 패배합니다.
        </p>
      </div>
    );
  };

  // ===== 규칙 팝업 컴포넌트 =====
  const RulesModal = () =>
    showRules ? (
      <div
        onClick={() => setShowRules(false)}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.35)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 300,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            ...cardStyle,
            maxWidth: "520px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <strong>{language === "ja" ? "ゲームルール" : "게임 규칙"}</strong>
            <button
              onClick={() => setShowRules(false)}
              style={closeIconStyle}
              aria-label="규칙 닫기"
            >
              ✕
            </button>
          </div>
          {renderRulesContent()}
          <div style={{ textAlign: "right", marginTop: "12px" }}>
            <button onClick={() => setShowRules(false)} style={buttonStyle}>
              {T.close}
            </button>
          </div>
        </div>
      </div>
    ) : null;

  // ===== 렌더링 =====

  // 1단계: 국적 선택
  if (step === 1) {
    return (
      <div style={{ ...pageStyle, position: "relative" }}>
        {/* 좌상단 규칙 보기 */}
        <button
          onClick={() => setShowRules(true)}
          style={{
            ...buttonStyle,
            position: "fixed",
            top: "16px",
            left: "16px",
            zIndex: 120,
            fontSize: "12px",
          }}
        >
          {T.showRules}
        </button>

        {/* 우상단 언어 토글 */}
        <button
          onClick={handleToggleUiLanguage}
          style={{
            ...buttonStyle,
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 120,
          }}
        >
          {language === "ko" ? T.uiToggleToJa : T.uiToggleToKo}
        </button>

        <RulesModal />

        <div style={{ textAlign: "center", marginTop: "80px" }}>
          {/* 게임 이름 */}
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              marginBottom: "40px",
              color: "#111827",
            }}
          >
            {language === "ko" ? "한・일 끝말잇기" : "日・韓しりとり"}
          </h1>

          <div style={{ ...cardStyle, maxWidth: "400px", margin: "0 auto" }}>
            <h2 style={{ marginTop: 0 }}>{T.selectTitle}</h2>
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
        {/* 좌상단 규칙 보기 */}
        <button
          onClick={() => setShowRules(true)}
          style={{
            ...buttonStyle,
            position: "fixed",
            top: "16px",
            left: "16px",
            zIndex: 120,
            fontSize: "12px",
          }}
        >
          {T.showRules}
        </button>

        {/* 우상단 언어 토글 */}
        <button
          onClick={handleToggleUiLanguage}
          style={{
            ...buttonStyle,
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 120,
          }}
        >
          {language === "ko" ? T.uiToggleToJa : T.uiToggleToKo}
        </button>

        <RulesModal />

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

        {/* 방 만들기 (방 목록 위로 이동) */}
        {isCreating && (
          <div
            style={{
              ...cardStyle,
              marginBottom: "12px",
              position: "relative",
            }}
          >
            <button
              onClick={() => setIsCreating(false)}
              style={{
                ...closeIconStyle,
                position: "absolute",
                top: 8,
                right: 8,
              }}
              aria-label="방 만들기 닫기"
            >
              ✕
            </button>
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
              style={{
                ...primaryButtonStyle,
                width: "100%",
                marginTop: "4px",
              }}
            >
              {T.createRoomBtn}
            </button>
          </div>
        )}

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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {rooms.map((room) => (
                <div key={room.roomId}>
                  {/* 방 항목 */}
                  <div
                    onClick={() => handleSelectRoomForJoin(room)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor:
                        selectedRoom?.roomId === room.roomId
                          ? "#f0f9ff"
                          : "transparent",
                      userSelect: "none",
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
                  </div>

                  {/* 방 입장 (클릭한 방 바로 아래) */}
                  {selectedRoom?.roomId === room.roomId && (
                    <div
                      style={{
                        marginTop: "6px",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 2px 4px rgba(15, 23, 42, 0.06)",
                        position: "relative",
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoom(null);
                        }}
                        style={{
                          ...closeIconStyle,
                          position: "absolute",
                          top: 8,
                          right: 8,
                        }}
                        aria-label="방 입장 닫기"
                      >
                        ✕
                      </button>
                      <h4
                        style={{
                          marginTop: 0,
                          marginBottom: "8px",
                        }}
                      >
                        {T.enterRoomTitle}
                      </h4>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "8px",
                        }}
                      >
                        {T.thisIsOppNationRoom}
                      </p>

                      {selectedRoom.hasPassword ? (
                        <>
                          <input
                            type="password"
                            placeholder={T.inputPasswordPlaceholder}
                            value={joinPasswordInput}
                            onChange={(e) =>
                              setJoinPasswordInput(e.target.value)
                            }
                            style={inputStyle}
                          />
                          <button
                            onClick={handleJoinRoom}
                            style={{
                              ...primaryButtonStyle,
                              width: "100%",
                              marginTop: "6px",
                            }}
                          >
                            {T.btnEnter}
                          </button>
                        </>
                      ) : (
                        <>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginBottom: "8px",
                            }}
                          >
                            {T.noPasswordRoom}
                          </p>
                          <button
                            onClick={handleJoinRoom}
                            style={{
                              ...primaryButtonStyle,
                              width: "100%",
                            }}
                          >
                            {T.btnEnterDirect}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3단계: 방 안
  if (step === 3 && currentRoom) {
    return (
      <div style={{ ...pageStyle, position: "relative" }}>
        {/* 좌상단 규칙 보기 */}
        <button
          onClick={() => setShowRules(true)}
          style={{
            ...buttonStyle,
            position: "fixed",
            top: "16px",
            left: "16px",
            zIndex: 120,
            fontSize: "12px",
          }}
        >
          {T.showRules}
        </button>

        {/* 우상단 언어 토글 */}
        <button
          onClick={handleToggleUiLanguage}
          style={{
            ...buttonStyle,
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 120,
          }}
        >
          {language === "ko" ? T.uiToggleToJa : T.uiToggleToKo}
        </button>

        <RulesModal />

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

              {/* 방장 + 게스트가 있을 때만 버튼 표시 */}
              {isHost && roomInfo?.guestId && (
                <button
                  onClick={handleGameStart}
                  style={primaryButtonStyle}
                >
                  {T.startGame}
                </button>
              )}
            </div>
          )}

          {/* 게임 중 */}
          {roomStage === "playing" && gameState && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* 상단 정보 4개 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "8px",
                }}
              >
                {/* 현재 단어 */}
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    {T.currentWord}
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "13px" }}>
                    <div>
                      <strong>KO:</strong> {gameState?.currentWord?.ko || "-"}
                    </div>
                    <div>
                      <strong>JA:</strong> {gameState?.currentWord?.ja || "-"}
                    </div>
                  </div>
                </div>

                {/* 내 시간 */}
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
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

                {/* 상대 시간 */}
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    {T.oppTime}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      marginTop: "4px",
                      color: "#dc2626",
                    }}
                  >
                    {oppTime != null ? oppTime : "-"}
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
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    {T.turn}
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    {isMyTurn ? T.myTurn : T.oppTurn}
                  </div>
                </div>
              </div>

              {/* 이어야 할 글자 – 한쪽만일 땐 전체폭 사용 */}
              {hintColumnCount > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${hintColumnCount}, minmax(0, 1fr))`,
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
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
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
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
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
                style={{
                  display: "flex",
                  gap: "8px",
                }}
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

              {/* 히스토리 (최신 단어가 위, 번호는 N→1) */}
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
                  <p
                    style={{
                      fontSize: "13px",
                      marginTop: "4px",
                    }}
                  >
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
                    {[...gameState.history].reverse().map((h, idx) => {
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
                            backgroundColor: isMine ? "#eff6ff" : "#ffffff",
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
                              #{gameState.history.length - idx} · {playerLabel}
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
                              <strong>{translatedLang}:</strong> {h.translated}
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
                <strong>
                  {winnerLabel || "결과를 불러오지 못했습니다."}
                </strong>
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                (다시 하려면 방을 나갔다가 새 방을 만들거나 입장해주세요.)
              </p>
            </div>
          )}

          {/* 방 나가기 */}
          <div
            style={{
              marginTop: "16px",
              textAlign: "right",
            }}
          >
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
    <div
      style={{
        ...pageStyle,
        textAlign: "center",
        marginTop: "80px",
      }}
    >
      <div
        style={{
          ...cardStyle,
          maxWidth: "400px",
          margin: "0 auto",
        }}
      >
        <p>오류가 발생했습니다. 처음으로 돌아갑니다.</p>
        <button onClick={() => setStep(1)} style={primaryButtonStyle}>
          처음으로
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const ROWS = 20;
const COLS = 10;
const SHAPES = [
  // I
  [
    [1, 1, 1, 1]
  ],
  // O
  [
    [1, 1],
    [1, 1]
  ],
  // T
  [
    [0, 1, 0],
    [1, 1, 1]
  ],
  // S
  [
    [0, 1, 1],
    [1, 1, 0]
  ],
  // Z
  [
    [1, 1, 0],
    [0, 1, 1]
  ],
  // J
  [
    [1, 0, 0],
    [1, 1, 1]
  ],
  // L
  [
    [0, 0, 1],
    [1, 1, 1]
  ]
];

// สีแต่ละบล็อก
const COLORS = [
  "#111", // 0 = ว่าง
  "#00f0f0", // I
  "#f0f000", // O
  "#a000f0", // T
  "#00f000", // S
  "#f00000", // Z
  "#0000f0", // J
  "#f0a000", // L
  "#f90",     // ปัจจุบัน
  "rgba(255,255,255,0.2)" // ghost
];

// index ของ SHAPES ตรงกับ index สี (ยกเว้น 0)
function randomShapeIndex() {
  return Math.floor(Math.random() * SHAPES.length);
}
function randomShape() {
  const idx = randomShapeIndex();
  return { shape: SHAPES[idx], index: idx + 1 };
}

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function rotate(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function checkCollision(board, shape, pos) {
  for (let y = 0; y < shape.shape.length; y++) {
    for (let x = 0; x < shape.shape[y].length; x++) {
      if (
        shape.shape[y][x] &&
        (board[y + pos.y] && board[y + pos.y][x + pos.x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function merge(board, shape, pos) {
  const newBoard = board.map(row => [...row]);
  for (let y = 0; y < shape.shape.length; y++) {
    for (let x = 0; x < shape.shape[y].length; x++) {
      if (shape.shape[y][x]) {
        newBoard[y + pos.y][x + pos.x] = shape.index;
      }
    }
  }
  return newBoard;
}

function getGhostPosition(board, shape, pos) {
  let ghostPos = { ...pos };
  while (!checkCollision(board, shape, { x: ghostPos.x, y: ghostPos.y + 1 })) {
    ghostPos.y += 1;
  }
  return ghostPos;
}

// เพิ่มฟังก์ชัน formatTime ไว้ด้านบนสุดของ App หรือก่อนใช้งาน
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// --- รายชื่อโดเนท (เรียงจากมากไปน้อย) ---
const DONATORS = [
  { name: "voidwid", amount: 30 },
  { name: "slowroller", amount: 20 }
];

function App() {
  const [board, setBoard] = useState(emptyBoard());
  const [shape, setShape] = useState(randomShape());
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [nextShape, setNextShape] = useState(randomShape());
  const [holdShape, setHoldShape] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [lines, setLines] = useState(0);
  const [timer, setTimer] = useState(0); // ตัวจับเวลา (วินาที)
  const [ranking, setRanking] = useState(() => {
    // โหลด ranking จาก localStorage (ถ้ามี)
    const saved = localStorage.getItem("tetris40_ranking");
    return saved ? JSON.parse(saved) : [];
  });
  const [blitzRanking, setBlitzRanking] = useState(() => {
    const saved = localStorage.getItem("tetris_blitz_ranking");
    return saved ? JSON.parse(saved) : [];
  });
  const [pieceCount, setPieceCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [screen, setScreen] = useState("menu");
  const [mode, setMode] = useState("40line"); // หรือ "blitz"
  const [score, setScore] = useState(0);
  const [lastGain, setLastGain] = useState(0); // state สำหรับแสดง popup คะแนนล่าสุด
  const [showResult, setShowResult] = useState(false);

  const requestRef = useRef();
  const moveRef = useRef({ left: false, right: false, down: false });
  const lastMoveTimeRef = useRef({ left: 0, right: 0 });
  const repeatDelay = 100; // ms ก่อนจะเริ่ม repeat (ลดลงเพื่อให้ตอบสนองเร็วขึ้น)
  const repeatRate = 39;   // ms ความถี่ repeat (ลดลงเพื่อให้ขยับเร็วขึ้น)
  const rotateRef = useRef(false);

  // สำหรับ repeat การกดค้าง
  useEffect(() => {
    if (gameOver) return;
    let animationId = null;

    function moveLoop(now) {
      // ซ้าย
      if (moveRef.current.left) {
        if (lastMoveTimeRef.current.left === 0) {
          // กดครั้งแรก
          const newPos = { x: pos.x - 1, y: pos.y };
          if (!checkCollision(board, shape, newPos)) setPos(newPos);
          lastMoveTimeRef.current.left = now;
        } else if (now - lastMoveTimeRef.current.left > repeatDelay) {
          // repeat
          const newPos = { x: pos.x - 1, y: pos.y };
          if (!checkCollision(board, shape, newPos)) setPos(newPos);
          lastMoveTimeRef.current.left = now - ((now - lastMoveTimeRef.current.left) % repeatRate);
        }
      } else {
        lastMoveTimeRef.current.left = 0;
      }
      // ขวา
      if (moveRef.current.right) {
        if (lastMoveTimeRef.current.right === 0) {
          const newPos = { x: pos.x + 1, y: pos.y };
          if (!checkCollision(board, shape, newPos)) setPos(newPos);
          lastMoveTimeRef.current.right = now;
        } else if (now - lastMoveTimeRef.current.right > repeatDelay) {
          const newPos = { x: pos.x + 1, y: pos.y };
          if (!checkCollision(board, shape, newPos)) setPos(newPos);
          lastMoveTimeRef.current.right = now - ((now - lastMoveTimeRef.current.right) % repeatRate);
        }
      } else {
        lastMoveTimeRef.current.right = 0;
      }
      animationId = requestAnimationFrame(moveLoop);
    }
    animationId = requestAnimationFrame(moveLoop);
    return () => cancelAnimationFrame(animationId);
  }, [board, shape, pos, gameOver]);

  // เพิ่มใน gravity (tick)
  useEffect(() => {
    if (gameOver) return;
    const tick = () => {
      const newPos = { x: pos.x, y: pos.y + 1 };
      if (!checkCollision(board, shape, newPos)) {
        setPos(newPos);
      } else {
        const newBoard = merge(board, shape, pos);
        const cleared = clearLines(newBoard);
        // ...เพิ่ม logic ข้างบนตรงนี้...
        if (pos.y === 0) {
          setGameOver(true);
        } else {
          setBoard(cleared);
          setShape(nextShape);
          setNextShape(randomShape());
          setPos({ x: 3, y: 0 });
          setCanHold(true);
          setPieceCount(c => c + 1); // เพิ่มตรงนี้
        }

        // นับจำนวนแถวที่เคลียร์
        const linesCleared = (() => {
          let count = 0;
          for (let y = 0; y < ROWS; y++) {
            if (newBoard[y].every(cell => cell !== 0)) count++;
          }
          return count;
        })();

        // --- เพิ่มคะแนนถ้าเป็นโหมด blitz ---
        if (mode === "blitz") {
          // combo: ถ้าเคลียร์แถว combo+1, ถ้าไม่เคลียร์รีเซ็ต
          let newCombo = 0;
          if (linesCleared > 0) newCombo += 1;

          // b2b: ถ้า tetris ติดกัน
          let newB2b = false;
          if (linesCleared === 4) {
            newB2b = true;
          } else if (linesCleared > 0) {
            newB2b = false;
          }

          // คำนวณคะแนน
          const gain = getBlitzScore({
            linesCleared,
            combo: newCombo > 0 ? newCombo - 1 : 0,
            isB2B: newB2b,
            softDropCells: 0, // ถ้าคุณมี logic soft/hard drop ให้ใส่ค่าจริง
            hardDropCells: 0,
            speedSec: 0, // ถ้ามี logic จับเวลาแต่ละชิ้น
            garbageLinesCleared: 0
          });

          setScore(s => s + gain);
          setLastGain(gain);
        } else {
          setScore(0);
          setLastGain(0);
        }
      }
      requestRef.current = setTimeout(tick, 500);
    };
    requestRef.current = setTimeout(tick, 500);
    return () => clearTimeout(requestRef.current);
  }, [board, shape, pos, gameOver, nextShape]);

  // เพิ่มใน hard drop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      if (e.key === " " || e.code === "Space") {
        let dropPos = { ...pos };
        while (!checkCollision(board, shape, { x: dropPos.x, y: dropPos.y + 1 })) {
          dropPos.y += 1;
        }
        const newBoard = merge(board, shape, dropPos);
        const cleared = clearLines(newBoard);

        // --- Logic คะแนน blitz (เหมือนเดิม) ---
        const linesCleared = (() => {
          let count = 0;
          for (let y = 0; y < ROWS; y++) {
            if (newBoard[y].every(cell => cell !== 0)) count++;
          }
          return count;
        })();

        if (mode === "blitz") {
          let newCombo = 0;
          if (linesCleared > 0) newCombo += 1;

          let newB2b = false;
          if (linesCleared === 4) {
            newB2b = true;
          } else if (linesCleared > 0) {
            newB2b = false;
          }

          const gain = getBlitzScore({
            linesCleared,
            combo: newCombo > 0 ? newCombo - 1 : 0,
            isB2B: newB2b,
            softDropCells: 0,
            hardDropCells: dropPos.y - pos.y,
            speedSec: 0,
            garbageLinesCleared: 0
          });

          setScore(s => s + gain);
          setLastGain(gain);
        } else {
          setScore(0);
          setLastGain(0);
        }

        // --- เพิ่มส่วนนี้เพื่อ "ลงบล็อก" จริง ---
        if (dropPos.y === 0) {
          setGameOver(true);
        } else {
          setBoard(cleared);
          setShape(nextShape);
          setNextShape(randomShape());
          setPos({ x: 3, y: 0 });
          setCanHold(true);
          setPieceCount(c => c + 1);
        }
      }
      if (e.key === "ArrowLeft") moveRef.current.left = true;
      if (e.key === "ArrowRight") moveRef.current.right = true;
      if (e.key === "ArrowDown") {
        const newPos = { x: pos.x, y: pos.y + 1 };
        if (!checkCollision(board, shape, newPos)) setPos(newPos);
      }
      if (e.key === "ArrowUp") {
        if (!rotateRef.current) {
          const rotated = { ...shape, shape: rotate(shape.shape) };
          if (!checkCollision(board, rotated, pos)) setShape(rotated);
          rotateRef.current = true;
        }
      }
      if (e.key === "Shift" || e.key === "ShiftLeft" || e.key === "ShiftRight") {
        if (canHold) {
          if (holdShape) {
            setShape(holdShape);
            setHoldShape(shape);
            setPos({ x: 3, y: 0 });
            setPieceCount(c => c + 1); // เพิ่มตรงนี้
          } else {
            setHoldShape(shape);
            setShape(nextShape);
            setNextShape(randomShape());
            setPos({ x: 3, y: 0 });
            setPieceCount(c => c + 1); // เพิ่มตรงนี้
          }
          setCanHold(false);
        }
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === "ArrowLeft") moveRef.current.left = false;
      if (e.key === "ArrowRight") moveRef.current.right = false;
      if (e.key === "ArrowUp") rotateRef.current = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [board, shape, pos, gameOver, nextShape, holdShape, canHold]);

  // Reset pieceCount & startTime on restart
  useEffect(() => {
    if (!gameOver && lines === 0 && timer === 0) {
      setPieceCount(0);
      setStartTime(Date.now());
    }
  }, [gameOver, lines, timer]);

  // --- คำนวณค่า pieces per second ---
  const elapsedSec = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
  const pps = (pieceCount / elapsedSec).toFixed(2);

  // Timer (นับจาก 1 ไปเรื่อยๆจนจบเกม)
  useEffect(() => {
    if (gameOver) return;
    if (mode === "blitz") {
      if (timer >= 60) {
        setGameOver(true);
        setShowResult(true);
        return;
      }
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    } else {
      if (lines >= 40) return;
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [gameOver, lines, timer, mode]);

  // บันทึก ranking เมื่อจบเกม 40Line
  useEffect(() => {
    if (lines >= 40 && !gameOver) {
      setGameOver(true);
    }
    if (lines >= 40 && !gameOver) {
      // เพิ่มสถิติใหม่ (บันทึก pieceCount ด้วย)
      const newRanking = [
        ...ranking,
        { time: timer, date: new Date().toLocaleString(), pieceCount, pps: (pieceCount / Math.max(1, timer)).toFixed(2) }
      ]
        .sort((a, b) => a.time - b.time)
        .slice(0, 10); // top 10
      setRanking(newRanking);
      localStorage.setItem("tetris40_ranking", JSON.stringify(newRanking));
    }
  // eslint-disable-next-line
  }, [lines, gameOver]);

  // บันทึก ranking เมื่อจบเกม Blitz
  useEffect(() => {
    if (mode === "blitz" && gameOver && showResult) {
      const newRanking = [
        ...blitzRanking,
        { score, pps, date: new Date().toLocaleString() }
      ]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      setBlitzRanking(newRanking);
      localStorage.setItem("tetris_blitz_ranking", JSON.stringify(newRanking));
    }
    // eslint-disable-next-line
  }, [mode, gameOver, showResult]);

  // --- UI ---
  function renderBoard() {
    const display = board.map(row => [...row]);
    const ghostPos = getGhostPosition(board, shape, pos);
    // วาด ghost (ตำแหน่งเงา)
    for (let y = 0; y < shape.shape.length; y++) {
      for (let x = 0; x < shape.shape[y].length; x++) {
        if (
          shape.shape[y][x] &&
          display[y + ghostPos.y] &&
          display[y + ghostPos.y][x + ghostPos.x] !== undefined &&
          !(y + ghostPos.y === y + pos.y && x + ghostPos.x === x + pos.x)
        ) {
          display[y + ghostPos.y][x + ghostPos.x] = 9; // ghost
        }
      }
    }
    // วาดตัวบล็อกปัจจุบัน
    for (let y = 0; y < shape.shape.length; y++) {
      for (let x = 0; x < shape.shape[y].length; x++) {
        if (shape.shape[y][x] && display[y + pos.y] && display[y + pos.y][x + pos.x] !== undefined) {
          display[y + pos.y][x + pos.x] = 8; // ปัจจุบัน
        }
      }
    }
    return (
      <div style={{ position: "relative" }}>
        {/* ตรงนี้! */}
        {mode === "40line" ? (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 0,
              width: "100%",
              textAlign: "center",
              fontSize: 32,
              fontWeight: "bold",
              color: "#0ffb",
              textShadow: "0 2px 8px #000, 0 0 8px #0ff8",
              letterSpacing: 2,
              zIndex: 2,
              userSelect: "none",
              pointerEvents: "none"
            }}
          >
            {Math.max(0, 40 - lines)}
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 0,
              width: "100%",
              textAlign: "center",
              fontSize: 32,
              fontWeight: "bold",
              color: "#ff0",
              textShadow: "0 2px 8px #000, 0 0 8px #ff08",
              letterSpacing: 2,
              zIndex: 2,
              userSelect: "none",
              pointerEvents: "none"
            }}
          >
            {score}
          </div>
        )}
        {/* กระดานเกม */}
        {display.map((row, y) => (
          <div key={y} style={{ display: "flex" }}>
            {row.map((cell, x) => (
              <div
                key={x}
                style={{
                  width: 24,
                  height: 24,
                  border: "1px solid #333",
                  background:
                    cell === 0
                      ? COLORS[0]
                      : cell === 8
                      ? COLORS[shape.index]
                      : cell === 9
                      ? COLORS[9]
                      : COLORS[cell],
                  boxShadow: cell === 9 ? "0 0 2px 2px #fff2" : undefined
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  function renderNextShape() {
    const gridSize = 4;
    const preview = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    for (let y = 0; y < nextShape.shape.length; y++) {
      for (let x = 0; x < nextShape.shape[y].length; x++) {
        if (nextShape.shape[y][x]) {
          preview[y][x] = nextShape.index;
        }
      }
    }
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: "#fff", marginBottom: 4, textAlign: "center" }}>Next</div>
        {preview.map((row, y) => (
          <div key={y} style={{ display: "flex" }}>
            {row.map((cell, x) => (
              <div
                key={x}
                style={{
                  width: 20,
                  height: 20,
                  border: "1px solid #333",
                  background: cell ? COLORS[cell] : "#23272f"
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  function renderHoldShape() {
    const gridSize = 4;
    const preview = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    if (holdShape) {
      for (let y = 0; y < holdShape.shape.length; y++) {
        for (let x = 0; x < holdShape.shape[y].length; x++) {
          if (holdShape.shape[y][x]) {
            preview[y][x] = holdShape.index;
          }
        }
      }
    }
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: "#fff", marginBottom: 4, textAlign: "center" }}>Hold</div>
        {preview.map((row, y) => (
          <div key={y} style={{ display: "flex" }}>
            {row.map((cell, x) => (
              <div
                key={x}
                style={{
                  width: 20,
                  height: 20,
                  border: "1px solid #333",
                  background: cell ? COLORS[cell] : "#23272f"
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  function clearLines(board) {
    let cleared = 0;
    const newBoard = board.filter(row => row.some(cell => cell === 0));
    cleared = ROWS - newBoard.length;
    while (newBoard.length < ROWS) {
      newBoard.unshift(Array(COLS).fill(0));
    }
    if (cleared > 0) setLines(prev => prev + cleared);
    return newBoard;
  }

  // --- RANKING UI ---
  function renderRanking() {
    if (mode === "blitz") {
      return (
        <div style={{
          minWidth: 220,
          background: "#181b20",
          borderRadius: 8,
          padding: 12,
          marginLeft: 16,
          color: "#fff"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: 8, textAlign: "center" }}>Blitz Ranking (Top 10)</div>
          <div style={{ fontSize: 15, marginBottom: 4 }}>Score | Piece/s | Date</div>
          {blitzRanking.length === 0 && <div style={{ color: "#aaa" }}>No record</div>}
          {blitzRanking.map((r, i) => (
            <div key={i} style={{
              background: i === 0 ? "#0f08" : "none",
              padding: "2px 0",
              borderRadius: 4
            }}>
              {i + 1}. <b style={{ color: "#ff0" }}>{r.score}</b>
              <span style={{ color: "#0ff", fontWeight: "bold", marginLeft: 6, marginRight: 6 }}>
                {r.pps}
              </span>
              <span style={{ color: "#aaa", fontSize: 12 }}>({r.date})</span>
            </div>
          ))}
        </div>
      );
    }
    // 40line ranking เดิม
    return (
      <div style={{
        minWidth: 180,
        background: "#181b20",
        borderRadius: 8,
        padding: 12,
        marginLeft: 16,
        color: "#fff"
      }}>
        <div style={{ fontWeight: "bold", marginBottom: 8, textAlign: "center" }}>Ranking (Top 10)</div>
        <div style={{ fontSize: 15, marginBottom: 4 }}>Time | Piece/s | Date</div>
        {ranking.length === 0 && <div style={{ color: "#aaa" }}>No record</div>}
        {ranking.map((r, i) => (
          <div key={i} style={{
            background: i === 0 ? "#0f08" : "none",
            padding: "2px 0",
            borderRadius: 4
          }}>
            {i + 1}. {formatTime(r.time)}
            <span style={{ color: "#0ff", fontWeight: "bold", marginLeft: 6, marginRight: 6 }}>
              {r.pps ? r.pps : ((r.pieceCount && r.time) ? (r.pieceCount / Math.max(1, r.time)).toFixed(2) : "")}
            </span>
            <span style={{ color: "#aaa", fontSize: 12 }}>({r.date})</span>
          </div>
        ))}
      </div>
    );
  }

  // --- UI รายชื่อโดเนท ---
  function renderDonators() {
    return (
      <div
        style={{
          position: "fixed",
          top: 64, // ขยับลงมาห่างปุ่ม
          left: 32,
          width: 300,
          minHeight: 120,
          background: "#23272fcc",
          borderRadius: 16,
          color: "#fff",
          fontSize: 20,
          padding: "20px 24px",
          zIndex: 100,
          boxShadow: "0 4px 24px #000a",
          textAlign: "left"
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: 24, marginBottom: 12, color: "#ff0" }}>
          ขอบคุณผู้สนับสนุน
        </div>
        <ol style={{ margin: 0, paddingLeft: 24, fontSize: 18 }}>
          {DONATORS.map((d, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              <span style={{ color: "#0ff" }}>{d.name}</span>
              <span style={{ color: "#fff" }}> {d.amount} THB</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  function renderMenu() {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#23272f"
      }}>
        <h1 style={{ color: "#fff", marginBottom: 32 }}>Tetris by 404SkillNotFound</h1>
        <button
          style={menuBtnStyle}
          onClick={() => { setMode("40line"); setScreen("game"); }}
        >โหมด 40 Line</button>
        <button
          style={menuBtnStyle}
          onClick={() => { setMode("blitz"); setScreen("game"); }}
        >โหมด Blitz (1 นาที)</button>
      </div>
    );
  }
  const menuBtnStyle = {
    padding: "16px 48px",
    fontSize: 22,
    margin: "12px 0",
    borderRadius: 8,
    border: "none",
    background: "#09f",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold"
  };

  function getTetrioScore(lines, combo, b2b) {
    // linesCleared: จำนวนแถวที่เคลียร์ใน 1 ครั้ง
    // combo: คอมโบปัจจุบัน (0 = ไม่มี)
    // b2b: true/false (Back-to-Back Tetris)
    let base = 0;
    if (lines === 1) base = 100;
    if (lines === 2) base = 300;
    if (lines === 3) base = 500;
    if (lines === 4) base = 800;
    if (b2b && lines === 4) base += 400; // B2B Tetris bonus
    if (combo > 0) base += combo * 50; // combo bonus
    return base;
  }

  function getBlitzScore({
    linesCleared,
    combo,
    isB2B,
    softDropCells,
    hardDropCells,
    speedSec,
    garbageLinesCleared
  }) {
    let score = 0;

    // 1. Basic line clear
    if (linesCleared === 1) score += 100;
    if (linesCleared === 2) score += 300;
    if (linesCleared === 3) score += 500;
    if (linesCleared === 4) score += 800;

    // 2. Combo
    if (combo > 0) score += combo * 50;

    // 3. Back-to-Back Tetris
    if (isB2B && linesCleared === 4) score += 400;

    // 4. Drop bonuses
    if (softDropCells) score += softDropCells * 1;
    if (hardDropCells) score += hardDropCells * 2;

    // 5. Speed bonus
    if (typeof speedSec === "number") {
      if (speedSec <= 0.5) score += 20;
      else if (speedSec <= 1.0) score += 10;
    }

    // 6. Garbage line clear
    if (garbageLinesCleared) score += garbageLinesCleared * 50;

    return score;
  }

  // --- MAIN RENDER ---
  return (
    <>
      {screen === "menu" ? (
        renderMenu()
      ) : (
        <div
          className="App"
          style={{
            minHeight: "100vh",
            background: "#23272f",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {/* ปุ่ม กลับเมนู */}
          <button
            tabIndex={-1}
            onKeyDown={e => e.preventDefault()}
            style={{
              position: "fixed",
              top: 16,
              left: 16,
              zIndex: 1001,
              background: "#444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 24px",
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 2px 8px #0006"
            }}
            onClick={() => setScreen("menu")}
          >
            กลับเมนู
          </button>

          {renderDonators()}
          <h1 style={{ color: "#fff", marginBottom: 8 }}>
            {mode === "40line" ? "Tetris 40 Line" : "Tetris Blitz"}
          </h1>
          {mode === "40line" ? (
            <div style={{ color: "#fff", marginBottom: 8, fontSize: 18 }}>
              Lines: {lines} / 40
            </div>
          ) : (
            <div style={{ color: "#fff", marginBottom: 8, fontSize: 18 }}>
              Score: {score}
            </div>
          )}
          <div style={{ color: "#fff", marginBottom: 8, fontSize: 18 }}>
            {mode === "blitz"
              ? `Time: 00:${(60 - timer).toString().padStart(2, "0")}`
              : `Time: ${formatTime(timer)}`}
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {/* --- Player UI (left) --- */}
            <div>
              {renderHoldShape()}
              <div style={{
                background: "#181b20",
                borderRadius: 8,
                padding: 10,
                marginTop: 8,
                color: "#fff",
                fontSize: 16,
                textAlign: "center"
              }}>
                <div>Piece/s: <b>{pps}</b></div>
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 24 }}>
                {gameOver
                  ? lines >= 40
                    ? <h2 style={{ color: "#0f0" }}>Finished!</h2>
                    : <h2 style={{ color: "#fff" }}>Game Over</h2>
                  : renderBoard()}
              </div>
            </div>
            {renderNextShape()}
            {renderRanking()}
          </div>
          <button
            tabIndex={-1}
            onKeyDown={e => e.preventDefault()}
            onClick={() => {
              setBoard(emptyBoard());
              setShape(randomShape());
              setNextShape(randomShape());
              setHoldShape(null);
              setPos({ x: 3, y: 0 });
              setGameOver(false);
              setCanHold(true);
              setLines(0);
              setTimer(0);
              setScore(0);
              setLastGain(0);
            }}
            style={{
              padding: "8px 24px",
              fontSize: "1rem",
              borderRadius: 4,
              border: "none",
              background: "#09f",
              color: "#fff",
              cursor: "pointer",
              marginTop: 16
            }}
          >
            Restart
          </button>
          <div style={{ color: "#fff", marginTop: 8, fontSize: 14 }}>
          <div>Move: ← → ↓ | Rotate: ↑ | Hard Drop: Space | Hold: Shift</div>
        </div>
        {/* ปุ่ม Support ที่ขวาล่าง */}
        <SupportButton />
        {/* เครดิต */}
        <div
          style={{
            position: "fixed",
            bottom: 8,
            right: 12,
            color: "#aaa",
            fontSize: 13,
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 1
          }}
        >
          made by 404:SkillNotFound (kev)
        </div>
        {/* ปุ่ม Bug Report/Feedback */}
        <BugReportButton />
        {/* แสดงคะแนนล่าสุดที่ได้จากการเคลียร์แถว */}
        {lastGain > 0 && (
          <div style={{
            position: "absolute",
            top: 0, left: "50%", transform: "translateX(-50%)",
            color: "#ff0", fontSize: 32, fontWeight: "bold"
          }}>
            +{lastGain}
          </div>
        )}
        {showResult && mode === "blitz" && (
  <div style={{
    position: "fixed",
    top: 0, left: 0, width: "100vw", height: "100vh",
    background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2000
  }}>
    <div style={{
      background: "#23272f",
      color: "#fff",
      borderRadius: 16,
      padding: "36px 48px",
      minWidth: 320,
      textAlign: "center",
      boxShadow: "0 8px 32px #000a"
    }}>
      <h2 style={{ color: "#0ff" }}>Blitz Result</h2>
      <div style={{ fontSize: 24, margin: "16px 0" }}>
        Score: <b style={{ color: "#ff0" }}>{score}</b>
      </div>
      <div style={{ fontSize: 20, marginBottom: 16 }}>
        Speed: <b style={{ color: "#0f0" }}>{pps}</b> Piece/s
      </div>
      <button
        style={{
          padding: "10px 32px",
          fontSize: 18,
          borderRadius: 8,
          border: "none",
          background: "#09f",
          color: "#fff",
          cursor: "pointer",
          fontWeight: "bold"
        }}
        onClick={() => {
          setShowResult(false);
          setScreen("menu");
        }}
      >
        กลับเมนู
      </button>
    </div>
  </div>
)}
        </div>
      )}
    </>
  );
}

// --- Component ปุ่ม Support ---
function SupportButton() {
  const [show, setShow] = useState(false);
  return (
    <>
      <button
        onClick={() => setShow(true)}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 1000,
          background: "linear-gradient(90deg,#09f,#0f9)",
          color: "#fff",
          border: "none",
          borderRadius: 24,
          padding: "12px 28px",
          fontSize: 18,
          fontWeight: "bold",
          boxShadow: "0 4px 16px #0008",
          cursor: "pointer",
          transition: "filter 0.2s",
        }}
      >
        💖 Support
      </button>
      {show && (
        <div
          onClick={() => setShow(false)}
          style={{
            position: "fixed",
            right: 24,
            bottom: 72,
            background: "#23272fcc",
            color: "#fff",
            borderRadius: 12,
            padding: "20px 24px",
            fontSize: 18,
            boxShadow: "0 4px 24px #000a",
            zIndex: 1001,
            maxWidth: 320,
            cursor: "pointer",
            lineHeight: 1.6,
            textAlign: "center"
          }}
        >
          สนับสนุนDevได้ที่<br />
          <b>บัญชีไทยพาณิชย์ : 4058454859</b>
          <br />
          (รายชื่อโดเนทจะอัพเดทขึ้นจอ)<br />
          <span style={{ color: "#0f9" }}>ขอบคุณครับ</span>
        </div>
      )}
    </>
  );
}

// --- Component ปุ่ม Bug Report/Feedback ---
function BugReportButton() {
  const [show, setShow] = React.useState(false);
  return (
    <>
      <button
        onClick={() => setShow(true)}
        style={{
          position: "fixed",
          left: 24,
          bottom: 24,
          zIndex: 1000,
          background: "linear-gradient(90deg,#f90,#f09)",
          color: "#fff",
          border: "none",
          borderRadius: 24,
          padding: "12px 28px",
          fontSize: 16,
          fontWeight: "bold",
          boxShadow: "0 4px 16px #0008",
          cursor: "pointer",
          transition: "filter 0.2s",
        }}
      >
        🐞 Bug Report / Feedback
      </button>
      {show && (
        <div
          onClick={() => setShow(false)}
          style={{
            position: "fixed",
            left: 24,
            bottom: 72,
            background: "#23272fcc",
            color: "#fff",
            borderRadius: 12,
            padding: "20px 24px",
            fontSize: 17,
            boxShadow: "0 4px 24px #000a",
            zIndex: 1001,
            maxWidth: 340,
            cursor: "pointer",
            lineHeight: 1.6,
            textAlign: "center"
          }}
        >
          แจ้งปัญหาหรือข้อแนะนำได้ที่ :<br />
          <a
            href="https://github.com/defkevdev"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0ff", wordBreak: "break-all" }}
          >
            https://github.com/defkevdev
          </a>
        </div>
      )}
    </>
  );
}



export default App;

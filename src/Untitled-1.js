// ...existing code inside useBot...

// Evaluate a board: lower is better
function evaluateBoard(board) {
  let heights = Array(cols).fill(0);
  let holes = 0;
  for (let x = 0; x < cols; x++) {
    let blockFound = false;
    for (let y = 0; y < rows; y++) {
      if (board[y][x]) {
        if (!blockFound) {
          heights[x] = rows - y;
          blockFound = true;
        }
      } else if (blockFound) {
        holes++;
      }
    }
  }
  const maxHeight = Math.max(...heights);
  return maxHeight + holes * 2;
}

// Try all rotations and positions, return best {shape, x, rotation}
function findBestPlacement(shapeObj, board) {
  let best = null;
  let bestScore = Infinity;
  let shapeVariants = [];
  let s = shapeObj.shape;
  // Get all 4 rotations (some may be duplicates)
  for (let r = 0; r < 4; r++) {
    shapeVariants.push({ shape: s, index: shapeObj.index, rotation: r });
    s = rotate(s);
  }
  // Remove duplicate rotations
  shapeVariants = shapeVariants.filter(
    (v, i, arr) =>
      arr.findIndex(
        vv =>
          JSON.stringify(vv.shape) === JSON.stringify(v.shape)
      ) === i
  );

  // --- NEW LOGIC: If stack > 8, prefer line clears ---
  // Find current stack height
  let heights = Array(cols).fill(0);
  for (let x = 0; x < cols; x++) {
    let blockFound = false;
    for (let y = 0; y < rows; y++) {
      if (board[y][x] && !blockFound) {
        heights[x] = rows - y;
        blockFound = true;
      }
    }
  }
  const maxHeight = Math.max(...heights);

  for (const variant of shapeVariants) {
    for (let x = 0; x <= cols - variant.shape[0].length; x++) {
      // Drop down until collision
      let y = 0;
      while (!checkCollision(board, { shape: variant.shape, index: variant.index }, { x, y: y + 1 })) {
        y++;
      }
      // Simulate merge
      const merged = merge(board, { shape: variant.shape, index: variant.index }, { x, y });
      // Remove lines
      let tempBoard = merged.filter(row => row.some(cell => cell === 0));
      let linesCleared = rows - tempBoard.length;
      while (tempBoard.length < rows) tempBoard.unshift(Array(cols).fill(0));
      let score = evaluateBoard(tempBoard);

      // --- ถ้า stack เกิน 8 แถว ให้บอทเลือกวางที่เคลียร์ไลน์เท่านั้น ---
      if (maxHeight > 8) {
        // ถ้า move นี้เคลียร์ไลน์ ให้ score ต่ำมากๆ (บังคับเลือก)
        if (linesCleared > 0) score -= 1000 * linesCleared;
        // ถ้า move นี้ไม่เคลียร์ไลน์ ให้ score สูงมาก (บอทจะไม่เลือก)
        else score += 10000;
      }

      if (score < bestScore) {
        bestScore = score;
        best = { x, y, shape: variant.shape, index: variant.index };
      }
    }
  }
  return best;
}
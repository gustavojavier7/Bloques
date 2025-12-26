document.addEventListener('DOMContentLoaded', () => {
    const boardSize = 8;
    let board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));

    // 1. Estado Global para la selección
    let selectedPieceIndex = null;
    let currentPieces = [];
    let isGameOver = false;

    // --- SET DE PIEZAS ESTÁNDAR (Integrado) ---
    const pieces = [
        // BÁSICOS
        { shape: [[1]], color: '#FFD700' }, // 1x1
        { shape: [[1, 1]], color: '#FFD700' }, // 1x2 H
        { shape: [[1], [1]], color: '#FFD700' }, // 1x2 V
        // INTERMEDIOS
        { shape: [[1, 1, 1]], color: '#ff4444' }, // 1x3 H
        { shape: [[1], [1], [1]], color: '#ff4444' }, // 1x3 V
        { shape: [[1, 0], [1, 1]], color: '#4444ff' }, // L 2x2
        { shape: [[0, 1], [1, 1]], color: '#4444ff' }, // L Rotada 1
        { shape: [[1, 1], [0, 1]], color: '#4444ff' }, // L Rotada 2
        { shape: [[1, 1], [1, 0]], color: '#4444ff' }, // L Rotada 3
        // CLÁSICOS
        { shape: [[1, 1, 1, 1]], color: '#32CD32' }, // 1x4 H
        { shape: [[1], [1], [1], [1]], color: '#32CD32' }, // 1x4 V
        { shape: [[1, 1], [1, 1]], color: '#44ff44' }, // 2x2
        { shape: [[1, 1, 1], [0, 1, 0]], color: '#9370DB' }, // T
        { shape: [[0, 1, 0], [1, 1, 1]], color: '#9370DB' }, // T Invertida
        // DIFÍCILES
        { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#8B0000' }, // 3x3
        { shape: [[1, 1, 0], [0, 1, 1]], color: '#FF6347' }, // Z
        { shape: [[0, 1, 1], [1, 1, 0]], color: '#FF6347' } // S
    ];

    const gameBoard = document.getElementById('gameBoard');
    const piecesDiv = document.getElementById('pieces');
    const generateButton = document.getElementById('generate');
    const messageDiv = document.getElementById('message');

    function initializeBoard() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;

                // 1. Hover (Preview)
                cell.addEventListener('mouseenter', () => handleMouseEnter(i, j));
                cell.addEventListener('mouseleave', () => handleMouseLeave());

                // 2. Click (Colocar)
                cell.addEventListener('click', () => handleCellClick(i, j));

                gameBoard.appendChild(cell);
            }
        }
    }

    function checkGameOver() {
        const availablePieces = currentPieces.filter(piece => !piece.played);

        if (availablePieces.length === 0) return false;

        for (const piece of availablePieces) {
            for (let i = 0; i < boardSize; i++) {
                for (let j = 0; j < boardSize; j++) {
                    if (canPlacePiece(piece, i, j)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    function showGameOver() {
        isGameOver = true;
        messageDiv.textContent = 'GAME OVER - Pulsa "Generar" para reiniciar';
        messageDiv.style.color = 'red';
        gameBoard.style.opacity = '0.5';
    }

    // --- NUEVA LÓGICA DE PREVIEW (Visual) ---
    function handleMouseEnter(row, col) {
        if (isGameOver) return;
        if (selectedPieceIndex === null) return;

        const piece = currentPieces[selectedPieceIndex];
        if (!piece || piece.played) return;
        const isValid = canPlacePiece(piece, row, col);
        const color = isValid ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';

        // Dibujar "fantasma"
        drawGhost(piece, row, col, color);
    }

    function handleMouseLeave() {
        // Limpiar el fantasma (restaurar colores originales)
        refreshBoardView();
    }

    function drawGhost(piece, startRow, startCol, color) {
        refreshBoardView();
        for (let i = 0; i < piece.shape.length; i++) {
            for (let j = 0; j < piece.shape[0].length; j++) {
                if (piece.shape[i][j] === 1) {
                    const targetRow = startRow + i;
                    const targetCol = startCol + j;
                    if (targetRow < boardSize && targetCol < boardSize) {
                        const cell = document.querySelector(
                            `.cell[data-row="${targetRow}"][data-col="${targetCol}"]`
                        );
                        if (cell) {
                            cell.style.backgroundColor = color;
                        }
                    }
                }
            }
        }
    }

    function refreshBoardView() {
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const cell = document.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
                cell.style.backgroundColor = board[i][j] ?? 'white';
            }
        }
    }

    // --- TU LÓGICA DE COLOCACIÓN ---
    function handleCellClick(row, col) {
        if (isGameOver) return;
        if (selectedPieceIndex === null) return;

        const piece = currentPieces[selectedPieceIndex];
        if (!piece) return;

        if (canPlacePiece(piece, row, col)) {
            placePieceAt(piece, row, col);

            // Marcar pieza como jugada y resetear selección
            currentPieces[selectedPieceIndex].played = true;
            selectedPieceIndex = null;

            // Lógica de juego
            checkAndClearLines();
            displayPieces();

            const allPlayed = currentPieces.every(pieceOption => pieceOption.played);

            if (allPlayed) {
                setTimeout(() => {
                    generatePieces();
                    if (checkGameOver()) {
                        showGameOver();
                    }
                }, 200);
            } else {
                if (checkGameOver()) {
                    showGameOver();
                }
            }
        } else {
            messageDiv.textContent = 'No cabe ahí';
            messageDiv.style.color = '#dc3545';
            setTimeout(() => {
                messageDiv.textContent = '';
            }, 1000);
        }
    }

    function placePieceAt(piece, row, col) {
        for (let i = 0; i < piece.shape.length; i++) {
            for (let j = 0; j < piece.shape[0].length; j++) {
                if (piece.shape[i][j] === 1) {
                    board[row + i][col + j] = piece.color;
                    const cell = document.querySelector(
                        `.cell[data-row="${row + i}"][data-col="${col + j}"]`
                    );
                    cell.style.backgroundColor = piece.color;
                }
            }
        }
    }

    // 5️⃣ LIMPIEZA DE LÍNEAS CON ANIMACIÓN (Game Juice)
    function checkAndClearLines() {
        const rowsToClear = [];
        const colsToClear = [];

        // 1. Detectar filas completas (que no tengan null)
        for (let i = 0; i < boardSize; i++) {
            if (board[i].every(cell => cell !== null)) {
                rowsToClear.push(i);
            }
        }

        // 2. Detectar columnas completas
        for (let j = 0; j < boardSize; j++) {
            let colFull = true;
            for (let i = 0; i < boardSize; i++) {
                if (board[i][j] === null) {
                    colFull = false;
                    break;
                }
            }
            if (colFull) colsToClear.push(j);
        }

        // Si no hay nada que limpiar, salimos
        if (rowsToClear.length === 0 && colsToClear.length === 0) return;

        // 3. FASE DE ANIMACIÓN (Feedback Visual)
        // Marcamos las celdas sin borrar los datos todavía
        rowsToClear.forEach(r => {
            for (let j = 0; j < boardSize; j++) {
                const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${j}"]`);
                cell.classList.add('clearing');
            }
        });

        colsToClear.forEach(c => {
            for (let i = 0; i < boardSize; i++) {
                const cell = document.querySelector(`.cell[data-row="${i}"][data-col="${c}"]`);
                cell.classList.add('clearing');
            }
        });

        // 4. FASE LÓGICA (Borrado de datos)
        // Esperamos 300ms a que termine la animación
        setTimeout(() => {
            // Borrar datos del modelo
            rowsToClear.forEach(r => board[r].fill(null));
            colsToClear.forEach(c => {
                for (let i = 0; i < boardSize; i++) board[i][c] = null;
            });

            // Actualizar vista final (quita colores)
            refreshBoardView();

            // Limpiar clases de animación para la próxima vez
            document.querySelectorAll('.cell.clearing').forEach(cell => {
                cell.classList.remove('clearing');
            });

            // Aquí podrías añadir sonido: playSound('clear');
        }, 300); // 300ms coincide con 0.15s * 2 del CSS
    }

    // --- FUNCIONES AUXILIARES (Display & Helpers) ---
    function displayPieces() {
        piecesDiv.innerHTML = '';
        currentPieces.forEach((piece, index) => {
            const pieceDiv = document.createElement('div');
            pieceDiv.className = 'piece';
            if (piece.played) {
                pieceDiv.style.opacity = '0.4';
            }
            if (index === selectedPieceIndex) {
                pieceDiv.style.borderColor = '#ff0000';
                pieceDiv.style.transform = 'scale(1.1)';
            }

            pieceDiv.style.display = 'grid';
            pieceDiv.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 16px)`;
            pieceDiv.style.gap = '2px';

            piece.shape.forEach(row => {
                row.forEach(cell => {
                    const cellDiv = document.createElement('div');
                    cellDiv.style.width = '16px';
                    cellDiv.style.height = '16px';
                    cellDiv.style.backgroundColor = cell === 1 ? piece.color : 'transparent';
                    pieceDiv.appendChild(cellDiv);
                });
            });

            // Evento CLICK en la PIEZA (Selección)
            pieceDiv.addEventListener('click', event => {
                event.stopPropagation();
                if (piece.played) return;
                selectedPieceIndex = selectedPieceIndex === index ? null : index;
                displayPieces();
            });

            piecesDiv.appendChild(pieceDiv);
        });
    }

    function canPlacePiece(piece, row, col) {
        const shape = piece.shape;
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[0].length; j++) {
                if (shape[i][j] === 1) {
                    const r = row + i;
                    const c = col + j;
                    if (r >= boardSize || c >= boardSize || board[r][c] !== null) return false;
                }
            }
        }
        return true;
    }

    // --- GENERACIÓN INTELIGENTE DE PIEZAS (AI) ---
    function generatePieces() {
        currentPieces = [];
        let foundSolvableSet = false;
        let attempts = 0;
        const maxAttempts = 20; // Límite para no congelar el navegador

        // Hacemos una copia profunda del tablero actual para las simulaciones
        // (Usamos 0 y 1 para simplificar la simulación lógica, o copiamos colores si es necesario,
        // pero para validar solo nos importa si está ocupado != null)
        const currentBoardState = board.map(row => [...row]);

        while (attempts < maxAttempts && !foundSolvableSet) {
            // 1. Generar 3 candidatas al azar
            const candidates = [];
            for (let k = 0; k < 3; k++) {
                const p = pieces[Math.floor(Math.random() * pieces.length)];
                candidates.push({ ...p, played: false }); // Clonamos estructura
            }

            // 2. Preguntar al Oráculo si este set es viable
            if (canClearHand(currentBoardState, candidates)) {
                currentPieces = candidates;
                foundSolvableSet = true;
            }

            attempts++;
        }

        // PLAN B: Si el tablero está muy complicado y no encontramos combinación perfecta,
        // intentamos generar piezas muy pequeñas (salvavidas) para no matar al jugador injustamente.
        if (!foundSolvableSet) {
            //console.log("Modo Emergencia activado");
            const easyPieces = pieces.filter(p => p.shape.flat().length <= 2); // Solo piezas de 1 o 2 bloques
            currentPieces = [];
            for (let k = 0; k < 3; k++) {
                const p = easyPieces[Math.floor(Math.random() * easyPieces.length)];
                currentPieces.push({ ...p, played: false });
            }
        }

        displayPieces();

        // Verificación final: Si incluso con piezas fáciles no se puede, el juego terminará
        // en el próximo click o chequeo.
        if (checkGameOver()) {
            showGameOver();
        }
    }

    // Inicialización
    initializeBoard();
    generatePieces();

    // Reset botón
    generateButton.addEventListener('click', () => {
        board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
        selectedPieceIndex = null;
        currentPieces = [];
        isGameOver = false;
        messageDiv.textContent = '';
        messageDiv.style.color = '#dc3545';
        gameBoard.style.opacity = '1';
        initializeBoard();
        generatePieces();
    });

    // Click fuera para deseleccionar
    document.addEventListener('click', event => {
        if (!event.target.closest('.piece') && !event.target.closest('.cell')) {
            selectedPieceIndex = null;
            displayPieces();
        }
    });

    // --- MOTOR DE SIMULACIÓN (EL ORÁCULO) ---

    // Verifica si existe ALGÚN orden para colocar todas las piezas de la mano
    function canClearHand(boardState, handPieces) {
        // Caso base: Si no quedan piezas por poner, ¡hemos tenido éxito!
        if (handPieces.length === 0) return true;

        // Intentamos poner cada pieza disponible en el tablero actual
        for (let i = 0; i < handPieces.length; i++) {
            const piece = handPieces[i];
            const remainingPieces = handPieces.filter((_, index) => index !== i);

            // Probamos todas las posiciones posibles en el tablero
            for (let r = 0; r < boardSize; r++) {
                for (let c = 0; c < boardSize; c++) {
                    if (canPlaceInVirtualBoard(boardState, piece, r, c)) {
                        // SIMULACIÓN:
                        // 1. Clonar tablero (para no afectar al anterior)
                        let nextBoard = boardState.map(row => [...row]);

                        // 2. Colocar pieza virtualmente
                        placeInVirtualBoard(nextBoard, piece, r, c);

                        // 3. Limpiar líneas virtuales (CRUCIAL: esto abre espacio para la siguiente)
                        nextBoard = clearVirtualLines(nextBoard);

                        // 4. RECURSIÓN: ¿Podemos colocar el resto de piezas en este nuevo tablero?
                        if (canClearHand(nextBoard, remainingPieces)) {
                            return true; // Encontramos un camino ganador
                        }
                    }
                }
            }
        }

        // Si probamos todas las piezas en todos los lugares y nada funcionó:
        return false;
    }

    // Helpers virtuales (trabajan con datos en memoria, no con HTML)
    function canPlaceInVirtualBoard(virtualBoard, piece, row, col) {
        for (let i = 0; i < piece.shape.length; i++) {
            for (let j = 0; j < piece.shape[0].length; j++) {
                if (piece.shape[i][j] === 1) {
                    const r = row + i;
                    const c = col + j;
                    // Verifica límites y si la celda NO es null (ocupada)
                    if (r >= boardSize || c >= boardSize || virtualBoard[r][c] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function placeInVirtualBoard(virtualBoard, piece, row, col) {
        for (let i = 0; i < piece.shape.length; i++) {
            for (let j = 0; j < piece.shape[0].length; j++) {
                if (piece.shape[i][j] === 1) {
                    virtualBoard[row + i][col + j] = 'occupied'; // Marcador simple
                }
            }
        }
    }

    function clearVirtualLines(virtualBoard) {
        // Filas
        let rowsToClear = [];
        for (let i = 0; i < boardSize; i++) {
            if (virtualBoard[i].every(cell => cell !== null)) rowsToClear.push(i);
        }

        // Columnas
        let colsToClear = [];
        for (let j = 0; j < boardSize; j++) {
            let full = true;
            for (let i = 0; i < boardSize; i++) {
                if (virtualBoard[i][j] === null) full = false;
            }
            if (full) colsToClear.push(j);
        }

        if (rowsToClear.length === 0 && colsToClear.length === 0) return virtualBoard;

        // Limpieza
        rowsToClear.forEach(r => virtualBoard[r].fill(null));
        colsToClear.forEach(c => {
            for (let i = 0; i < boardSize; i++) virtualBoard[i][c] = null;
        });

        return virtualBoard;
    }
});

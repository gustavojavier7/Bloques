document.addEventListener('DOMContentLoaded', () => {
    const boardSize = 8;
    let board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));

    const neonColors = {
        yellow: '#ffd600',
        blue: '#304ffe',
        red: '#d50000',
        green: '#00e676',
        purple: '#aa00ff',
        previewValid: 'rgba(48, 79, 254, 0.3)',
        previewInvalid: 'rgba(213, 0, 0, 0.3)'
    };

    // 1. Estado Global para la selección
    let selectedPieceIndex = null;
    let currentPieces = [];
    let isGameOver = false;

    // --- SET DE PIEZAS ESTÁNDAR (Integrado) ---
    const pieces = [
        // BÁSICOS - Amarillo Neon
        { shape: [[1]], color: neonColors.yellow }, // 1x1
        { shape: [[1, 1]], color: neonColors.yellow }, // 1x2 H
        { shape: [[1], [1]], color: neonColors.yellow }, // 1x2 V
        // INTERMEDIOS - Azul Neon
        { shape: [[1, 1, 1]], color: neonColors.blue }, // 1x3 H
        { shape: [[1], [1], [1]], color: neonColors.blue }, // 1x3 V
        { shape: [[1, 0], [1, 1]], color: neonColors.blue }, // L 2x2
        { shape: [[0, 1], [1, 1]], color: neonColors.blue }, // L Rotada 1
        { shape: [[1, 1], [0, 1]], color: neonColors.blue }, // L Rotada 2
        { shape: [[1, 1], [1, 0]], color: neonColors.blue }, // L Rotada 3
        // CLÁSICOS - Rojo Neon
        { shape: [[1, 1, 1, 1]], color: neonColors.red }, // 1x4 H
        { shape: [[1], [1], [1], [1]], color: neonColors.red }, // 1x4 V
        // Extra variedad
        { shape: [[1, 1], [1, 1]], color: neonColors.green }, // 2x2
        { shape: [[1, 1, 1], [0, 1, 0]], color: neonColors.purple }, // T
        { shape: [[0, 1, 0], [1, 1, 1]], color: neonColors.purple }, // T Invertida
        // DIFÍCILES
        { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: neonColors.red }, // 3x3
        { shape: [[1, 1, 0], [0, 1, 1]], color: neonColors.red }, // Z
        { shape: [[0, 1, 1], [1, 1, 0]], color: neonColors.red } // S
    ];

    const gameBoard = document.getElementById('gameBoard');
    const piecesDiv = document.getElementById('pieces');
    const generateButton = document.getElementById('generate');
    const messageDiv = document.getElementById('message');

    function invariant(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    function validatePieces(piecesToValidate) {
        invariant(Array.isArray(piecesToValidate) && piecesToValidate.length > 0, 'No hay piezas definidas.');
        piecesToValidate.forEach((piece, index) => {
            invariant(Array.isArray(piece.shape) && piece.shape.length > 0, `Pieza inválida en índice ${index}.`);
            const rowLength = piece.shape[0].length;
            invariant(rowLength > 0, `Pieza sin columnas en índice ${index}.`);
            piece.shape.forEach(row => {
                invariant(Array.isArray(row) && row.length === rowLength, `Forma irregular en índice ${index}.`);
                row.forEach(value => {
                    invariant(value === 0 || value === 1, `Valor inválido en pieza ${index}.`);
                });
            });
            invariant(typeof piece.color === 'string' && piece.color.trim() !== '', `Color inválido en pieza ${index}.`);
        });
    }

    invariant(Number.isInteger(boardSize) && boardSize > 0, 'El tamaño del tablero debe ser un entero positivo.');
    invariant(gameBoard, 'No se encontró el tablero (#gameBoard).');
    invariant(piecesDiv, 'No se encontró el contenedor de piezas (#pieces).');
    invariant(generateButton, 'No se encontró el botón de generación (#generate).');
    invariant(messageDiv, 'No se encontró el contenedor de mensajes (#message).');
    validatePieces(pieces);

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
        messageDiv.style.color = neonColors.red;
        gameBoard.style.opacity = '0.5';
    }

    // --- NUEVA LÓGICA DE PREVIEW (Visual) ---
    function handleMouseEnter(row, col) {
        if (isGameOver) return;
        if (selectedPieceIndex === null) return;

        const piece = currentPieces[selectedPieceIndex];
        if (!piece || piece.played) return;
        const isValid = canPlacePiece(piece, row, col);

        // Dibujar "fantasma"
        drawGhost(piece, row, col, isValid);
    }

    function handleMouseLeave() {
        // Limpiar el fantasma (restaurar colores originales)
        refreshBoardView();
    }

    function drawGhost(piece, startRow, startCol, isValid) {
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
                            cell.classList.add(isValid ? 'preview-valid' : 'preview-invalid');
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
                cell.classList.remove('preview-valid', 'preview-invalid');
                cell.style.backgroundColor = board[i][j] ?? '';
            }
        }
    }

    // --- TU LÓGICA DE COLOCACIÓN ---
    async function handleCellClick(row, col) {
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
            displayPieces();
            await checkAndClearLines();

            const allPlayed = currentPieces.every(pieceOption => pieceOption.played);

            if (allPlayed) {
                setTimeout(() => {
                    generatePieces();
                    if (checkGameOver()) {
                        showGameOver();
                    }
                }, 100);
            } else {
                if (checkGameOver()) {
                    showGameOver();
                }
            }
        } else {
            messageDiv.textContent = 'No cabe ahí';
            messageDiv.style.color = neonColors.red;
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
        return new Promise(resolve => {
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
            if (rowsToClear.length === 0 && colsToClear.length === 0) {
                resolve();
                return;
            }

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
                resolve();
            }, 400); // 400ms coincide con 0.4s del CSS
        });
    }

    // --- FUNCIONES AUXILIARES (Display & Helpers) ---
    function displayPieces() {
        piecesDiv.innerHTML = '';
        currentPieces.forEach((piece, index) => {
            const pieceDiv = document.createElement('div');
            pieceDiv.className = 'piece';
            pieceDiv.classList.toggle('selected', index === selectedPieceIndex);
            if (piece.played) {
                pieceDiv.style.opacity = '0.4';
            }
            pieceDiv.style.transform = index === selectedPieceIndex ? 'scale(1.05)' : '';

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
        let attempts = 0;
        const maxAttempts = 50; // Reducido para no bloquear UI
        let found = false;
        currentPieces = [];

        // Copia del tablero real para simular (solo nos importa qué celdas no son null)
        // Mapeamos a string 'c' o null para simplificar
        const simulationBoard = board.map(row => row.map(cell => (cell !== null ? 'c' : null)));

        while (attempts < maxAttempts) {
            // Generar 3 candidatas
            const candidates = [
                { ...pieces[Math.floor(Math.random() * pieces.length)], played: false },
                { ...pieces[Math.floor(Math.random() * pieces.length)], played: false },
                { ...pieces[Math.floor(Math.random() * pieces.length)], played: false }
            ];

            if (isPieceSetSolvable(simulationBoard, candidates)) {
                currentPieces = candidates;
                found = true;
                break;
            }
            attempts++;
        }

        // PLAN DE EMERGENCIA: Si no encontramos combinación compleja, damos piezas 1x1
        if (!found) {
            //console.log("Activando modo emergencia (piezas simples)");
            const simplePiece = pieces.find(
                piece => piece.shape.length === 1 && piece.shape[0].length === 1
            ); // 1x1
            invariant(simplePiece, 'No se encontró una pieza simple 1x1.');
            currentPieces = [
                { ...simplePiece, played: false },
                { ...simplePiece, played: false },
                { ...simplePiece, played: false }
            ];
        }

        displayPieces();

        // Verificación final de muerte: Si ni siquiera las 1x1 caben, entonces sí es Game Over
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
        messageDiv.style.color = neonColors.red;
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

    // 6️⃣ HELPERS PUROS (Optimizados)
    function cloneBoard(boardState) {
        return boardState.map(row => row.slice()); // Copia superficial es suficiente para primitivos/strings
    }

    function canPlaceOnBoard(boardState, piece, row, col) {
        for (let i = 0; i < piece.shape.length; i++) {
            for (let j = 0; j < piece.shape[0].length; j++) {
                if (piece.shape[i][j] === 1) {
                    const r = row + i;
                    const c = col + j;
                    // Verificar límites y si la celda no es null (ocupada)
                    if (r >= boardSize || c >= boardSize || boardState[r][c] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // Coloca Y LIMPIA líneas (Crucial para la simulación)
    function placeAndClearOnBoard(boardState, piece, row, col) {
        const newBoard = cloneBoard(boardState);

        // 1. Colocar
        for (let i = 0; i < piece.shape.length; i++) {
            for (let j = 0; j < piece.shape[0].length; j++) {
                if (piece.shape[i][j] === 1) {
                    newBoard[row + i][col + j] = 'occupied'; // Marcador simple para simulación
                }
            }
        }

        // 2. Limpiar Líneas (Lógica simplificada para simulación)
        // Filas
        const rowsToClear = [];
        for (let i = 0; i < boardSize; i++) {
            if (newBoard[i].every(cell => cell !== null)) rowsToClear.push(i);
        }
        // Columnas
        const colsToClear = [];
        for (let j = 0; j < boardSize; j++) {
            let full = true;
            for (let i = 0; i < boardSize; i++) if (newBoard[i][j] === null) full = false;
            if (full) colsToClear.push(j);
        }

        // Aplicar limpieza
        rowsToClear.forEach(r => newBoard[r].fill(null));
        colsToClear.forEach(c => {
            for (let i = 0; i < boardSize; i++) newBoard[i][c] = null;
        });

        return newBoard;
    }

    // 7️⃣ GENERAR PERMUTACIONES
    function getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = arr.slice(0, i).concat(arr.slice(i + 1));
            for (const perm of getPermutations(rest)) {
                result.push([arr[i], ...perm]);
            }
        }
        return result;
    }

    // 8️⃣ NÚCLEO: SIMULADOR RECURSIVO
    function isPieceSetSolvable(initialBoard, pieceSet) {
        const permutations = getPermutations(pieceSet);

        // Probamos cada orden posible (A-B-C, B-A-C, etc.)
        for (const orderedPieces of permutations) {
            if (canSolveSequence(initialBoard, orderedPieces)) {
                return true; // ¡Encontramos un camino ganador!
            }
        }
        return false;
    }

    // Función recursiva que intenta colocar la secuencia dada
    function canSolveSequence(currentBoard, piecesQueue) {
        if (piecesQueue.length === 0) return true; // Caso base: todas puestas

        const [currentPiece, ...remainingPieces] = piecesQueue;

        // Buscamos CUALQUIER lugar donde quepa
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (canPlaceOnBoard(currentBoard, currentPiece, i, j)) {
                    // Simulamos colocar Y LIMPIAR
                    const nextBoard = placeAndClearOnBoard(currentBoard, currentPiece, i, j);

                    // Paso Recursivo: ¿Podemos poner el resto en este nuevo tablero?
                    if (canSolveSequence(nextBoard, remainingPieces)) {
                        return true;
                    }
                    // Si no funcionó el resto, seguimos buscando otra posición para esta pieza
                }
            }
        }

        return false; // Esta pieza no cabe en ningún lado en este turno
    }
});

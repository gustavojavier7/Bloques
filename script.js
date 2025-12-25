document.addEventListener('DOMContentLoaded', () => {
    const boardSize = 8;
    let board = Array(boardSize).fill().map(() => Array(boardSize).fill(0));
    const pieces = [
        { shape: [[1, 1, 1]], color: '#ff4444' }, // 1x3 horizontal
        { shape: [[1], [1], [1]], color: '#ff4444' }, // 1x3 vertical
        { shape: [[1, 1], [1, 1]], color: '#44ff44' }, // 2x2
        { shape: [[1, 0], [1, 1]], color: '#4444ff' }, // L shape (2x2)
        { shape: [[0, 1], [1, 1]], color: '#4444ff' }, // L shape rotated
        { shape: [[1, 1], [0, 1]], color: '#4444ff' }, // L shape rotated
        { shape: [[1, 1], [1, 0]], color: '#4444ff' }  // L shape rotated
    ];
    let currentPieces = [];

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
                gameBoard.appendChild(cell);
            }
        }
    }

    function displayPieces() {
        piecesDiv.innerHTML = '';
        currentPieces.forEach((piece, index) => {
            const pieceDiv = document.createElement('div');
            pieceDiv.className = 'piece';
            pieceDiv.textContent = `Pieza ${index + 1}`;
            pieceDiv.addEventListener('click', () => placePiece(index));
            piecesDiv.appendChild(pieceDiv);
        });
    }

    function canPlacePiece(piece, row, col) {
        const shape = piece.shape;
        const height = shape.length;
        const width = shape[0].length;

        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (shape[i][j] === 1) {
                    const boardRow = row + i;
                    const boardCol = col + j;
                    if (boardRow >= boardSize || boardCol >= boardSize || board[boardRow][boardCol] === 1) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function placePiece(index) {
        const piece = currentPieces[index];
        let placed = false;

        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (canPlacePiece(piece, i, j)) {
                    for (let row = 0; row < piece.shape.length; row++) {
                        for (let col = 0; col < piece.shape[0].length; col++) {
                            if (piece.shape[row][col] === 1) {
                                board[i + row][j + col] = 1;
                                const cell = document.querySelector(`.cell[data-row="${i + row}"][data-col="${j + col}"]`);
                                cell.style.backgroundColor = piece.color;
                            }
                        }
                    }
                    placed = true;
                    break;
                }
            }
            if (placed) break;
        }

        if (placed) {
            currentPieces.splice(index, 1);
            displayPieces();
            if (currentPieces.length === 0) {
                messageDiv.textContent = '¡Felicidades! Todas las piezas han sido colocadas. ¡Feliz Navidad!';
            }
        } else {
            messageDiv.textContent = 'No se pudo colocar la pieza. Intenta con otra posición o genera nuevas piezas.';
        }
    }

    function generatePieces() {
        currentPieces = [];
        let attempts = 0;
        const maxAttempts = 100;

        while (currentPieces.length < 3 && attempts < maxAttempts) {
            const newPiece = pieces[Math.floor(Math.random() * pieces.length)];
            let canPlace = false;

            for (let i = 0; i < boardSize; i++) {
                for (let j = 0; j < boardSize; j++) {
                    if (canPlacePiece(newPiece, i, j)) {
                        canPlace = true;
                        break;
                    }
                }
                if (canPlace) break;
            }

            if (canPlace) {
                currentPieces.push(newPiece);
            }
            attempts++;
        }

        if (currentPieces.length < 3) {
            messageDiv.textContent = 'No se pudieron generar piezas válidas. Reiniciando el tablero.';
            board = Array(boardSize).fill().map(() => Array(boardSize).fill(0));
            initializeBoard();
            generatePieces();
            return;
        }

        displayPieces();
        messageDiv.textContent = '';
    }

    initializeBoard();
    generatePieces();

    generateButton.addEventListener('click', () => {
        board = Array(boardSize).fill().map(() => Array(boardSize).fill(0));
        initializeBoard();
        generatePieces();
    });
});

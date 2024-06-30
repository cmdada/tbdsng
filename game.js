    // Background animation
    const canvas = document.getElementById('background-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const flyingImage = new Image();
    flyingImage.src = 'assets/flying_image.png';

    let imageX = canvas.width;
    let imageY = -100;

    function animateBackground() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(flyingImage, imageX, imageY, 100, 100);

        imageX -= 2; 
        imageY += 1.12; 

        if (imageX < -100 || imageY > canvas.height) {
            imageX = canvas.width;
            imageY = -100;
        }

        requestAnimationFrame(animateBackground);
    }

    flyingImage.onload = animateBackground;

    // Phaser game scenes
    class MainScene extends Phaser.Scene {
        constructor() {
            super('MainScene');
        }

        preload() {
            this.load.image('backgroundbuild', 'assets/bgbuild.png');
            this.load.video('intro', 'assets/intro.mp4');
        }

        create() {
            this.add.image(400, 300, 'backgroundbuild');
            this.startText = this.add.text(200, 450, 'start', { fontSize: '20px' });
            this.optionsText = this.add.text(600, 450, 'options', { fontSize: '20px' });
            this.titleText = this.add.text(400, 50, 'Build a table to win their heart!', {
                fontSize: '24px',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);

            this.startText.setInteractive();
            this.startText.on('pointerdown', () => {
                this.scene.start('IntroScene');
            });

            this.optionsText.setInteractive();
            this.optionsText.on('pointerdown', showOptionsWindow);
        }

        update() {
            // Game logic goes here :3
        }
    }
class IntroScene extends Phaser.Scene {
        constructor() {
            super('IntroScene');
        }
    
        create() {
            const video = this.add.video(400, 300, 'intro');
            video.play();
            video.on('complete', function() {
                this.scene.start('TableBuildingScene');
            }, this);
    
            // Add skip button
            const skipButton = this.add.text(700, 550, 'Skip', {
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#4a4a4a',
                padding: { x: 10, y: 5 }
            }).setInteractive();
    
            skipButton.on('pointerdown', () => {
                video.stop();
                this.scene.start('TableBuildingScene');
            });
        }
    }
class TableBuildingScene extends Phaser.Scene {
    preload() {
        this.load.image('background', 'assets/bg.png');
        this.load.image('tablepiece', 'assets/table.png');
    }

    constructor() {
        super('TableBuildingScene');
        this.template = [
            { x: 200, y: 300, angle: 0 }, // leg 1
            { x: 250, y: 400, angle: 0 }, // bottom 1
            { x: 300, y: 300, angle: 0 }, // leg 2
            { x: 400, y: 300, angle: 0 }, // leg 3
            { x: 450, y: 400, angle: 0 }, // bottom 2
            { x: 500, y: 300, angle: 0 }, // leg 4
            { x: 350, y: 200, angle: 0 }  // top
        ];
    }

    create() {
        this.add.image(400, 300, 'background');

        this.add.text(400, 50, 'Build Your Table!', {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.pieces = [];
        this.currentPiece = null;
        this.lastPlacedPoint = null;

        this.input.on('pointerdown', this.startPlacement, this);
        this.input.on('pointermove', this.movePiece, this);
        this.input.on('pointerup', this.endPlacement, this);

        this.finishButton = this.add.text(700, 550, 'Finish', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#4a4a4a',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        this.finishButton.on('pointerdown', this.finishTable, this);

        this.instructionText = this.add.text(400, 100, 'Build a table with 4 legs and a top. Time limit: 30 seconds', {
            fontSize: '18px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.timeText = this.add.text(50, 50, 'Time: 30', { fontSize: '18px', fill: '#ffffff' });
        this.scoreText = this.add.text(50, 80, 'Score: 0', { fontSize: '18px', fill: '#ffffff' });

        this.timeLeft = 30;
        this.score = 0;

        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // Draw template pieces
        this.drawTemplate();
    }

    drawTemplate() {
        this.template.forEach(piece => {
            this.add.image(piece.x, piece.y, 'tablepiece')
                .setAlpha(0.3)
                .setAngle(piece.angle)
                .setTint(0xff0000);
        });
    }

    startPlacement(pointer) {
        if (this.timeLeft > 0 && !this.isPointerOverButton(pointer)) {
            this.currentPiece = this.add.image(pointer.x, pointer.y, 'tablepiece').setInteractive();
            this.input.setDraggable(this.currentPiece);
        }
    }

    movePiece(pointer) {
        if (this.currentPiece) {
            this.currentPiece.x = pointer.x;
            this.currentPiece.y = pointer.y;
        }
    }

    endPlacement(pointer) {
        if (this.currentPiece) {
            this.pieces.push(this.currentPiece);
            this.currentPiece = null;
        }
    }

    isPointerOverButton(pointer) {
        const finishBounds = this.finishButton.getBounds();
        return pointer.x >= finishBounds.x && pointer.x <= finishBounds.x + finishBounds.width &&
               pointer.y >= finishBounds.y && pointer.y <= finishBounds.y + finishBounds.height;
    }

    updateTimer() {
        this.timeLeft--;
        this.timeText.setText('Time: ' + this.timeLeft);

        if (this.timeLeft <= 0) {
            this.timer.remove();
            this.finishTable();
        }
    }

    finishTable() {
        this.timer.remove();

        let averageCoverage = this.evaluateTable();
        this.score += averageCoverage;

        this.add.text(400, 350, 'Accuracy: ' + averageCoverage.toFixed(2) + '%', {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.time.delayedCall(10000, () => {
            this.scene.start('MainScene');
        });
    }

    evaluateTable() {
        let totalCoverage = 0;
        let totalPiecesCovered = 0;

        this.template.forEach(tempPiece => {
            let bestCoverage = 0;

            this.pieces.forEach(piece => {
                const distance = Phaser.Math.Distance.Between(tempPiece.x, tempPiece.y, piece.x, piece.y);
                const angleDiff = Math.abs(tempPiece.angle - piece.angle);
                const coverage = 100 - (distance / 5) - (angleDiff / 3);
                bestCoverage = Math.max(bestCoverage, coverage);
            });

            totalCoverage += bestCoverage;
            totalPiecesCovered++;
        });

        const averageCoverage = totalCoverage / totalPiecesCovered;
        return Math.max(0, Math.min(100, averageCoverage));
    }
}    
    // Phaser game configuration
    let game;
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game',
        scene: [MainScene, IntroScene, TableBuildingScene]
    };

    // Options window functionality
    const optionsWindow = document.getElementById('options-window');
    const applyButton = document.getElementById('apply-options');
    const closeButton = document.getElementById('close-options');
    const fontSizeSelect = document.getElementById('font-size');
    const bgColorInput1 = document.getElementById('bg-color-1');
    const bgColorInput2 = document.getElementById('bg-color-2');

    function showOptionsWindow() {
        optionsWindow.style.display = 'block';
    }

    function hideOptionsWindow() {
        optionsWindow.style.display = 'none';
    }

    function applyOptions() {
        const fontSize = fontSizeSelect.value + 'px';
        const bgColor1 = bgColorInput1.value;
        const bgColor2 = bgColorInput2.value;

        if (game && game.scene.scenes[0]) {
            game.scene.scenes[0].startText.setFontSize(fontSize);
            game.scene.scenes[0].optionsText.setFontSize(fontSize);
            game.scene.scenes[0].titleText.setFontSize(parseInt(fontSize) + 4 + 'px');
        }

        document.body.style.background = `linear-gradient(to bottom right, ${bgColor1}, ${bgColor2})`;

        hideOptionsWindow();
    }

    applyButton.addEventListener('click', applyOptions);
    closeButton.addEventListener('click', hideOptionsWindow);

    function checkScreenSize() {
        const gameContainer = document.getElementById('game-container');
        const smallScreenMessage = document.getElementById('small-screen-message');
        const minWidth = 800; // Minimum width to show the game

        if (window.innerWidth < minWidth) {
            gameContainer.style.display = 'none';
            smallScreenMessage.style.display = 'block';
            if (game) {
                game.destroy(true);
                game = null;
            }
        } else {
            gameContainer.style.display = 'block';
            smallScreenMessage.style.display = 'none';
            if (!game) {
                game = new Phaser.Game(config);
                game.scene.start('MainScene');
            }
        }
    }

    // Call the function initially and on window resize
    window.addEventListener('load', checkScreenSize);
    window.addEventListener('resize', checkScreenSize);

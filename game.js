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
        }

        constructor() {
            super('TableBuildingScene');
            this.template = [
                { x1: 200, y1: 200, x2: 200, y2: 400 }, // leg 1
                { x1: 200, y1: 400, x2: 300, y2: 400 }, // bottom 1
                { x1: 300, y1: 200, x2: 300, y2: 400 }, // leg 2
                { x1: 400, y1: 200, x2: 400, y2: 400 }, // leg 3
                { x1: 400, y1: 400, x2: 500, y2: 400 }, // bottom 2
                { x1: 500, y1: 200, x2: 500, y2: 400 }, // leg 4
                { x1: 200, y1: 200, x2: 500, y2: 200 }  // top
            ];
        }
    
        create() {
			this.add.image(400, 300, 'background');

            this.add.text(400, 50, 'Build Your Table!', {
                fontSize: '24px',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
    
            this.graphics = this.add.graphics();
            this.lines = [];
            this.currentLine = null;
            this.lastEndPoint = null;
    
            this.input.on('pointerdown', this.startLine, this);
            this.input.on('pointermove', this.drawLine, this);
            this.input.on('pointerup', this.endLine, this);
    
            this.finishButton = this.add.text(700, 550, 'Finish', {
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#4a4a4a',
                padding: { x: 10, y: 5 }
            }).setInteractive();
    
            this.finishButton.on('pointerdown', this.finishTable, this);
    
            this.instructionText = this.add.text(400, 100, 'Draw a table with 4 legs and a top. Time limit: 30 seconds', {
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
    
            // Draw template lines
            this.drawTemplate();
        }
    
        drawTemplate() {
            this.graphics.lineStyle(2, 0xff0000); // Red color for template lines
            this.template.forEach(line => {
                this.graphics.strokeLineShape(new Phaser.Geom.Line(line.x1, line.y1, line.x2, line.y2));
            });
        }
    
        startLine(pointer) {
            if (this.timeLeft > 0 && !this.isPointerOverButton(pointer)) {
                if (this.lastEndPoint) {
                    this.currentLine = new Phaser.Geom.Line(this.lastEndPoint.x, this.lastEndPoint.y, pointer.x, pointer.y);
                } else {
                    this.currentLine = new Phaser.Geom.Line(pointer.x, pointer.y, pointer.x, pointer.y);
                }
            }
        }
    
        isPointerOverButton(pointer) {
            const finishBounds = this.finishButton.getBounds();
            return pointer.x >= finishBounds.x && pointer.x <= finishBounds.x + finishBounds.width &&
                   pointer.y >= finishBounds.y && pointer.y <= finishBounds.y + finishBounds.height;
        }
    
        drawLine(pointer) {
            if (!this.currentLine || this.timeLeft <= 0) return;
    
            this.currentLine.x2 = pointer.x;
            this.currentLine.y2 = pointer.y;
    
            this.graphics.clear();
            this.graphics.lineStyle(2, 0xffffff); // White color for player lines
    
            this.lines.forEach(line => {
                this.graphics.strokeLineShape(line);
            });
            this.graphics.strokeLineShape(this.currentLine);
    
            // Redraw template lines
            this.drawTemplate();
        }
    
        endLine(pointer) {
            if (!this.currentLine || this.timeLeft <= 0) return;
    
            this.lines.push(this.currentLine);
            this.lastEndPoint = { x: this.currentLine.x2, y: this.currentLine.y2 };
            this.currentLine = null;
    
            this.graphics.clear();
            this.graphics.lineStyle(2, 0xffffff); // White color for player lines
            this.lines.forEach(line => {
                this.graphics.strokeLineShape(line);
            });
    
            // Redraw template lines
            this.drawTemplate();
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
            let totalLinesCovered = 0;
    
            this.template.forEach(tempLine => {
                let coveredLength = 0;
    
                this.lines.forEach(line => {
                    const intersect = Phaser.Geom.Intersects.LineToLine(tempLine, line);
                    if (intersect) {
                        const segmentLength = this.getIntersectionLength(tempLine, line);
                        coveredLength += segmentLength;
                    }
                });
    
                const lineLength = Phaser.Math.Distance.Between(tempLine.x1, tempLine.y1, tempLine.x2, tempLine.y2);
                const coveragePercentage = (coveredLength / lineLength) * 100;
                totalCoverage += coveragePercentage;
                totalLinesCovered++;
            });
    
            const averageCoverage = totalCoverage / totalLinesCovered;
            return averageCoverage;
        }
    
        getIntersectionLength(line1, line2) {
            const x1 = line1.x1;
            const y1 = line1.y1;
            const x2 = line1.x2;
            const y2 = line1.y2;
    
            const x3 = line2.x1;
            const y3 = line2.y1;
            const x4 = line2.x2;
            const y4 = line2.y2;
    
            const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (denom === 0) {
                return 0; // Parallel lines
            }
    
            const intersectX = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
            const intersectY = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;
    
            const dist1 = Phaser.Math.Distance.Between(x1, y1, intersectX, intersectY);
            const dist2 = Phaser.Math.Distance.Between(x2, y2, intersectX, intersectY);
    
            return Math.min(dist1, dist2);
        }
    
        isLineClose(line1, line2, tolerance) {
            return Phaser.Math.Distance.Between(line1.x1, line1.y1, line2.x1, line2.y1) < tolerance &&
                   Phaser.Math.Distance.Between(line1.x2, line1.y2, line2.x2, line2.y2) < tolerance;
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

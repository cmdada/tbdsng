// Background animation
const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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

class VisualNovelScene extends Phaser.Scene {
    constructor() {
        super('VisualNovelScene');
        this.currentScene = 'intro';
        this.characters = {
            you: { name: 'You', image: 'you' },
            molly: { name: 'Molly', image: 'molly' }
        };
        this.script = null;
    }

    preload() {
        this.load.image('background', 'assets/coffee_bg.png');
        this.load.image('you', 'assets/you.png');
        this.load.image('molly', 'assets/molly.png');
        this.load.json('vnScript', 'scenes/vn_script.json');
        this.load.on('filecomplete-json-vnScript', function() {
            console.log('vnScript loaded successfully');
        });
        this.load.on('loaderror', function(file) {
            console.error('Error loading file:', file.key);
        });
    }

    create() {
        this.add.image(400, 300, 'background');
        this.dialogueBox = this.add.rectangle(400, 500, 700, 150, 0x000000, 0.5).setOrigin(0.5);
        this.dialogueText = this.add.text(50, 450, '', { fontSize: '18px', fill: '#ffffff', wordWrap: { width: 700 } });
        
        this.youSprite = this.add.image(200, 249.5, 'you').setScale(0.5).setAlpha(0);
        this.mollySprite = this.add.image(600, 263, 'molly').setScale(0.3).setAlpha(0);
        
        try {
            this.script = this.cache.json.get('vnScript');
            console.log('Loaded script:', this.script);
            if (!this.script) {
                throw new Error('Failed to load vnScript');
            }
            this.displayContent(this.currentScene);
        } catch (error) {
            console.error('Error loading script:', error);
            this.dialogueText.setText('Error loading script. Please check the console for details.');
        }

        // Add spacebar input
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKey.on('down', this.handleInput, this);

        // Add a text to instruct the player
        this.instructionText = this.add.text(400, 580, 'Press SPACEBAR to continue', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }

    handleInput() {
        if (this.currentDialogueIndex < this.currentScene.dialogue.length) {
            this.displayNextDialogue();
        } else if (this.currentScene.choices) {
            // If there are choices, pressing space does nothing
            // The player needs to click on a choice
        } else {
            // If there are no more dialogues or choices, you might want to end the scene or move to the next one
            console.log('End of current scene');
        }
    }

    displayContent(sceneId) {
        if (!this.script) {
            console.error('Script is not loaded');
            this.dialogueText.setText('Error: Script is not loaded');
            return;
        }

        this.currentScene = sceneId;
        const scene = this.script[sceneId];
        
        if (!scene) {
            console.error(`Scene ${sceneId} not found`);
            this.dialogueText.setText(`Error: Scene "${sceneId}" not found. Please check the script.`);
            return;
        }

        this.currentDialogueIndex = 0;
        this.currentScene = scene;
        this.displayNextDialogue();
    }

    displayNextDialogue() {
        if (this.currentDialogueIndex < this.currentScene.dialogue.length) {
            const dialogue = this.currentScene.dialogue[this.currentDialogueIndex];
            this.displayDialogue(dialogue);
            this.currentDialogueIndex++;
        } else {
            this.displayChoices(this.currentScene.choices);
        }
    }

    displayDialogue(dialogue) {
        const { character, text } = dialogue;
        this.dialogueText.setText(`${this.characters[character].name}: ${text}`);

        // Show and highlight speaking character
        Object.keys(this.characters).forEach(char => {
            const sprite = this[`${char}Sprite`];
            if (sprite) {
                sprite.setAlpha(character === char ? 1 : 0.5);
            }
        });
    }

    displayChoices(choices) {
        // Clear existing choices
        this.children.list
            .filter(child => child.type === 'Text' && child.y > 530 && child.y < 580)
            .forEach(child => child.destroy());

        choices.forEach((choice, index) => {
            const choiceText = this.add.text(400, 530 + index * 30, choice.text, { 
                fontSize: '16px', 
                fill: '#ffffff',
                backgroundColor: '#4a4a4a',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive();
    
            choiceText.on('pointerdown', () => {
                this.handleChoice(choice.nextScene);
            });
        });

        // Hide the spacebar instruction when showing choices
        if (this.instructionText) {
            this.instructionText.setVisible(false);
        }
    }
    
    handleChoice(nextScene) {
        this.displayContent(nextScene);
        // Show the spacebar instruction again after making a choice
        if (this.instructionText) {
            this.instructionText.setVisible(true);
        }
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
            this.scene.start('VisualNovelScene');
        }, this);

        const skipButton = this.add.text(700, 550, 'Skip', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#4a4a4a',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        skipButton.on('pointerdown', () => {
            video.stop();
            this.scene.start('VisualNovelScene');
        });
    }
}

class TableBuildingScene extends Phaser.Scene {
    preload() {
        this.load.image('background', 'assets/bg.png');
        this.load.image('tablepiece', 'assets/tablepiece.png');
    }

    constructor() {
        super('TableBuildingScene');
        this.template = this.createTableTemplate();
    }

    createTableTemplate() {
        const centerX = 400;
        const centerY = 300;
        const tableWidth = 10;
        const tableHeight = 6;
        const legHeight = 5;
        const template = [];

        for (let x = 0; x < tableWidth; x++) {
            for (let y = 0; y < tableHeight; y++) {
                template.push({
                    x: centerX - (tableWidth * 10) + (x * 20) + 10,
                    y: centerY - (tableHeight * 10) + (y * 20) + 10,
                    angle: 0
                });
            }
        }

        const legPositions = [
            { x: centerX - (tableWidth * 10) + 10, y: centerY + (tableHeight * 10) },
            { x: centerX + (tableWidth * 10) - 10, y: centerY + (tableHeight * 10) }
        ];

        legPositions.forEach(pos => {
            for (let i = 0; i < legHeight; i++) {
                template.push({
                    x: pos.x,
                    y: pos.y + (i * 20),
                    angle: 0
                });
            }
        });

        return template;
    }

    create() {
        this.add.image(400, 300, 'background');

        this.add.text(400, 50, 'Build Your Table!', {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.pieces = [];
        this.isDrawing = false;
        this.lastDrawnTime = 0;
        this.drawInterval = 5;

        this.input.on('pointerdown', this.startDrawing, this);
        this.input.on('pointermove', this.continueDraw, this);
        this.input.on('pointerup', this.stopDrawing, this);

        this.finishButton = this.add.text(700, 550, 'Finish', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#4a4a4a',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        this.finishButton.on('pointerdown', this.finishTable, this);

        this.instructionText = this.add.text(400, 100, 'Draw to complete the template before the time runs out!', {
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

        this.templateSet = new Set(this.template.map(piece => `${piece.x},${piece.y}`));

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

    startDrawing(pointer) {
        if (this.timeLeft > 0 && !this.isPointerOverButton(pointer)) {
            this.isDrawing = true;
            this.lastDrawnTime = 0;
            this.drawPiece(pointer);
        }
    }

    continueDraw(pointer) {
        if (this.isDrawing && this.timeLeft > 0) {
            const currentTime = this.time.now;
            if (currentTime - this.lastDrawnTime >= this.drawInterval) {
                this.drawPiece(pointer);
                this.lastDrawnTime = currentTime;
            }
        }
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    drawPiece(pointer) {
        if (!this.isPointerOverButton(pointer)) {
            const newPiece = this.add.image(pointer.x, pointer.y, 'tablepiece').setInteractive();
            this.pieces.push(newPiece);
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

        let accuracy = this.evaluateTable();
        this.score += accuracy;

        this.add.text(400, 350, 'Accuracy: ' + accuracy.toFixed(2) + '%', {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.time.delayedCall(10000, () => {
            this.scene.start('MainScene');
        });
    }

    isPointInTemplate(x, y) {
        for (let dx = -10; dx <= 10; dx++) {
            for (let dy = -10; dy <= 10; dy++) {
                if (this.templateSet.has(`${Math.round(x + dx)},${Math.round(y + dy)}`)) {
                    return true;
                }
            }
        }
        return false;
    }

    evaluateTable() {
        const templatePixelCount = this.template.length * 400;
        let coveredPixelCount = 0;
        let excessPixelCount = 0;
        let totalDrawnPixels = 0;

        this.pieces.forEach(piece => {
            const bounds = piece.getBounds();
            for (let x = bounds.left; x < bounds.right; x++) {
                for (let y = bounds.top; y < bounds.bottom; y++) {
                    totalDrawnPixels++;
                    if (this.isPointInTemplate(x, y)) {
                        coveredPixelCount++;
                    } else {
                        excessPixelCount++;
                    }
                }
            }
        });

        const coveragePercent = (coveredPixelCount / templatePixelCount) * 100;
        const excessPercent = (excessPixelCount / totalDrawnPixels) * 100;
        const accuracy = Math.max(0, coveragePercent - (excessPercent * 0.5));

        return Math.min(100, accuracy);
    }
}

// Phaser game configuration
let game;
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    scene: [MainScene, IntroScene, VisualNovelScene, TableBuildingScene]
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
    const minWidth = 800;

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

window.addEventListener('load', checkScreenSize);
window.addEventListener('resize', checkScreenSize);

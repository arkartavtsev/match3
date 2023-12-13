import * as PIXI from "pixi.js";
import { App } from "../system/App";
import { Scene } from "../system/Scene";
import { Board } from "./Board";
import { CombinationManager } from "./CombinationManager";

export class Game {
    constructor() {
        this.container = new PIXI.Container();
        this.board = new Board();
        this.combinationManager = new CombinationManager(this.board);
        
        this.board.container.on("tile-touch-start", this.onTileClick.bind(this));

        this.create();
    }

    create() {
        this.createBackground();
        this.createBoard();
        this.removeStartMatches();
    }
    createBackground() {
        this.bg = App.sprite("bg");
        this.bg.width = window.innerWidth;
        this.bg.height = window.innerHeight;
        this.container.addChild(this.bg);
    }
    createBoard() {
        this.container.addChild(this.board.container);
    }

    removeStartMatches() {
        let matches = this.combinationManager.getMatches();

        while(matches.length) {
            this.removeMatches(matches);

            const fields = this.board.fields.filter(field => field.tile === null);

            fields.forEach(field => { 
                this.board.createTile(field);
            });

            matches = this.combinationManager.getMatches();
        }
    }

    onTileClick(tile) {
        if (this.disabled) {
            return;
        }

        if (this.selectedTile) {
            if (!this.selectedTile.isNeighbour(tile)) {
                this.clearSelection(tile);
                this.selectTile(tile);
            } else {
                this.swap(this.selectedTile, tile);
            }
        } else {
            this.selectTile(tile);
        }
    }
    selectTile(tile) {
        this.selectedTile = tile;
        this.selectedTile.field.select();
    }

    clearSelection() {
        if (this.selectedTile) {
            this.selectedTile.field.unselect();
            this.selectedTile = null;
        }
    }

    swap(selectedTile, tile) {
        this.disabled = true;

        this.clearSelection();

        selectedTile.sprite.zIndex = 2;
        selectedTile.moveTo(tile.field.position, 0.2);

        tile.moveTo(selectedTile.field.position, 0.2).then(() => {
            this.board.swap(selectedTile, tile);
            
            const matches = this.combinationManager.getMatches();

            if (matches.length) {
                this.processMatches(matches);
            }

            this.disabled = false;
        });
    }

    processMatches(matches) {
        this.removeMatches(matches);
        this.processFallDown()
            .then(() => this.addTiles())
            .then(() => this.onFallDownOver());;
    }

    removeMatches(matches) {
        matches.forEach(match => {
            match.forEach(tile => {
                tile.remove();
            });
        });
    }

    addTiles() {
        return new Promise(resolve => {
            const fields = this.board.fields.filter((field) => field.tile === null);
            let total = fields.length;
            let completed = 0;

            fields.forEach((field) => {
                const tile = this.board.createTile(field);
                const delay = Math.random() * 2 / 10 + 0.3 / (field.row + 1);

                tile.sprite.y = -500;
                tile.fallDownTo(field.position, delay).then(() => {
                    ++completed;

                    if (completed >= total) {
                        resolve();
                    }
                });
            });
        });
    }

    onFallDownOver() {
        const matches = this.combinationManager.getMatches();

        if (matches.length) {
            this.processMatches(matches)
        } else {
            this.disabled = false;
        }
    }

    processFallDown() {
        return new Promise(resolve => {
            let completed = 0;
            let started = 0;

            for (let row = this.board.rows - 1; row >= 0; row--) {
                for (let col = this.board.cols - 1; col >= 0; col--) {
                    const field = this.board.getField(row, col);

                    if (!field.tile) {
                        ++started;

                        this.fallDownTo(field).then(() => {
                            ++completed;

                            if (completed >= started) {
                                resolve();
                            }
                        });
                    }
                }
            }
        });
    }

    fallDownTo(emptyField) {
        for (let row = emptyField.row - 1; row >= 0; row--) {
            let fallingField = this.board.getField(row, emptyField.col);

            if (fallingField.tile) {
                const fallingTile = fallingField.tile;
                
                fallingTile.field = emptyField;
                emptyField.tile = fallingTile;
                fallingField.tile = null;

                return fallingTile.fallDownTo(emptyField.position);
            }
        }

        return Promise.resolve();
    }
}

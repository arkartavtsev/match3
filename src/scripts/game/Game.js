import * as PIXI from "pixi.js";
import { App } from "../system/App";
import { Scene } from "../system/Scene";
import { Board } from "./Board";

export class Game {
    constructor() {
        this.container = new PIXI.Container();
        this.board = new Board();
        
        this.board.container.on("tile-touch-start", this.onTileClick.bind(this));

        this.create();
    }

    create() {
        this.createBackground();
        this.createBoard();
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

    swap(selectedTile, tile) {
        this.disabled = true;

        this.clearSelection();

        selectedTile.sprite.zIndex = 2;
        selectedTile.moveTo(tile.field.position, 0.2);

        tile.moveTo(selectedTile.field.position, 0.2).then(() => {
            this.board.swap(selectedTile, tile);
            this.disabled = false;
        });
    }
    clearSelection() {
        if (this.selectedTile) {
            this.selectedTile.field.unselect();
            this.selectedTile = null;
        }
    }
}

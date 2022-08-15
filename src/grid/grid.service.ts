import { Injectable } from '@nestjs/common';
import { FileService } from 'src/file/file.service';
import { GridStartInfo } from './dto/gridStartInfo.dto';
import { LoadedGame } from './dto/loadedGame.dto';
import { CheckOperation } from './dto/checkOperation.dto';
import { TileData } from './interfaces/tileData.interface';
import { BOMB_MAX_POSSIBILITY, BOMB_MIN_POSSIBILITY, GAME_STATE, GRID_HEIGHT, GRID_WIDTH } from './utils/constants';

export type GameData = {
    userId: number, //user owner of the game object
    mapData: TileData[][], //tile data containg a bomb and hint number
    mapMarked: number[][], //marked as bomb by a player
    mapChecked: number[][], //checked by a player
    bombCount: number, //bombs in total
    gameStatus: GAME_STATE //curreny game object status
}

@Injectable()
export class GridService {

    private gameStateObjects : {[key: number]: GameData} = {} 

    constructor(private fileService: FileService){

    }

    //generating a random sequence of bomb within an array
    generateRandomBombSequence(bombsAmount: number, maxElementsCount: number) : number[] {
        let array = new Array(maxElementsCount).fill(0);
        let bombCounter = 0;
        for (let i=0; i < maxElementsCount; i++){
            if (bombCounter < bombsAmount){
                array[i] = 1;
                bombCounter++;
            } else {
                break;
            }
        }
        return array.map(value => ({value, sort: Math.random()})).sort((a, b) => a.sort - b.sort).map(e => e.value);
    }

    calculateHintNumberAroundTile(i: number, j: number, mapData: TileData[][]) : number {
        let bombSummary = 0;
        for (let ilocal=i-1; ilocal < i+2; ilocal++){
            for (let jlocal=j-1; jlocal < j+2; jlocal++){
                if (ilocal >= 0 && ilocal < GRID_HEIGHT && jlocal >= 0 && jlocal < GRID_WIDTH){
                    if (mapData[ilocal][jlocal].containsBomb){
                        ++bombSummary;
                    }
                }
            }
        }
        return bombSummary;
    }

    //generating user game data object
    async generate(userId: number){
        let gameState = this.gameStateObjects[userId] = {
            userId,
            mapData: [],
            mapMarked: [],
            mapChecked: [],
            bombCount: 0,
            gameStatus: GAME_STATE.IN_PROCESS
        };
        let mapData = []; //tiles information
        let mapMarked = []; //tiles clicked by user
        let mapChecked = [];
        let tilesCount = GRID_HEIGHT * GRID_WIDTH; //tiles amount
        let maxBombCount = Math.floor(tilesCount * BOMB_MAX_POSSIBILITY); //max bombs per grid
        let minBombCount = Math.floor(tilesCount * BOMB_MIN_POSSIBILITY); //min bombs per grid
        let bombCountSetByRandom = Math.floor(Math.random() * (maxBombCount - minBombCount))+minBombCount; //max bomb amount per grid selected
        gameState.bombCount = bombCountSetByRandom; //update game state bombs amount
        let bombCounter = 0; //counter index to fill grid with bombs
        let bombSequence = this.generateRandomBombSequence(bombCountSetByRandom, tilesCount); //bomb sequence generated
        for (let i=0; i < GRID_HEIGHT; i++){
            mapData[i] = [];
            mapMarked[i] = [];
            mapChecked[i] = [];
            for (let j=0; j < GRID_WIDTH; j++){
                let bombExistsAtTile = false;
                if (bombSequence[bombCounter++] == 1)
                    bombExistsAtTile = true; //setting bomb
                mapData[i][j] = {containsBomb: bombExistsAtTile, hintNumber: 0};
                mapMarked[i][j] = 0;
                mapChecked[i][j] = 0;
            }
        }
        for (let i=0; i < GRID_HEIGHT; i++){
            for (let j=0; j < GRID_WIDTH; j++){
                mapData[i][j].hintNumber = this.calculateHintNumberAroundTile(i, j, mapData);
            }
        }
        //this.testConsoleLogOfGeneratedGrid(mapData);
        gameState.mapData = mapData;
        gameState.mapMarked = mapMarked;
        gameState.mapChecked = mapChecked;
        await this.fileService.saveUserGameData(userId, gameState);
    }

    //for testing purposes only. Logging generated grid to console
    testConsoleLogOfGeneratedGrid(mapData){
        for (let i=0; i < GRID_HEIGHT; i++){
            let list = [];
            for (let j=0; j < GRID_WIDTH; j++){
                let value = mapData[i][j];
                if (value.containsBomb){
                    list.push(9); //9 for bomb (for testing)
                } else {
                    list.push(value.hintNumber);
                }
            }
            console.log(list);
        }
    }

    //check existing an unfinished game
    async getSave(userId: number) : Promise<boolean> {
        const gameData = await this.fileService.loadUserGameData(userId);
        if (gameData){
            if ((gameData as GameData).gameStatus == GAME_STATE.IN_PROCESS)
                return true;
        }
        return false;
    }

    //check and return (load) an unfinished game
    async loadGame(userId: number) : Promise<LoadedGame | boolean> {
        const gameData = await this.fileService.loadUserGameData(userId);
        if (gameData){
            let gameObject = gameData as GameData;
            if (gameObject.gameStatus != GAME_STATE.IN_PROCESS){
                return false;
            }
            let loadedGame: LoadedGame = {
                hints: [],
                marked: [],
                checked: [],
                width: gameObject.mapData[0].length,
                height: gameObject.mapData.length,
                bombCount: gameObject.bombCount
            };
            let tilesData = gameObject.mapData;
            for (let i=0; i < tilesData.length; i++){
                for (let j=0; j < tilesData[i].length; j++){
                    if (gameObject.mapChecked[i][j] == 1){
                        loadedGame.checked.push(1);
                        loadedGame.hints.push(tilesData[i][j].hintNumber);
                    } else {
                        loadedGame.checked.push(0);
                        loadedGame.hints.push(0);
                    }
                    loadedGame.marked.push(gameObject.mapMarked[i][j]);
                }
            }
            this.gameStateObjects[userId] = gameObject;
            return loadedGame;
        } else {
            return false;
        }
    }

    //getting start information about grid size and bombs amount
    getGridStartInfo(userId: number): GridStartInfo {
        let bombCount = this.gameStateObjects[userId].bombCount;
        return {width: GRID_WIDTH, height: GRID_HEIGHT, bombCount: bombCount};
    }

    //checking tile
    async checkTile(userId: number, i: number, j: number) : Promise<CheckOperation|boolean> {
        let gameState = this.gameStateObjects[userId];
        if (!gameState){
            //game is not running
            return false;
        }
        let mapData = gameState.mapData;
        let mapChecked = gameState.mapChecked;
        if (i >= 0 && i < GRID_HEIGHT && j >= 0 && j < GRID_WIDTH){
            if (mapData[i][j].containsBomb){
                mapChecked[i][j] = 1;
                gameState.gameStatus = GAME_STATE.FAILED;
                await this.fileService.saveUserGameData(userId, gameState);
                let result = [];
                for (let i=0; i < GRID_HEIGHT; i++){
                    for (let j=0; j < GRID_WIDTH; j++){
                        result.push({...gameState.mapData[i][j], ...{i, j}});
                    }
                }
                return {
                    gameStatus: GAME_STATE.FAILED,
                    result
                };
            } else {
                let hintNumber = mapData[i][j].hintNumber;
                let operationResult = {result: []};
                this.markClearAround(i, j, operationResult, gameState);
                let tilesCount = GRID_HEIGHT * GRID_WIDTH;
                let tilesChecked = 0;
                for (let i=0; i < GRID_HEIGHT; i++){
                    for (let j=0; j < GRID_WIDTH; j++){
                        if (gameState.mapChecked[i][j] == 1){
                            ++tilesChecked;
                        }
                    }
                }
                if (tilesChecked == tilesCount - gameState.bombCount){
                    gameState.gameStatus = GAME_STATE.WON;
                }
                await this.fileService.saveUserGameData(userId, gameState);
                return {
                    gameStatus: gameState.gameStatus,
                    result: operationResult.result
                }
            }
        } else {
            return false;
        }
    }

    //gathering checked tiles information
    markClearAround(i: number, j: number, operationResult: {result: TileData[]}, gameState: GameData){
        if (i >= 0 && i < GRID_HEIGHT && j >= 0 && j < GRID_WIDTH && gameState.mapChecked[i][j] == 0){
            gameState.mapChecked[i][j] = 1;
            let hintNumber = gameState.mapData[i][j].hintNumber;
            operationResult.result.push({
                containsBomb: false,
                hintNumber,
                i, j
            });
            if (hintNumber == 0){
                this.markClearAround(i-1, j, operationResult, gameState);
                this.markClearAround(i+1, j, operationResult, gameState);
                this.markClearAround(i, j-1, operationResult, gameState);
                this.markClearAround(i, j+1, operationResult, gameState);
            }
        }
    }

    async markTile(userId: number, i: number, j: number) : Promise<boolean> {
        let gameState = this.gameStateObjects[userId];
        if (!gameState){
            //game is not running
            return false;
        }
        let mapMarked = gameState.mapMarked;
        mapMarked[i][j] = mapMarked[i][j] == 0 ? 1 : 0; //set tile marked or clear it
        await this.fileService.saveUserGameData(userId, gameState); //save state
        return true;
    }

}

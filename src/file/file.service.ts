import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { GameData } from 'src/grid/grid.service';
import { User } from '../users/users.service';

@Injectable()
export class FileService {

    private usersFilepath: string 
    constructor(){
        this.usersFilepath = path.resolve(__dirname, "users-storage.json");
    }

    getUserGameFilePath(userId: number): string {
        return path.resolve(__dirname, `user-game-${userId}.json`);
    }

    async readUsers() : Promise<User[]> {
        if (fs.existsSync(this.usersFilepath)){
            let fileContent = fs.readFileSync(this.usersFilepath, 'utf-8');
            if (fileContent == '')
                fileContent = '[]';
            let parsed = [];
            try {
                parsed = JSON.parse(fileContent);
            } catch (e) {
                this.logError(e.toString());
            }
            return parsed;
        } else {
            await this.saveUsers([]);
            let fileContent = fs.readFileSync(this.usersFilepath, 'utf-8');
            let parsed = [];
            try {
                parsed = JSON.parse(fileContent);
            } catch (e) {
                this.logError(e.toString());
            }
            return parsed;
        }
    }

    async saveUsers(users: User[]){
        try {
            fs.writeFileSync(this.usersFilepath, JSON.stringify(users));
        } catch (e){
            this.logError(e.toString());
        }
    }

    async addUser(user: User) : Promise<User|false> {
        let currentUsers = await this.readUsers();
        if (currentUsers.length > 0)
            user.userId = currentUsers[currentUsers.length - 1].userId+1;
        if (currentUsers.filter(e => e.username == user.username).length > 0){
            return false;
        }
        currentUsers.push(user);
        this.saveUsers(currentUsers);
        return user;
    }

    async getUserGameData(userId: number): Promise<any|boolean> {
        let path = this.getUserGameFilePath(userId);
        if (fs.existsSync(path)){
            let fileContent = fs.readFileSync(path, 'utf-8');
            let parsed = false;
            try {
                parsed = JSON.parse(fileContent);
            } catch (e) {
                this.logError(e.toString());
            }
            return parsed;
        } else {
            return false;
        }
    }

    async saveUserGameData(userId: number, gameData: GameData){
        let path = this.getUserGameFilePath(userId);
        try {
            fs.writeFileSync(path, JSON.stringify(gameData));
        } catch (e){
            this.logError(e.toString());
        }
    }

    async loadUserGameData(userId: number) : Promise<GameData | boolean> {
        let path = this.getUserGameFilePath(userId);
        if (fs.existsSync(path)){
            let fileContent = fs.readFileSync(path, 'utf-8');
            if (fileContent == '')
                return false;
            let parsed = false;
            try {
                parsed = JSON.parse(fileContent);
            } catch (e){
                this.logError(e.toString());
            }
            return parsed;
        } else {
            return false;
        }
    }

    async logError(e: string) {
        let filepath = path.resolve(__dirname, `errorLogs.json`);
        fs.appendFileSync(filepath, `Error at ${new Date().toISOString()}: ${e}\n`);
    }

}

import { Controller, Get, Request, Post, Body, BadRequestException, UseGuards, InternalServerErrorException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GridStartInfo } from 'src/grid/dto/gridStartInfo.dto';
import { TilePosition } from 'src/grid/dto/tilePosition.dto';
import { LoadedGame } from './dto/loadedGame.dto';
import { GridService } from './grid.service';

@Controller('grid')
export class GridController {

    constructor(private gridService: GridService) {}

    //getting start base information about new game
    @UseGuards(JwtAuthGuard)
    @Post("new")
    async newGame(@Request() req): Promise<GridStartInfo> {
        let user = req.user;
        await this.gridService.generate(user.userId);
        return this.gridService.getGridStartInfo(user.userId);
    }

    //checking tile for a bomb and updating game state
    @UseGuards(JwtAuthGuard)
    @Post("mark")
    async markTile(@Request() req, @Body() tilePosition: TilePosition) {
        if (!tilePosition.hasOwnProperty('i') || !tilePosition.hasOwnProperty('j'))
            throw new BadRequestException();
        let result = await this.gridService.markTile(req.user.userId, tilePosition.i, tilePosition.j);
        if (!result){
            throw new InternalServerErrorException();
        }
    }

    //checking tile for a bomb and updating game state
    @UseGuards(JwtAuthGuard)
    @Post("check")
    async checkTile(@Request() req, @Body() tilePosition: TilePosition) {
        if (!tilePosition.hasOwnProperty('i') || !tilePosition.hasOwnProperty('j'))
            throw new BadRequestException();
        let result = await this.gridService.checkTile(req.user.userId, tilePosition.i, tilePosition.j);
        if (!result){
            throw new InternalServerErrorException();
        }
        return result;
    }

    //loading users game
    @UseGuards(JwtAuthGuard)
    @Get('load')
    async loadGame(@Request() req) : Promise<LoadedGame | boolean> {
        return this.gridService.loadGame(req.user.userId);
    }

    //checking if user has an unfinished game
    @UseGuards(JwtAuthGuard)
    @Get('save')
    async getSave(@Request() req) : Promise<boolean> {
        return this.gridService.getSave(req.user.userId);
    }

}

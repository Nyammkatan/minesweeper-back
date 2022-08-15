import { Body, ConflictException, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRequestDto } from './dto/userRequest.dto';
import { UserResultDto } from './dto/userResult.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

    constructor(private userService: UsersService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getUsers(): Promise<any[]> {
        return this.userService.getAllUsers();
    }

    @Post()
    async register(@Body() user: UserRequestDto): Promise<UserResultDto> {
        let userCreated = await this.userService.register(user);
        if (!userCreated){
            throw new ConflictException(); //Conflict for same username case
        }
        return userCreated;
    }

}

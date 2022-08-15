import { Injectable } from '@nestjs/common';
import { FileService } from 'src/file/file.service';
import { UserRequestDto } from './dto/userRequest.dto';

export type User = {
    userId: number,
    username: string,
    password: string
}

@Injectable()
export class UsersService {

  constructor(private fileService: FileService) {}

  async findOne(username: string): Promise<User | undefined> {
    let users = await this.getAllUsers();
    return users.find(user => user.username === username);
  }

  async register(userRequest: UserRequestDto): Promise<User | false> {
    let user = {userId: 1, ...userRequest};
    return this.fileService.addUser(user);
  }

  async getAllUsers(): Promise<User[]> {
    return this.fileService.readUsers();
  }

}
import { Module } from '@nestjs/common';
import { FileService } from 'src/file/file.service';
import { GridController } from './grid.controller';
import { GridService } from './grid.service';

@Module({
    controllers: [GridController],
    providers: [GridService, FileService],
    exports: [GridService]
})
export class GridModule {}

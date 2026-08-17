import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('filee'))
  uploadProductImage(@UploadedFile() fileeee: Express.Multer.File){
    console.log('fileeee', fileeee)
    return fileeee.originalname;
  }
}

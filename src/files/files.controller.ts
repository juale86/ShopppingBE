import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Get, Param } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, type Multer } from 'multer';
import  { fileFilter, fileNamer } from './helpers/';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter,
    storage: diskStorage({
      filename: fileNamer,
      destination: './static/uploads'
    }),
  }))
  uploadProductImage(@UploadedFile() file: Express.Multer.File){
    if(!file) throw new BadRequestException('Make sure that the file is an image')
    const secureUrl = `${file.filename}`;
    return {secureUrl};
  }

  @Get('product/:imageName')
  findProductImage(@Param('imageName') imageName: string){
    const path = this.filesService.getStaticProductImage(imageName);
    return path;
  }
}

import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, type Multer } from 'multer';
import { fileFilter, fileNamer } from './helpers/';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

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
    const secureUrl = `${this.configService.get('HOST_API')}files/product/${file.filename}`;
    return {secureUrl};
  }

  @Get('product/:imageName')
  findProductImage(
    @Res() res: Response, // Rompe la arquitectura. Obligo a enviar lo que quiero
    @Param('imageName') imageName: string
  ){
    const path = this.filesService.getStaticProductImage(imageName);
    res.sendFile(path);
  }
}

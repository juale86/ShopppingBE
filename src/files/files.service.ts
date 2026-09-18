import { BadRequestException, Injectable } from '@nestjs/common';
import { basename, join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class FilesService {
  getStaticProductImage(imageName: string) {
    const safeName = basename(imageName);
    const path = join(__dirname, '../../static/products', safeName);
    if (!existsSync(path))
      throw new BadRequestException('There is no such a filename');
    return path;
  }
}

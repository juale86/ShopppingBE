import { BadRequestException, Injectable } from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class FilesService {
    getStaticProductImage(imageName: string){
        const path = join(__dirname, '../../static/products', imageName);
        if(!existsSync(path))
            throw new BadRequestException('There is no such a filename')
        return path;
    }
}

import { BadRequestException } from "@nestjs/common"
import {v4 as uuid} from 'uuid';

export const fileNamer = (req: Express.Request, file: Express.Multer.File, callback: Function) => {
    if(!file) return callback(new BadRequestException('File is empty'), false)
    const fileExtension = file.mimetype.split('/')[1];
    let fileName = `${uuid()}-user.${fileExtension}`;
    callback( null, fileName ); // El nuevo nombre vá en el segundo argumento del callback
}
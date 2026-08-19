import { BadRequestException } from "@nestjs/common";

export const fileFilter = (req: Express.Request, file: Express.Multer.File, callback: Function) => {
    if(!file) return callback(new BadRequestException('File is empty'), false) // El false hace que no se avancen a los siguientes interceptors
    const fileExtension = file.mimetype.split('/')[1]
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    
    if(validExtensions.includes(fileExtension)) {
        return callback(null, true)
    }
    
    callback(null, true);
}

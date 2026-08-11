import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from './dto/paginationDto';
import { validate as isUUID} from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger("ProductsService de Juan");
  constructor(
    @InjectRepository(Product) 
    private readonly productRepository: Repository<Product> 
  ) {}
  
  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto)
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(@Query() paginationDto: PaginationDto) {
    const {limit = 10, offset = 0} = paginationDto;
    return await this.productRepository.find({
      take: limit,
      skip: offset
    });
  }

  async findOne(searchTerm: string) {
    let product: Product;
    if(isUUID(searchTerm)) {
      product = await this.productRepository.findOneBy({ id: searchTerm })
    } else {
      product = await this.productRepository.findOneBy({ slug: searchTerm})
    }
    // const product  = await this.productRepository.findOneBy({ slug: searchTerm });
    if(!product) {
      throw new NotFoundException(`Product with ${searchTerm} not foundddddddd`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(id: string) {
    const product = await this.findOne( id );
    if(!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    await this.productRepository.remove(product)
  }

  private handleDBExceptions(error: any) {
      // console.log(error);
      if(error.code === '23505') {
        throw new BadRequestException(error.detail)
      }
      this.logger.error(error);
      throw new InternalServerErrorException('Server id down, check server logs');
  }
  
}

import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from './dto/paginationDto';
import { validate as isUUID} from 'uuid';
import { ProductImage, Product } from './entities';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger("ProductsService de Juan");
  constructor(
    @InjectRepository(Product) 
    private readonly productRepository: Repository<Product>,
    
    @InjectRepository(ProductImage) 
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}
  
  async create(createProductDto: CreateProductDto, user: User) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map( image => this.productImageRepository.create({ url: image }) )
      })
      await this.productRepository.save(product);
      return {...product, images: images};
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(@Query() paginationDto: PaginationDto) {
    const {limit = 10, offset = 0} = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    });
    return products.map(product => ({
      ...product,
      images: product.images?.map(img => img.url) || []
    }));
  }

  async findOne(searchTerm: string) {
    let product: Product | null;
    if(isUUID(searchTerm)) {
      product = await this.productRepository.findOneBy({ id: searchTerm })
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder.where(`title =:title or slug =:slug`, {
        title: searchTerm,
        slug: searchTerm
      })
      .leftJoinAndSelect('prod.images', 'prodImages')
      .getOne();
    }
    // const product  = await this.productRepository.findOneBy({ slug: searchTerm });
    if(!product) {
      throw new NotFoundException(`Product with ${searchTerm} not found`);
    }
    const { images, ...rest } = product;
    return {...rest, images: product.images?.map(img => img.url) || []};
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto;
    
    // Preload busca en la DB y combina en un solo objeto los datos de la DB y los datos que se quieren actualizar
    const product = await this.productRepository.preload({ id, ...toUpdate })

    if(!product) throw new NotFoundException(`Product with ID ${id} not found`);

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if(images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } }); // Sin condición de borrado, borra todas las imágenes del producto
        product.images = images.map(image => this.productImageRepository.create({ url: image }));
      } else {
        product.images = await this.productImageRepository.findBy({ product: { id } });
      }
      await queryRunner.manager.save(product)
      await queryRunner.commitTransaction();
      const { images: productImages, ...rest } = product;
      return {rest, images: productImages?.map(img => img.url) || []};
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
    }
    
    return product;
  }

  async remove(id: string) {
    const product = await this.productRepository.findOneBy({ id });
    if(!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    await this.productRepository.remove(product)
  }

  async findOnePlain( searchTerm: string ) {
    const { images = [], ...product } = await this.findOne( searchTerm );
    return {
      ...product,
      images: images.map( image => image )
    }
  }

  private handleDBExceptions(error: any) {
      if(error.code === '23505') {
        throw new BadRequestException(error.detail)
      }
      this.logger.error(error);
      throw new InternalServerErrorException('Server id down, check server logs');
  }
  
  async deleteAllProducts() { // Se espera su uso solo en un entorno de desarrollo, no en producción.
    const queryBuilder = this.productRepository.createQueryBuilder('product');
    try {
      return await queryBuilder.delete().from(Product).execute();
    } catch(error) {
      this.handleDBExceptions(error);
    }
  }
  
}

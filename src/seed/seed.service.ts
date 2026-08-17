import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service'
import { initialData } from './data/products.seed';

@Injectable()
export class SeedService {
  constructor(
    private readonly productService: ProductsService,
  ){}

  async runSeed() {
    await this.insertNewProducts();
    return 'This action runs the seed';
  }
  
  private async insertNewProducts(){
    await this.productService.deleteAllProducts();

    const products = initialData.products;
    const insertPromises = [];
    products.forEach(product => {
      insertPromises.push( this.productService.create(product) );
    });
    await Promise.all(insertPromises)
    
    return 'Products have been added';
  }
}

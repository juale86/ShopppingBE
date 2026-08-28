import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service'
import { initialData } from './data/products.seed';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    private readonly productService: ProductsService,
    @InjectRepository(User) private readonly userRespository: Repository<User>,
  ){}

  async runSeed() {
    await this.deleteDables();
    const adminUser = await this.insertUsers()

    await this.insertNewProducts(adminUser);
    return 'This action runs the seed';
  }

  private async insertUsers(  ) {
    const seedUsers = initialData.users;
    const users: User[] = [];
    seedUsers.forEach(
      user => {
        let {password: seedPassword, ...userData} = user;
        seedPassword = bcrypt.hashSync(seedPassword, 10)
        users.push(this.userRespository.create({...user, password: seedPassword}))
      }
    )
    const dbUsers = await this.userRespository.save(seedUsers);
    return dbUsers[0];
  }
  
  private async deleteDables() {
    await this.productService.deleteAllProducts();
    const queryBuilder = this.userRespository.createQueryBuilder();
    await queryBuilder
    .delete()
    .from(User)
    .execute()
  }
  
  private async insertNewProducts(user: User){
    await this.productService.deleteAllProducts();

    const products = initialData.products;
    const insertPromises = [];
    products.forEach(product => insertPromises.push(
      this.productService.create(product, user)
    ));
    await Promise.all(insertPromises)
    
    return 'Products have been added';
  }
}

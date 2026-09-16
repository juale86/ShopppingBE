import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/products.seed';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ValidRoles } from '../auth/interfaces/roles.interface';

@Injectable()
export class SeedService {
  constructor(
    private readonly productService: ProductsService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async runSeed() {
    await this.deleteTables();
    const superUser = await this.insertUsers();

    await this.insertNewProducts(superUser as User);
    return 'This action runs the seed';
  }

  private async insertUsers() {
    const seedUsers = initialData.users;
    const users: User[] = [];

    seedUsers.forEach((user) => {
      const { password: seedPassword, ...userData } = user;
      users.push(
        this.userRepository.create({
          ...userData,
          password: bcrypt.hashSync(seedPassword, 10),
        }),
      );
    });

    users.push(
      this.userRepository.create({
        email: 'superuser@teslo.com',
        fullName: 'Super User',
        password: bcrypt.hashSync('SuperUser123', 10),
        roles: [ValidRoles.superUser, ValidRoles.admin],
      }),
    );

    const dbUsers = await this.userRepository.save(users);

    return dbUsers.find((u) => u.roles.includes(ValidRoles.superUser));
  }

  private async deleteTables() {
    await this.productService.deleteAllProducts();
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().from(User).execute();
  }

  private async insertNewProducts(user: User) {
    const products = initialData.products;
    const insertPromises = [];
    products.forEach((product) =>
      insertPromises.push(this.productService.create(product, user) as never),
    );
    await Promise.all(insertPromises);

    return 'Products have been added';
  }
}

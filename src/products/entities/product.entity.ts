import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImage } from './';
import { User } from '../../auth/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'products' })
export class Product {
  @ApiProperty({
      example: 'sadfasdfdsdfasfd',
      description: 'ProductID',
      uniqueItems: true
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
      example: 'Shopping Cart',
      description: 'Product Title',
      uniqueItems: true
  })
  @Column('text', {
    unique: true,
  })
  title: string;

  @ApiProperty({
      example: 19.99,
      description: 'Product Price'
  })
  @Column('float', {
    default: 0,
  })
  price: number;

  @ApiProperty({
      example: 'A comfortable shopping cart for your daily needs.',
      description: 'Product Description'
  })
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @ApiProperty({
      example: 'shopping-cart',
      description: 'Product Slug',
      uniqueItems: true
  })
  @Column('text', {
    unique: true,
  })
  slug: string;

  @ApiProperty({
      example: 10,
      description: 'Product Stock'
  })
  @Column('int', {
    default: 0,
  })
  stock: number;

  @ApiProperty({
      example: ['S', 'M', 'L'],
      description: 'Product Sizes'
  })
  @Column('text', {
    array: true,
    default: [],
  })
  sizes: string[];

  @ApiProperty({
      example: 'unisex',
      description: 'Product Gender'
  })
  @Column('text')
  gender: string;

  @ApiProperty({
      example: ['electronics', 'gadgets'],
      description: 'Product Tags'
  })
  @Column('text', {
    array: true,
    default: [],
  })
  tags: string[];

  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title
        .toLowerCase()
        .replaceAll(' ', '_')
        .replaceAll("'", '');
    }
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }

  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];

  @ManyToOne(() => User, (user) => user.product, { eager: true })
  user: User;
}

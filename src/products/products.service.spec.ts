import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DataSource, Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { User } from '../auth/entities/user.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Record<string, jest.Mock>;
  let productImageRepository: Record<string, jest.Mock>;
  let dataSource: { createQueryRunner: jest.Mock };

  beforeEach(() => {
    productRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(),
      preload: jest.fn(),
      remove: jest.fn(),
    };
    productImageRepository = {
      create: jest.fn((image: Partial<ProductImage>) => image),
      findBy: jest.fn(),
    };
    dataSource = { createQueryRunner: jest.fn() };
    service = new ProductsService(
      productRepository as unknown as Repository<Product>,
      productImageRepository as unknown as Repository<ProductImage>,
      dataSource as unknown as DataSource,
    );
  });

  it('creates a product and converts image URLs into image entities', async () => {
    const user = { id: 'user-id' } as User;
    const product = {
      id: 'product-id',
      title: 'T-shirt',
      images: [{ url: 'old.jpg' }],
    } as Product;
    productRepository.create.mockReturnValue(product);
    productRepository.save.mockResolvedValue(product);

    const result = await service.create(
      { title: 'T-shirt', images: ['one.jpg', 'two.jpg'] },
      user,
    );

    expect(productImageRepository.create).toHaveBeenNthCalledWith(1, {
      url: 'one.jpg',
    });
    expect(productImageRepository.create).toHaveBeenNthCalledWith(2, {
      url: 'two.jpg',
    });
    expect(productRepository.create).toHaveBeenCalledWith({
      title: 'T-shirt',
      images: [{ url: 'one.jpg' }, { url: 'two.jpg' }],
      user,
    });
    expect(result).toEqual({ ...product, images: ['one.jpg', 'two.jpg'] });
  });

  it('paginates products and returns image URLs', async () => {
    productRepository.find.mockResolvedValue([
      { id: 'product-id', title: 'T-shirt', images: [{ url: 'one.jpg' }] },
      { id: 'second-id', title: 'Cap', images: undefined },
    ]);

    const result = await service.findAll({ limit: 5, offset: 10 });

    expect(productRepository.find).toHaveBeenCalledWith({
      take: 5,
      skip: 10,
      relations: { images: true },
    });
    expect(result).toEqual([
      { id: 'product-id', title: 'T-shirt', images: ['one.jpg'] },
      { id: 'second-id', title: 'Cap', images: [] },
    ]);
  });

  it('finds by UUID or by title/slug and normalizes images', async () => {
    productRepository.findOneBy.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      images: [{ url: 'one.jpg' }],
    });
    await expect(
      service.findOne('550e8400-e29b-41d4-a716-446655440000'),
    ).resolves.toEqual({
      id: '550e8400-e29b-41d4-a716-446655440000',
      images: ['one.jpg'],
    });

    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getOne: jest
        .fn()
        .mockResolvedValue({ id: 'product-id', images: [{ url: 'two.jpg' }] }),
    };
    productRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    await expect(service.findOne('t-shirt')).resolves.toEqual({
      id: 'product-id',
      images: ['two.jpg'],
    });
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'title =:title or slug =:slug',
      {
        title: 't-shirt',
        slug: 't-shirt',
      },
    );
  });

  it('throws when a product cannot be found', async () => {
    productRepository.findOneBy.mockResolvedValue(null);
    await expect(
      service.findOne('550e8400-e29b-41d4-a716-446655440001'),
    ).rejects.toBeInstanceOf(NotFoundException);

    productRepository.preload.mockResolvedValue(null);
    await expect(
      service.update('product-id', { title: 'Updated' }, {} as User),
    ).rejects.toBeInstanceOf(NotFoundException);

    productRepository.findOneBy.mockResolvedValue(null);
    await expect(service.remove('product-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates a product inside a transaction and replaces images when provided', async () => {
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: { delete: jest.fn(), save: jest.fn() },
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    const product = {
      id: 'product-id',
      title: 'Updated',
      images: [],
    } as Product;
    const user = { id: 'user-id' } as User;
    productRepository.preload.mockResolvedValue(product);
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    const result = await service.update(
      'product-id',
      { title: 'Updated', images: ['new.jpg'] },
      user,
    );

    expect(queryRunner.manager.delete).toHaveBeenCalledWith(ProductImage, {
      product: { id: 'product-id' },
    });
    expect(queryRunner.manager.save).toHaveBeenCalledWith(product);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(result).toEqual({
      rest: { id: 'product-id', title: 'Updated', user },
      images: ['new.jpg'],
    });
  });

  it('rolls back and releases the query runner when an update fails', async () => {
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: {
        delete: jest.fn(),
        save: jest
          .fn()
          .mockRejectedValue({ code: '23505', detail: 'duplicate slug' }),
      },
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    productRepository.preload.mockResolvedValue({
      id: 'product-id',
    } as Product);
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(
      service.update('product-id', { title: 'Updated' }, {} as User),
    ).rejects.toEqual(new BadRequestException('duplicate slug'));
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });
});

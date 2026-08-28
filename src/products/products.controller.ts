import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, NotFoundException, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from './dto/paginationDto';
import { Auth, GetUser } from '../auth/decorators'
import { User } from '../auth/entities/user.entity';
import { ValidRoles } from '../auth/interfaces';


@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Auth(ValidRoles.admin)
  create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: User,
  ) {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  @Get(':searchTerm' )
  findOne(@Param('searchTerm') searchTerm: string) {
    return this.productsService.findOne(searchTerm);
  }

  @Patch(':id')
  @Auth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: User
  ) {
    return this.productsService.update(id, updateProductDto, user);
  }

  @Delete(':id')
  @Auth()
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.productsService.remove(id);
    
    // return this.productsService.remove(id);
  }
}

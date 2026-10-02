import { injectable } from "inversify";
import { ProductDto } from "../../models/dto/product-dto";
import { Product } from "../../models/product";
import { AppUtils } from "../app-utils";

@injectable()
export class ProductDtoMapper {
  public asDto(product: Product): ProductDto {
    if (!AppUtils.hasValue(product)) {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      code: product.code,
      quantity: product.quantity,
      price: product.price,
      imgUrl: product.imgUrl,
      categoryID: product.categoryID,
      gymId: product.gymId,
    } as ProductDto;
  }

  public asEntity(productDto: ProductDto): Product {
    if (!AppUtils.hasValue(productDto)) {
      return null;
    }

    return {
      id: productDto.id,
      name: productDto.name,
      description: productDto.description,
      code: productDto.code,
      quantity: productDto.quantity,
      price: productDto.price,
      imgUrl: productDto.imgUrl,
      categoryID: productDto.categoryID,
      gymId: productDto.gymId,
    } as Product;
  }
}

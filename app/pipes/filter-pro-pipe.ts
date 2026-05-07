import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterPro',
  pure: false
})
export class FilterProPipe implements PipeTransform {
  transform(products: any[], maxPrice: number, color: string, size: string, style: string): any[] {
    if (!products) return [];
    return products.filter(p => {
      const matchesPrice = p.price <= maxPrice;
      const matchesColor = color ? (p.colors || []).includes(color) : true;
      const matchesSize = size ? (p.sizes || []).includes(size) : true;
      const matchesStyle = style ? p.dressStyle === style : true;

      return matchesPrice && matchesColor && matchesSize && matchesStyle;
    });
  }

}

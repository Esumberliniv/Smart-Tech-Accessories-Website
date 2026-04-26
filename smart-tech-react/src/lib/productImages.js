export function fallbackForCategory(category) {
  if (category === 'Earbuds') return '/images/products/earbuds-fallback.svg';
  if (category === 'Smartwatches') return '/images/products/smartwatch-fallback.svg';
  return '/images/products/accessory-fallback.svg';
}

export function preferredImageForProduct(product) {
  const name = (product?.name || '').toLowerCase();
  if (name === 'smart glasses') return '/images/products/smart-glasses.png';
  if (name === 'wireless charger') return '/images/products/wireless-charger.png';
  if (name === 'noise cancelling pro' || name === 'noise cancelling earphones') return '/images/products/noise-cancelling-pro.png';
  if (name === 'sport buds elite') return '/images/products/sport-buds-elite.png';
  if (name === 'usb-c hub' || name === 'usb c hub') return '/images/products/usb-c-hub.png';
  return product?.image_url || product?.image || '';
}

import React, { useState } from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

interface ProductImageProps {
  uri?: string;
  style?: StyleProp<ImageStyle>;
}

const fallbackSource = require('../assets/images/caffe_mocha.png');

const imageSources: Record<string, ImageSourcePropType> = {
  'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400': require('../assets/images/product_01_cappuccino.jpg'),
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400': require('../assets/images/product_02_latte.jpg'),
  'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400': require('../assets/images/product_03_espresso.jpg'),
  'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400': require('../assets/images/product_04_dark_chocolate.jpg'),
  'https://images.unsplash.com/photo-1586444248879-bc604bc77dac?w=400': require('../assets/images/caffe_panna.png'),
  'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400': require('../assets/images/product_06_biscotti.jpg'),
  'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400': require('../assets/images/product_07_chocolate_croissant.jpg'),
  'https://images.unsplash.com/photo-1621236378699-8597faf6a176?w=400': require('../assets/images/product_08_cranberry_scone.jpg'),
  'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400': require('../assets/images/flat_white.png'),
  'https://images.unsplash.com/photo-1509365390695-33aee754301f?w=400': require('../assets/images/product_10_almond_croissant.jpg'),
  'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=400': require('../assets/images/product_11_hazelnut_biscotti.jpg'),
  'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400': require('../assets/images/product_12_ginger_biscotti.jpg'),
  'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=400': require('../assets/images/product_13_oatmeal_scone.jpg'),
  'https://images.unsplash.com/photo-1486427944544-d2c246c4df14?w=400': require('../assets/images/mocha_fusi.png'),
  'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400': require('../assets/images/product_15_chocolate_syrup.jpg'),
  'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400': require('../assets/images/product_16_hazelnut_syrup.jpg'),
  'https://images.unsplash.com/photo-1581996323441-538096e854b9?w=400': require('../assets/images/product_17_caramel_syrup.jpg'),
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400': require('../assets/images/product_18_vanilla_syrup.jpg'),
};

const ProductImage: React.FC<ProductImageProps> = ({ uri, style }) => {
  const [failed, setFailed] = useState(false);
  const normalizedUri = typeof uri === 'string' ? uri.trim() : '';
  const mappedSource = normalizedUri ? imageSources[normalizedUri] : undefined;
  const shouldUseRemote = Boolean(normalizedUri) && normalizedUri !== 'undefined' && normalizedUri !== 'null' && !failed && !mappedSource;

  return (
    <Image
      source={mappedSource || (shouldUseRemote ? { uri: normalizedUri } : fallbackSource)}
      style={style}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
};

export default ProductImage;
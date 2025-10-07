import translationsStartsWithCapital from './rules/translations-starts-with-capital.js';
import cardImagesExist from './rules/card-images-exist.js';
import cardDescriptionWithoutDot from './rules/card-description-without-dot.js';
import cardClassesExist from './rules/card-classes-exist.js';

export default {
  rules: {
    'card-images-exist': cardImagesExist,
    'card-classes-exist': cardClassesExist,
    'card-description-without-dot': cardDescriptionWithoutDot,
    'translations-starts-with-capital': translationsStartsWithCapital,
  },
};

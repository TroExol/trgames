// Склонение русского существительного по числу — только форма «шаг», больше
// нигде на клиенте не нужна (ресурс не склоняется, его имя придумывает
// нейросеть — см. комментарий у Hud/index.tsx)
const STEP_FORMS: [string, string, string] = ['шаг', 'шага', 'шагов'];

const pluralForm = (count: number, forms: [string, string, string]): string => {
  const hundred = Math.abs(count) % 100;
  const ten = hundred % 10;

  if (hundred >= 11 && hundred <= 14) {
    return forms[2];
  }
  if (ten === 1) {
    return forms[0];
  }
  if (ten >= 2 && ten <= 4) {
    return forms[1];
  }

  return forms[2];
};

// «осталось 3 шага» — остаток шагов у развилки (3, задача 2)
export const pluralizeSteps = (count: number): string => `${count} ${pluralForm(count, STEP_FORMS)}`;

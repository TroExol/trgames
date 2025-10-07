import path from 'path';
import fs from 'fs';

const kebabToPascal = kebab => {
  return kebab
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Проверяет, что для каждого значения enum существует соответствующий класс',
    },
    schema: [
      {
        type: 'object',
        properties: {
          enumFilePath: { type: 'string' },
          enumName: { type: 'string' },
          classDirPath: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const enumFilePath = options.enumFilePath;
    const enumName = options.enumName;
    const classDirPath = options.classDirPath;

    return {
      TSEnumDeclaration(node) {
        if (context.physicalFilename !== enumFilePath || node.id.name !== enumName) {
          return;
        }

        node.body.members.forEach(enumValueNode => {
          const enumValue = enumValueNode.initializer.value;
          const classPath = path.join(classDirPath, `${kebabToPascal(enumValue)}.ts`);
          if (!fs.existsSync(classPath)) {
            context.report({
              node: enumValueNode.initializer,
              message: `Класс для значения enum "${enumValue}" из "${enumName}" отсутствует: "${classPath}".`,
            });
          }
        });
      },
    };
  },
};

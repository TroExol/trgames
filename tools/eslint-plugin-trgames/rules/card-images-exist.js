import path from 'path';
import fs from 'fs';

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Проверяет, что для каждого значения enum существует соответствующее изображение',
    },
    schema: [
      {
        type: 'object',
        properties: {
          enumFilePath: { type: 'string' },
          enumName: { type: 'string' },
          imageDirPath: { type: 'string' },
          imageExtension: { type: 'string' },
          overrideImageName: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                imageName: { type: 'string' },
              },
              required: ['id', 'imageName'],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const enumFilePath = options.enumFilePath;
    const enumName = options.enumName;
    const imageDirPath = options.imageDirPath;
    const imageExtension = options.imageExtension || '.webp';
    const overrideImageName = options.overrideImageName || [];

    return {
      TSEnumDeclaration(node) {
        if (context.physicalFilename !== enumFilePath || node.id.name !== enumName) {
          return;
        }

        node.body.members.forEach(enumValueNode => {
          const enumValue = enumValueNode.initializer.value;
          let imageName = enumValue;

          const matchingRule = overrideImageName.find(rule => new RegExp(rule.id).test(enumValue));

          if (matchingRule) {
            imageName = matchingRule.imageName;
          }
          const imagePath = path.join(imageDirPath, `${imageName}${imageExtension}`);
          if (!fs.existsSync(imagePath)) {
            context.report({
              node: enumValueNode.initializer,
              message: `Изображение для значения enum "${enumValue}" из "${enumName}" отсутствует: "${imagePath}".`,
            });
          }
        });
      },
    };
  },
};

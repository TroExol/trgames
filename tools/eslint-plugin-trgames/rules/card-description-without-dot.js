export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Проверяет, что в описании карты нет точек в конце',
    },
    schema: [],
    fixable: 'code',
  },
  create(context) {
    return {
      // Проверяем описания карт в файле переводов
      Program(node) {
        // Функция для рекурсивного обхода объекта и проверки строковых значений
        const checkStringValues = objNode => {
          if (!objNode || objNode.type !== 'ObjectExpression') {
            return;
          }

          for (const property of objNode.properties) {
            if (property.value.type !== 'Literal' || typeof property.value.value !== 'string') {
              if (property.value.type === 'ObjectExpression') {
                checkStringValues(property.value);
              }
              continue;
            }

            // Проверяем только описания карт (пропускаем name, modals, logs и другие)
            if (property.key.name === 'name' || property.key.name.startsWith('modal') || property.key.name.startsWith('log')) {
              continue;
            }

            const textValue = property.value.value;
            if (!textValue.trim().endsWith('.')) {
              continue;
            }

            context.report({
              node: property.value,
              message: 'Текст описания не должен заканчиваться точкой',
              fix(fixer) {
                const newText = textValue.trim().slice(0, -1);
                return fixer.replaceText(property.value, `'${newText}'`);
              },
            });
          }
        };

        // Ищем объект cards в экспорте
        for (const statement of node.body) {
          if (statement.type !== 'ExportNamedDeclaration' || !statement.declaration) {
            continue;
          }

          const declaration = statement.declaration;
          if (declaration.type !== 'VariableDeclaration') {
            continue;
          }

          for (const declarator of declaration.declarations) {
            if (!declarator.init) {
              continue;
            }

            const init = declarator.init;

            if (init.type !== 'TSAsExpression') {
              continue;
            }

            for (const property of init.expression.properties) {
              if (property.key.name !== 'cards' || property.value.type !== 'ObjectExpression') {
                continue;
              }

              // Проверяем все карты
              for (const cardProperty of property.value.properties) {
                if (cardProperty.value.type !== 'ObjectExpression') {
                  continue;
                }

                // Ищем description в каждой карте
                for (const cardDescProperty of cardProperty.value.properties) {
                  if (cardDescProperty.key.name !== 'description') {
                    continue;
                  }

                  if (cardDescProperty.value.type === 'ObjectExpression') {
                    checkStringValues(cardDescProperty.value);
                    continue;
                  }

                  if (cardDescProperty.value.type !== 'Literal' || typeof cardDescProperty.value.value !== 'string') {
                    continue;
                  }

                  const textValue = cardDescProperty.value.value;
                  if (!textValue.trim().endsWith('.')) {
                    continue;
                  }

                  context.report({
                    node: cardDescProperty.value,
                    message: 'Текст описания не должен заканчиваться точкой',
                    fix(fixer) {
                      const newText = textValue.trim().slice(0, -1);
                      return fixer.replaceText(cardDescProperty.value, `'${newText}'`);
                    },
                  });
                }
              }
            }
          }
        }
      },
    };
  },
};

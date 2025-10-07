export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Проверяет, что все строковые значения начинаются с большой буквы',
    },
    schema: [],
    fixable: 'code',
  },
  create(context) {
    return {
      // Проверяем все строковые значения в файле переводов
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

            const textValue = property.value.value;
            if (!textValue || textValue[0] === textValue[0].toUpperCase()) {
              continue;
            }

            context.report({
              node: property.value,
              message: 'Строковое значение должно начинаться с большой буквы',
              fix(fixer) {
                const newText = textValue[0].toUpperCase() + textValue.slice(1);
                return fixer.replaceText(property.value, `'${newText}'`);
              },
            });
          }
        };

        // Ищем объект перевода в экспорте
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

            // Проверяем весь объект перевода
            checkStringValues(init.expression);
          }
        }
      },
    };
  },
};

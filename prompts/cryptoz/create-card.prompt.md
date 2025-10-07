Тебе нужно сгенерировать игровую карточку для Cryptoz. Сначала проведи анализ, потом приступай к реализации. Для обращений используй "ты" вместо "Вы"

Сначала запроси у меня следующие параметры:
- название (name, например "Призрачный страж"):
- идентификатор (id, автоматически сгенерируй в формате SCREAMING_SNAKE_CASE из названия (например, GHOSTLY_GUARDIAN))
- описание (description): может включать следующие компоненты в формате объекта:
  * general: общее описание карты
  * strike: описание эффекта мракобоя
  * evade: описание эффекта укрытия
  * totalStrike: описание эффекта тотального мракобоя
  * seal: описание эффекта печати
  * other: описание прочих эффектов
- цель (target, одно из [ENEMY, PLAYER, UNDEFINED]):
- тип (type, одно из [ARTIFACT, CHAOS, COMPANION, CREATURE, CRYPT, CURSED_SEAL, DARKNESS_MADNESS, HARBINGER, RITUAL, STARTER, WICKEDNESS]):
- цена (price, целое число >= 0):
- эссенции по умолчанию (baseEssence, целое число >= 0):
- осколки славы (gloryShards: целое число):
- является ли печатью (isSeal, true/false):
- имеет ли укрытие (hasEvade, true/false):

Требования к карточке:
- в описании может быть общее описание, описание мракобоя, описание укрытия, описание печати, описание тотального мракобоя, другое описание в перечисленном порядке.
- проверь, что нет карточки с таким же идентификатором

Что нужно сделать:
1) В файле #File:tools/shared/src/games/cryptoz/types/card.ts в enum ECardId нужно добавить новый идентификатор карточки в формате SCREEMING_SNAKE_CASE.
2) В папке #Folder:server/src/games/cryptoz/entities/Cards/customCards нужно создать файл с названием CamelCase.ts с классом карточки с названием в формате CamelCase.
В файле #File:server/src/games/cryptoz/entities/Cards/AbstractCard/AbstractCard.ts находится класс, который наследуется для создания карточки, можешь прочитать его, чтобы понимать как работает класс карточки.
По реализации функционала ориентируйся на существующие карточки в папке #Folder:server/src/games/cryptoz/entities/Cards/customCards
Если в карточке есть strike или totalStrike, не забудь добавить возможность укрыться от них, например, как в #File:server\src\games\cryptoz\entities\Cards\customCards\FleshChimera.ts
Если в карточке есть выбор конкретного участника или врага, не забудь добавить возможность его выбора, например, как в #File:server\src\games\cryptoz\entities\Cards\customCards\Discharge.ts
3) В папке #Folder:server/src/games/cryptoz/entities/Cards/customCards нужно создать файл для тестов с названием CamelCase.test.ts. По реализации функционала ориентируйся на существующие тесты в этой папке.

4) (OPTIONAL) Напиши промпт для генерации изображения по примеру "A dark, mystical fantasy illustration. In the center, a spectral, ghostly paw (or hand) emerges from swirling shadows, gently touching a glowing thread of fate. The background is filled with magical runes, ethereal blue and purple lights, and fragments of destiny floating around. The atmosphere is mysterious and magical, evoking the power to change fate and restore life. No border, no frame, no outline, no card shape, no edge, no background pattern, no text, no logo, no watermark, full bleed, natural edges, fade to background. --ar 1:1"
5) (OPTIONAL) После создания тестов предложи запустить их командой source ~/.zshrc; nvm use; yarn workspace @trgames/server test {src/games/cryptoz/entities/Cards/customCards/новый файл с тестами} и после прогона, если будут ошибки, исправь код карточки, если проблема в функционале карточки, или код теста, если проблема в тесте.

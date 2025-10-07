<div align="center">

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

</div>

<br />
<div align="center">
<h3 align="center">TRGames - Настольные игры в онлайн формате</h3>

  <p align="center">
    <a href="https://troexol.ru"><strong>Попробуй »</strong></a>
    <br />
    <br />
    <a href="https://github.com/TroExol/trgames/issues/new?labels=bug&template=bug-report---.md">Сообщить ошибку</a>
    ·
    <a href="https://github.com/TroExol/trgames/issues/new?labels=enhancement&template=feature-request---.md">Предложить идею</a>
  </p>
</div>

## Contributing

### Установка

1. Установите Node.js v22
2. Склонируйте репозиторий
   ```sh
   git clone https://github.com/TroExol/trgames.git
   ```
3. Если не установлен `yarn` - установите его
   ```sh
   npm install --global yarn@1.22.22
   ```
4. Установите зависимости из корня проекта, тогда также установятся зависимости для всех воркспейсов
   ```sh
   cd trgames && yarn install
   ```

### Запуск

#### С отслеживанием изменений

Запустите проект
```sh
trgames> yarn start:dev
```
Клиент будет запущен по адесу http://localhost:3000, сервер - http://localhost:4001.

#### Без отслеживания изменений

Соберите клиент
```sh
trgames\client> yarn build
```
Сборка будет находиться в папке dist

Запустите сервер
```sh
trgames\server> yarn start
```

### Линтеры

Для запуска проверки кода всех воркспейсов
```sh
trgames> yarn lint
```

В каждом вокрспейсе есть свой скрипт для запуска проверки кода
```sh
trgames\server> yarn lint
```

#### Git хуки

Перед пушом срабатывает git хук, который проверяет качество кода всех воркспейсов


<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/TroExol/trgames.svg?style=for-the-badge
[contributors-url]: https://github.com/TroExol/trgames/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/TroExol/trgames.svg?style=for-the-badge
[forks-url]: https://github.com/TroExol/trgames/network/members
[stars-shield]: https://img.shields.io/github/stars/TroExol/trgames.svg?style=for-the-badge
[stars-url]: https://github.com/TroExol/trgames/stargazers
[issues-shield]: https://img.shields.io/github/issues/TroExol/trgames.svg?style=for-the-badge
[issues-url]: https://github.com/TroExol/trgames/issues

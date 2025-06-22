# GoReal Backend API

GoReal - це комплексна система управління нерухомістю з функціями CRM, управління продажами, завданнями та аналітикою.

## 🚀 Особливості

### ✅ Реалізовано

- **Аутентифікація та авторизація** - JWT-based auth з ролевою системою
- **Управління користувачами** - CRUD операції для користувачів
- **CRM система** - Управління клієнтами та лідами
- **Управління продажами** - Повний цикл продажів з комісіями
- **Система завдань** - Призначення та відстеження завдань
- **Сповіщення** - Система повідомлень в реальному часі
- **Аналітика** - Бізнес-аналітика та звітність
- **Observability** - OpenTelemetry трейсинг та метрики

### 🏗️ Архітектура

Проект використовує **Clean Architecture** з наступною структурою:

```
backend/
├── cmd/api/                 # Точка входу додатку
├── internal/
│   ├── domain/             # Бізнес-логіка та сутності
│   ├── services/           # Сервіси додатку
│   ├── handlers/           # HTTP обробники
│   ├── infrastructure/     # Зовнішні залежності (Supabase)
│   ├── container/          # Dependency Injection
│   ├── middleware/         # HTTP middleware
│   └── config/            # Конфігурація
├── pkg/
│   └── observability/     # Observability утиліти
└── test/                  # Тести
```

## 📋 API Endpoints

### Аутентифікація
```
POST /api/auth/login           # Вхід в систему
POST /api/auth/register        # Реєстрація
POST /api/auth/refresh         # Оновлення токену
POST /api/auth/logout          # Вихід з системи
POST /api/auth/change-password # Зміна паролю
POST /api/auth/reset-password  # Скидання паролю
```

### Користувачі
```
GET    /api/users             # Список користувачів
POST   /api/users             # Створення користувача
GET    /api/users/{id}        # Отримання користувача
PUT    /api/users/{id}        # Оновлення користувача
DELETE /api/users/{id}        # Видалення користувача
```

### Клієнти
```
GET    /api/clients           # Список клієнтів
POST   /api/clients           # Створення клієнта
GET    /api/clients/{id}      # Отримання клієнта
PUT    /api/clients/{id}      # Оновлення клієнта
DELETE /api/clients/{id}      # Видалення клієнта
POST   /api/clients/{id}/verify # Верифікація клієнта
GET    /api/clients/{id}/history # Історія клієнта
```

### Завдання
```
GET    /api/tasks             # Список завдань
POST   /api/tasks             # Створення завдання
GET    /api/tasks/{id}        # Отримання завдання
PUT    /api/tasks/{id}        # Оновлення завдання
DELETE /api/tasks/{id}        # Видалення завдання
POST   /api/tasks/{id}/complete # Завершення завдання
GET    /api/tasks/assigned/{userID} # Завдання користувача
GET    /api/tasks/overdue     # Прострочені завдання
POST   /api/tasks/bulk-assign # Масове призначення
```

## 🛠️ Технології

- **Go 1.22+** - Основна мова програмування
- **Chi Router** - HTTP роутер
- **Supabase** - База даних та аутентифікація
- **OpenTelemetry** - Observability
- **JWT** - Аутентифікація
- **bcrypt** - Хешування паролів

## 🚀 Запуск

### Передумови
- Go 1.22+
- Supabase проект
- PostgreSQL (через Supabase)

### Налаштування

1. Клонуйте репозиторій:
```bash
git clone <repository-url>
cd goreal/backend
```

2. Встановіть залежності:
```bash
go mod download
```

3. Створіть `.env` файл:
```env
# Server
PORT=8080
ENVIRONMENT=development
SERVICE_NAME=goreal-backend

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY_MINUTES=15
JWT_REFRESH_EXPIRY_DAYS=7

# Observability
JAEGER_ENDPOINT=http://localhost:14268/api/traces
LOG_LEVEL=info

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_RPM=100
RATE_LIMIT_BURST=10
```

4. Запустіть сервер:
```bash
go run cmd/api/main.go
```

Сервер буде доступний на `http://localhost:8080`

## 🧪 Тестування

Запуск тестів:
```bash
# Всі тести
go test ./...

# Тести з покриттям
go test -cover ./...

# Тести сервісів
go test ./internal/services -v

# Тести API
go test ./test -v
```

## 📊 Observability

Система включає повну observability з:

- **Трейсинг** - Розподілений трейсинг через OpenTelemetry
- **Метрики** - Збір метрик продуктивності
- **Логування** - Структуроване логування з кореляцією

Експорт даних в Jaeger для візуалізації трейсів.

## 🔒 Безпека

- JWT токени для аутентифікації
- Ролева система доступу
- bcrypt для хешування паролів
- Rate limiting
- CORS налаштування
- Валідація вхідних даних

## 📈 Продуктивність

- Ефективне використання горутин
- Connection pooling для бази даних
- Кешування (планується)
- Оптимізовані запити до БД

## 🤝 Внесок

1. Fork проекту
2. Створіть feature branch (`git checkout -b feature/amazing-feature`)
3. Commit зміни (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Відкрийте Pull Request

## 📝 Ліцензія

Цей проект ліцензований під MIT License.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Создаем приложение (наш двигатель)
app = FastAPI(title="GitScience API")

# Настройка CORS (чтобы браузер с GitHub Pages мог безопасно общаться с Render)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Позже мы заменим "*" на ссылку твоего фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаем корневой эндпоинт (проверка пульса сервера)
@app.get("/")
def read_root():
    return {"message": "GitScience Backend is LIVE 🚀", "status": "Success"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
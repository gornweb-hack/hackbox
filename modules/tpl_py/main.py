import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()


@app.exception_handler(Exception)
async def unhandled(_request: Request, _exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"code": "INTERNAL_ERROR", "message": "Внутренняя ошибка"},
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/notes")
def notes(request: Request):
    user_id = request.headers.get("x-user-id")
    if not user_id:
        return JSONResponse(
            status_code=401,
            content={"code": "UNAUTHORIZED", "message": "Нужен вход"},
        )
    return {"items": [], "total": 0}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
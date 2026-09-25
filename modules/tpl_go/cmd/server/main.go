package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"
)

// apiError — формат ошибок из контракта модуля: {"code","message"}.
// Huma по умолчанию отдаёт RFC 9457, поэтому подменяем huma.NewError.
type apiError struct {
	status  int
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *apiError) Error() string  { return e.Message }
func (e *apiError) GetStatus() int { return e.status }

func newAPIError(status int, code, message string) *apiError {
	return &apiError{status: status, Code: code, Message: message}
}

// Коды для ошибок, которые huma создаёт сам (валидация, неизвестный путь и т. п.).
var codeByStatus = map[int]string{
	http.StatusBadRequest:          "BAD_REQUEST",
	http.StatusUnauthorized:        "UNAUTHORIZED",
	http.StatusForbidden:           "FORBIDDEN",
	http.StatusNotFound:            "NOT_FOUND",
	http.StatusUnprocessableEntity: "VALIDATION_ERROR",
}

func init() {
	huma.NewError = func(status int, msg string, errs ...error) huma.StatusError {
		code, ok := codeByStatus[status]
		if !ok {
			code = "INTERNAL_ERROR"
		}
		if status == http.StatusUnprocessableEntity {
			msg = "Некорректные данные"
			if len(errs) > 0 {
				msg += ": " + errs[0].Error()
			}
		}
		return newAPIError(status, code, msg)
	}
}

type note struct {
	ID        string    `json:"id" format:"uuid"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"createdAt"`
}

// Моковые данные: хранилища пока нет, API отдаёт фиксированный набор.
var mockNotes = []note{
	{ID: "7f3c2a10-5b8e-4c1d-9a6f-1e2d3c4b5a61", Title: "Проверить посадку в вагон 3", CreatedAt: time.Date(2026, 9, 25, 9, 0, 0, 0, time.UTC)},
	{ID: "b2e4d6f8-1a3c-4e5b-8d7f-9a0b1c2d3e42", Title: "Разобрать сценарий «Конфликт из-за места»", CreatedAt: time.Date(2026, 9, 25, 12, 30, 0, 0, time.UTC)},
}

type UserHeaders struct {
	UserID   string `header:"X-User-Id"`
	UserRole string `header:"X-User-Role"`
}

func (u UserHeaders) requireUser() error {
	if u.UserID == "" {
		return newAPIError(http.StatusUnauthorized, "UNAUTHORIZED", "Нужен вход")
	}
	return nil
}

type healthOutput struct {
	Body struct {
		Status string `json:"status"`
	}
}

type listNotesOutput struct {
	Body struct {
		Items []note `json:"items"`
		Total int    `json:"total"`
	}
}

type getNoteInput struct {
	UserHeaders
	ID string `path:"id" format:"uuid"`
}

type getNoteOutput struct {
	Body note
}

func registerRoutes(api huma.API) {
	huma.Get(api, "/health", func(ctx context.Context, _ *struct{}) (*healthOutput, error) {
		out := &healthOutput{}
		out.Body.Status = "ok"
		return out, nil
	})

	huma.Get(api, "/notes", func(ctx context.Context, in *UserHeaders) (*listNotesOutput, error) {
		if err := in.requireUser(); err != nil {
			return nil, err
		}
		out := &listNotesOutput{}
		out.Body.Items = mockNotes
		out.Body.Total = len(mockNotes)
		return out, nil
	})

	huma.Get(api, "/notes/{id}", func(ctx context.Context, in *getNoteInput) (*getNoteOutput, error) {
		if err := in.requireUser(); err != nil {
			return nil, err
		}
		for _, n := range mockNotes {
			if n.ID == in.ID {
				return &getNoteOutput{Body: n}, nil
			}
		}
		return nil, newAPIError(http.StatusNotFound, "NOT_FOUND", "Заметка не найдена")
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	cfg := huma.DefaultConfig("tpl_go", "0.1.0")
	// Без этого huma добавляет в каждый ответ поле "$schema", которого нет в контракте
	cfg.CreateHooks = nil
	api := humago.New(mux, cfg)
	registerRoutes(api)

	srv := &http.Server{Addr: "0.0.0.0:" + port, Handler: mux, ReadHeaderTimeout: 5 * time.Second}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		slog.Info("tpl_go слушает", "port", port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("сервер упал", "err", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("ошибка при остановке", "err", err)
	}
}

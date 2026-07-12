type SupabaseLikeError = {
  code?: string;
  message?: string;
};

export function mapMessageSendError(error: SupabaseLikeError | null): string {
  if (!error) {
    return "Не удалось отправить сообщение.";
  }

  if (error.code === "42501") {
    return "Нет доступа к чату. Обновите страницу или войдите снова.";
  }

  if (error.code === "23503") {
    return "Профиль не найден. Выйдите и войдите снова.";
  }

  if (error.code === "42P01") {
    return "Чат не настроен на сервере. Примените миграции базы данных.";
  }

  if (error.code === "PGRST116") {
    return "Сообщение отправлено, но не удалось его показать. Обновите чат.";
  }

  return "Не удалось отправить сообщение.";
}

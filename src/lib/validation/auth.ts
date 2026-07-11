import { z } from "zod";

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Введите имя")
    .max(80, "Имя слишком длинное"),
  email: z.string().trim().email("Некорректный email"),
  password: z
    .string()
    .min(8, "Пароль должен содержать минимум 8 символов")
    .max(72, "Пароль слишком длинный"),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

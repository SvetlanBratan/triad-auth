
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useUser } from '@/hooks/use-user';
import { FirebaseError } from 'firebase/app';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';
import type { User } from '@/lib/types';


const formSchema = z.object({
  nickname: z.string().min(3, 'Никнейм должен содержать не менее 3 символов.'),
  password: z.string().min(6, 'Пароль должен содержать не менее 6 символов.'),
});

type FormData = z.infer<typeof formSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleAuth = async (data: FormData) => {
    setIsLoading(true);
    
    const formattedNickname = data.nickname
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    const fakeEmailForAuth = `${data.nickname.toLowerCase().replace(/\s/g, '')}@pumpkin.com`;

    try {
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, fakeEmailForAuth, data.password);
        toast({ title: 'Вход выполнен', description: `Добро пожаловать!` });
      } else {
        // Register
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, fakeEmailForAuth, data.password);
            
            await updateProfile(userCredential.user, { displayName: formattedNickname });

            toast({ title: 'Регистрация успешна', description: 'Ваш аккаунт создан. Сейчас вы будете авторизованы.' });
            
        } catch (error) {
            if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
                toast({ variant: 'destructive', title: 'Пользователь уже существует', description: 'Этот никнейм уже используется. Попробуйте войти в систему.' });
                setIsLogin(true);
            } else {
              console.error("Registration error:", error);
              toast({ variant: 'destructive', title: 'Ошибка регистрации', description: 'Не удалось создать аккаунт.' });
            }
        }
      }
    } catch (error) {
      console.error(error);
      let message = 'Произошла неизвестная ошибка.';
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            message = 'Неверный никнейм или пароль.';
            break;
          case 'auth/email-already-in-use':
             message = 'Пользователь с таким никнеймом уже зарегистрирован.';
            break;
          default:
            message = `Ошибка аутентификации: ${error.message}`;
        }
      }
      toast({ variant: 'destructive', title: 'Ошибка', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{isLogin ? 'Вход в систему' : 'Регистрация'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Введите свои данные для входа. Используйте никнейм, указанный при регистрации.' : 'Создайте новый аккаунт.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(handleAuth)}>
          <CardContent className="grid gap-4">
            {!isLogin && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Внимание!</AlertTitle>
                    <AlertDescription>
                        Пожалуйста, не используйте реальные пароли от других ресурсов. Проект не несет ответственности за сохранность ваших данных.
                    </AlertDescription>
                </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="nickname">Никнейм</Label>
              <Input id="nickname" {...register('nickname')} disabled={isLoading} />
              {errors.nickname && <p className="text-xs text-destructive">{errors.nickname.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" {...register('password')} disabled={isLoading} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
            </Button>
            <Button variant="link" type="button" onClick={() => setIsLogin(!isLogin)} disabled={isLoading}>
              {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

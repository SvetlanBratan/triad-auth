
'use client';

import React, { useState, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { Progress } from '../ui/progress';

interface AvatarUploaderProps {
  closeDialog: () => void;
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function AvatarUploader({ closeDialog }: AvatarUploaderProps) {
  const { currentUser, updateUserAvatar } = useUser();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: 'destructive',
          title: 'Файл слишком большой',
          description: 'Пожалуйста, выберите изображение размером до 2 МБ.',
        });
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !currentUser) return;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        toast({
            variant: 'destructive',
            title: 'Ошибка конфигурации',
            description: 'Переменные окружения для Cloudinary не настроены.',
        });
        return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });

      if (!response.ok) {
        throw new Error('Не удалось загрузить изображение.');
      }

      const data = await response.json();
      const secureUrl = data.secure_url;
      
      // Simulate progress for UI feedback as direct XHR progress is complex with fetch
      setUploadProgress(100);

      await updateUserAvatar(currentUser.id, secureUrl);

      toast({
        title: 'Аватар обновлен!',
        description: 'Ваш новый аватар успешно сохранен.',
      });
      closeDialog();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка загрузки',
        description: 'Произошла ошибка при загрузке вашего аватара.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removePreview = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="space-y-6">
      <div
        className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-muted hover:border-primary transition-colors"
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/png, image/jpeg, image/gif"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        {preview ? (
          <>
            <div className="relative w-full h-full">
              <Image src={preview} alt="Предпросмотр" layout="fill" objectFit="contain" className="rounded-lg" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 rounded-full bg-background/50 hover:bg-background/80"
              onClick={(e) => {
                e.stopPropagation();
                removePreview();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            <UploadCloud className="w-12 h-12 mx-auto mb-4" />
            <p className="font-semibold">Нажмите, чтобы загрузить файл</p>
            <p className="text-xs">PNG, JPG или GIF (до 2MB)</p>
          </div>
        )}
      </div>

      {isLoading && <Progress value={uploadProgress} className="w-full" />}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={closeDialog} disabled={isLoading}>
          Отмена
        </Button>
        <Button onClick={handleUpload} disabled={!file || isLoading}>
          {isLoading ? 'Загрузка...' : 'Сохранить аватар'}
        </Button>
      </div>
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { uploadImage } from '@/actions/upload-image';

interface AvatarUploaderProps {
  closeDialog: () => void;
}

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export default function AvatarUploader({ closeDialog }: AvatarUploaderProps) {
  const { currentUser, updateUserAvatar } = useUser();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    
    setIsLoading(true);

    try {
      const dataUrl = await fileToDataURL(file);
      const { url } = await uploadImage(dataUrl, `avatar-${currentUser.id}-${Date.now()}`);

      await updateUserAvatar(currentUser.id, url);

      toast({
        title: 'Аватар обновлен!',
        description: 'Ваш новый аватар успешно сохранен.',
      });
      closeDialog();
    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Произошла ошибка при загрузке вашего аватара.';
      toast({
        variant: 'destructive',
        title: 'Ошибка загрузки',
        description: message,
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
          accept="image/png, image/jpeg, image/gif, image/webp"
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
            <p className="text-xs">PNG, JPG, GIF, WEBP (до 2MB)</p>
          </div>
        )}
      </div>

      {isLoading && <Progress value={100} className="w-full animate-pulse" />}

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

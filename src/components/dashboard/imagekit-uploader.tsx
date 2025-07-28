
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { env } from '@/lib/env';
import { Label } from '@/components/ui/label';

interface ImageKitUploaderProps {
  currentImageUrl?: string | null;
  onUpload: (url: string) => void;
}

export default function ImageKitUploader({ currentImageUrl, onUpload }: ImageKitUploaderProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPreview(currentImageUrl || null);
  }, [currentImageUrl]);


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
    if (!file) return;
    if (!env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY) {
        toast({
            variant: 'destructive',
            title: 'Ошибка конфигурации',
            description: 'Публичный ключ ImageKit не настроен.',
        });
        return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('publicKey', env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY);
    
    try {
        const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            body: formData,
        });
        
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ImageKit error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(`Не удалось загрузить изображение. ${errorData.message}`);
        } catch {
          throw new Error(`Не удалось загрузить изображение. Ответ сервера: ${response.statusText}`);
        }
      }

      const data = await response.json();
      const secureUrl = data.url;
      
      onUpload(secureUrl);

      toast({
        title: 'Изображение обновлено!',
      });
      setFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка при загрузке вашего изображения.';
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка загрузки',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = () => {
    setFile(null);
    setPreview(null);
    onUpload(''); // Clear the image URL
  };

  return (
    <div className="space-y-4">
        <Label>Изображение товара</Label>
      <div
        className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-muted hover:border-primary transition-colors"
        onClick={() => document.getElementById('imagekit-file-input')?.click()}
      >
        <input
          id="imagekit-file-input"
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
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 rounded-full bg-background/50 hover:bg-background/80"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
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
      
      {file && (
         <Button onClick={handleUpload} disabled={isLoading} className="w-full">
          {isLoading ? 'Загрузка...' : 'Сохранить изображение'}
        </Button>
      )}
    </div>
  );
}

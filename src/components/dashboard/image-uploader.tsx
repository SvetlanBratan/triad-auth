
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { env } from '@/lib/env';
import { Label } from '@/components/ui/label';

interface ImageUploaderProps {
  currentImageUrl?: string | null;
  onUpload: (url: string) => void;
  uploadPreset: string;
}

export default function ImageUploader({ currentImageUrl, onUpload, uploadPreset }: ImageUploaderProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'Файл слишком большой',
          description: 'Пожалуйста, выберите изображение размером до 5 МБ.',
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
    if (!env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
        toast({
            variant: 'destructive',
            title: 'Ошибка конфигурации',
            description: 'Cloudinary не настроен.',
        });
        return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error:', errorData);
        throw new Error(`Не удалось загрузить изображение. ${errorData.error.message}`);
      }

      const data = await response.json();
      const secureUrl = data.secure_url;
      
      setUploadProgress(100);
      onUpload(secureUrl);

      toast({
        title: 'Изображение обновлено!',
      });
      setFile(null); // Clear file after successful upload
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
        <Label>Изображение</Label>
      <div
        className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-muted hover:border-primary transition-colors"
        onClick={() => document.getElementById('image-file-input')?.click()}
      >
        <input
          id="image-file-input"
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
            <p className="text-xs">PNG, JPG или GIF (до 5MB)</p>
          </div>
        )}
      </div>

      {isLoading && <Progress value={uploadProgress} className="w-full" />}
      
      {file && (
         <Button onClick={handleUpload} disabled={isLoading} className="w-full">
          {isLoading ? 'Загрузка...' : 'Загрузить новое изображение'}
        </Button>
      )}
    </div>
  );
}

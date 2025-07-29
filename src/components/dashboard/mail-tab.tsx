
'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Trash2, MailOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { MailMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

export default function MailTab() {
  const { currentUser, markMailAsRead, deleteMailMessage } = useUser();
  const { toast } = useToast();
  const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedMail = useMemo(() => {
    if (!currentUser?.mail) return [];
    return [...currentUser.mail].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }, [currentUser?.mail]);

  const handleSelectMail = (mail: MailMessage) => {
    setSelectedMail(mail);
    if (!mail.isRead) {
      markMailAsRead(mail.id);
    }
  };

  const handleDelete = async () => {
    if (!selectedMail) return;
    setIsDeleting(true);
    try {
        await deleteMailMessage(selectedMail.id);
        toast({ title: "Письмо удалено" });
        setSelectedMail(null);
    } catch (e) {
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось удалить письмо." });
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail /> Почта</CardTitle>
          <CardDescription>Здесь вы можете прочитать личные письма и массовые рассылки.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {sortedMail.length > 0 ? (
                sortedMail.map(mail => (
                  <button
                    key={mail.id}
                    className={cn(
                      "w-full text-left p-3 rounded-md border transition-colors",
                      mail.isRead ? "bg-muted/50 hover:bg-muted" : "bg-primary/10 hover:bg-primary/20",
                    )}
                    onClick={() => handleSelectMail(mail)}
                  >
                    <div className="flex justify-between items-start">
                      <p className={cn("font-semibold", !mail.isRead && "text-primary")}>
                        {mail.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(mail.sentAt).toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      От: {mail.senderCharacterName}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-center text-muted-foreground pt-16">Ваш почтовый ящик пуст.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMail} onOpenChange={(isOpen) => !isOpen && setSelectedMail(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMail && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMail.subject}</DialogTitle>
                <DialogDescription>
                  От: {selectedMail.senderCharacterName} | {new Date(selectedMail.sentAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-96 pr-4 my-4">
                <p className="whitespace-pre-wrap">{selectedMail.content}</p>
              </ScrollArea>
              <DialogFooter className="flex justify-between w-full">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" disabled={isDeleting}>
                            <Trash2 className="mr-2" />
                            {isDeleting ? "Удаление..." : "Удалить"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Это действие навсегда удалит это письмо.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <DialogClose asChild>
                  <Button><MailOpen className="mr-2" />Закрыть</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

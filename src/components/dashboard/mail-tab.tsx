

'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, MailOpen, Reply } from 'lucide-react';
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
import { differenceInDays } from 'date-fns';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import Image from 'next/image';
import { CustomIcon } from '../ui/custom-icon';


export default function MailTab() {
  const { currentUser, markMailAsRead, deleteMailMessage, performRelationshipAction } = useUser();
  const { toast } = useToast();
  const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplyMode, setIsReplyMode] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const sortedMail = useMemo(() => {
    if (!currentUser?.mail) return [];
    return [...currentUser.mail].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }, [currentUser?.mail]);

  const handleSelectMail = (mail: MailMessage) => {
    setSelectedMail(mail);
    setIsReplyMode(false);
    setReplyContent('');
    if (!mail.isRead) {
      markMailAsRead(mail.id);
    }
  };
  
  const handleDialogClose = () => {
      setSelectedMail(null);
      setIsReplyMode(false);
      setReplyContent('');
  }

  const handleDelete = async () => {
    if (!selectedMail) return;
    setIsDeleting(true);
    try {
        await deleteMailMessage(selectedMail.id);
        toast({ title: "Письмо удалено" });
        handleDialogClose();
    } catch (e) {
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось удалить письмо." });
    } finally {
        setIsDeleting(false);
    }
  };
  
  const handleReply = async () => {
      if (!selectedMail || !replyContent.trim() || !currentUser) return;
      setIsReplying(true);

      const senderCharacterId = selectedMail.senderCharacterId;
      if (!senderCharacterId) {
          toast({ variant: 'destructive', title: "Ошибка", description: "Невозможно определить получателя." });
          setIsReplying(false);
          return;
      }
      
      try {
           await performRelationshipAction({
                sourceUserId: currentUser.id,
                sourceCharacterId: selectedMail.recipientCharacterId,
                targetCharacterId: senderCharacterId,
                actionType: 'письмо',
                description: `Ответ на письмо от ${selectedMail.senderCharacterName}`,
                content: replyContent,
            });
            toast({ title: 'Ответ отправлен!' });
            handleDialogClose();
      } catch (error) {
           const errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
           toast({ variant: 'destructive', title: 'Ошибка', description: errorMessage });
      } finally {
          setIsReplying(false);
      }
  }
  
  const canReply = useMemo(() => {
      if (!selectedMail || !currentUser || selectedMail.type !== 'personal') return false;
      // The current user must be the recipient to reply
      return currentUser.characters.some(c => c.id === selectedMail.recipientCharacterId);
  }, [selectedMail, currentUser]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CustomIcon src="/icons/mail.svg" className="w-5 h-5 icon-primary" /> Почта</CardTitle>
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
                    <div className="text-xs text-muted-foreground flex justify-between">
                        <span>От: {mail.senderCharacterName}</span>
                        {mail.recipientCharacterName && <span>Для: {mail.recipientCharacterName}</span>}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-muted-foreground pt-16">Ваш почтовый ящик пуст.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMail} onOpenChange={(isOpen) => !isOpen && handleDialogClose()}>
        <DialogContent className="max-w-2xl">
          {selectedMail && (
            isReplyMode ? (
                 <>
                    <DialogHeader>
                        <DialogTitle>Ответ на письмо</DialogTitle>
                        <DialogDescription>
                            Ответить {selectedMail.senderCharacterName} от имени {selectedMail.recipientCharacterName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="reply-content">Ваш ответ:</Label>
                        <Textarea 
                            id="reply-content"
                            rows={10}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Напишите ваш ответ..."
                        />
                    </div>
                    <DialogFooter className="flex justify-between w-full">
                         <Button variant="ghost" onClick={() => setIsReplyMode(false)}>Назад к письму</Button>
                         <Button onClick={handleReply} disabled={isReplying || !replyContent.trim()}>
                            {isReplying ? 'Отправка...' : 'Отправить ответ'}
                         </Button>
                    </DialogFooter>
                </>
            ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedMail.subject}</DialogTitle>
                    <DialogDescription className="text-xs">
                      От: {selectedMail.senderCharacterName} | Для: {selectedMail.recipientCharacterName} | {new Date(selectedMail.sentAt).toLocaleString()}
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-96 pr-4 my-4">
                    <p className="whitespace-pre-wrap">{selectedMail.content}</p>
                  </ScrollArea>
                  <DialogFooter className="flex justify-between items-center w-full">
                    <div className="flex gap-2">
                         {canReply && (
                            <Button variant="outline" onClick={() => setIsReplyMode(true)}>
                                <Reply className="mr-2" />
                                Ответить
                            </Button>
                        )}
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
                    </div>
                    <DialogClose asChild>
                      <Button><MailOpen className="mr-2" />Закрыть</Button>
                    </DialogClose>
                  </DialogFooter>
                </>
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

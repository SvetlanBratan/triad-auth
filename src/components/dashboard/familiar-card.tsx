import React from 'react';
import type { FamiliarCard } from '@/lib/types';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog';
import { FAMILIARS_BY_ID } from '@/lib/data';

const FamiliarCardDisplay = ({ cardId, isRevealed = false }: { cardId: string, isRevealed?: boolean }) => {
    const card = FAMILIARS_BY_ID[cardId];
    if (!card) return null;

    if (isRevealed) {
        return (
             <div className="w-[300px] h-[420px] relative cursor-pointer group">
                <Image 
                    src={card.imageUrl} 
                    alt={card.name} 
                    width={300}
                    height={420}
                    className="rounded-xl object-contain shadow-2xl w-full h-full"
                    data-ai-hint={card['data-ai-hint']}
                />
            </div>
        )
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="w-24 h-36 relative cursor-pointer group">
                    <Image 
                        src={card.imageUrl} 
                        alt={card.name} 
                        width={96}
                        height={144}
                        className="rounded-md object-contain w-full h-full transition-all duration-300 group-hover:scale-105"
                        data-ai-hint={card['data-ai-hint']}
                    />
                </div>
            </DialogTrigger>
            <DialogContent className="p-0 bg-transparent border-none max-w-[400px]">
                 <DialogTitle className="sr-only">{card.name}</DialogTitle>
                <Image 
                  src={card.imageUrl} 
                  alt={card.name} 
                  width={400}
                  height={600}
                  className="rounded-lg w-full h-auto"
                   data-ai-hint={card['data-ai-hint']}
                />
            </DialogContent>
        </Dialog>
    );
};

export default FamiliarCardDisplay;

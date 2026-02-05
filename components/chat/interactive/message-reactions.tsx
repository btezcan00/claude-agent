'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Heart, Sparkles, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactionType, MessageReaction } from '@/types/chat';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MessageReactionsProps {
  messageId: string;
  messageContent: string;
  reactions?: MessageReaction[];
  onReactionAdd?: (messageId: string, reaction: ReactionType) => void;
  onReactionRemove?: (messageId: string, reaction: ReactionType) => void;
  showCopyButton?: boolean;
  className?: string;
}

const REACTION_CONFIG: {
  type: ReactionType;
  icon: typeof ThumbsUp;
  label: string;
  activeColor: string;
}[] = [
  {
    type: 'thumbs_up',
    icon: ThumbsUp,
    label: 'Nuttig',
    activeColor: 'text-green-500',
  },
  {
    type: 'thumbs_down',
    icon: ThumbsDown,
    label: 'Niet nuttig',
    activeColor: 'text-red-500',
  },
  {
    type: 'heart',
    icon: Heart,
    label: 'Geweldig',
    activeColor: 'text-pink-500',
  },
  {
    type: 'sparkles',
    icon: Sparkles,
    label: 'Fantastisch',
    activeColor: 'text-yellow-500',
  },
];

export function MessageReactions({
  messageId,
  messageContent,
  reactions = [],
  onReactionAdd,
  onReactionRemove,
  showCopyButton = true,
  className,
}: MessageReactionsProps) {
  const [copied, setCopied] = useState(false);

  const handleReactionClick = (reactionType: ReactionType) => {
    const existingReaction = reactions.find((r) => r.type === reactionType);
    if (existingReaction) {
      onReactionRemove?.(messageId, reactionType);
    } else {
      onReactionAdd?.(messageId, reactionType);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const hasReaction = (type: ReactionType) =>
    reactions.some((r) => r.type === type);

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          className
        )}
      >
        {REACTION_CONFIG.map(({ type, icon: Icon, label, activeColor }) => (
          <Tooltip key={type}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  'h-6 w-6 rounded-full',
                  hasReaction(type) && activeColor
                )}
                onClick={() => handleReactionClick(type)}
              >
                <Icon
                  className={cn(
                    'h-3 w-3 transition-all',
                    hasReaction(type) && 'fill-current scale-110'
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {label}
            </TooltipContent>
          </Tooltip>
        ))}

        {showCopyButton && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 rounded-full"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {copied ? 'Gekopieerd!' : 'Kopiëren'}
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

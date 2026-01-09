'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  valueClassName?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  valueClassName,
}: StatsCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn('text-2xl font-bold mt-1', valueClassName)}>{value}</p>
            {trend && (
              <p
                className={cn(
                  'text-xs mt-1',
                  trend.value > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.value > 0 ? '+' : ''}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-primary/10 rounded-full">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import React, { memo } from 'react';
import { Card } from '../common/Card';
import { cva, type VariantProps } from 'class-variance-authority';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const statCardVariants = cva('group relative overflow-hidden', {
  variants: {
    variant: {
      default: 'bg-white/90 backdrop-blur-sm',
      primary: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
      secondary: 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200',
      accent: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200',
      success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
      warning: 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200',
      error: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200',
      glass: 'bg-white/60 backdrop-blur-md border-white/20',
    },
    size: {
      sm: 'min-h-[100px]',
      default: 'min-h-[120px]',
      lg: 'min-h-[140px]',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  footer?: React.ReactNode;
  loading?: boolean;
  gradient?: boolean;
}

const StatCard = memo(
  React.forwardRef<HTMLDivElement, StatCardProps>(
    (
      {
        className = '',
        variant,
        size,
        title,
        value,
        icon,
        trend,
        subtitle,
        footer,
        loading = false,
        gradient = false,
        ...props
      },
      ref
    ) => {
      // Icon background colors based on variant
      const iconBgMap: Record<string, string> = {
        primary: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        secondary: 'bg-gradient-to-br from-gray-500 to-slate-600',
        accent: 'bg-gradient-to-br from-amber-500 to-yellow-600',
        success: 'bg-gradient-to-br from-green-500 to-emerald-600',
        warning: 'bg-gradient-to-br from-orange-500 to-red-600',
        error: 'bg-gradient-to-br from-red-500 to-rose-600',
        glass: 'bg-gradient-to-br from-brand-blue to-brand-blue/80',
        default: 'bg-gradient-to-br from-brand-blue to-brand-blue/80',
      };

      const iconBg = iconBgMap[variant || 'default'];

      const renderTrendIcon = () => {
        if (!trend) return null;

        if (trend.value > 0) {
          return <TrendingUp className="w-3 h-3" />;
        } else if (trend.value < 0) {
          return <TrendingDown className="w-3 h-3" />;
        } else {
          return <Minus className="w-3 h-3" />;
        }
      };

      const getTrendColor = () => {
        if (!trend) return '';
        return trend.isPositive ? 'text-green-600' : 'text-red-600';
      };

      return (
        <Card
          ref={ref}
          className={`${statCardVariants({ variant, size })} ${className}`}
          variant={gradient ? 'gradient' : 'default'}
          padding="lg"
          hover={!loading}
          loading={loading}
          {...props}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />

          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600 mb-1 leading-tight">{title}</h3>
                {subtitle && <p className="text-xs text-gray-500 leading-tight">{subtitle}</p>}
              </div>

              {icon && (
                <div
                  className={`p-2.5 rounded-xl ${iconBg} shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}
                >
                  <div className="text-white w-5 h-5 flex items-center justify-center">{icon}</div>
                </div>
              )}
            </div>

            {/* Value */}
            <div className="flex-1 flex items-center">
              <div className="text-2xl font-bold text-gray-900 group-hover:text-brand-blue transition-colors duration-300">
                {loading ? <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" /> : value}
              </div>
            </div>

            {/* Trend */}
            {trend && (
              <div className="flex items-center space-x-1 mt-2">
                <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                  {renderTrendIcon()}
                  <span className="text-sm font-medium">{Math.abs(trend.value)}%</span>
                </div>
                <span className="text-xs text-gray-500">vs last period</span>
              </div>
            )}

            {/* Footer */}
            {footer && <div className="mt-3 pt-3 border-t border-gray-200/60">{footer}</div>}
          </div>

          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </Card>
      );
    }
  )
);

StatCard.displayName = 'StatCard';

// Skeleton variant for loading states
const StatCardSkeleton = memo(() => (
  <Card className="min-h-[120px] animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-20 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
      <div className="w-10 h-10 bg-gray-200 rounded-xl" />
    </div>
    <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-16" />
  </Card>
));

StatCardSkeleton.displayName = 'StatCardSkeleton';

export { StatCard, StatCardSkeleton };

import React, { memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'relative bg-white/80 backdrop-blur-sm border border-gray-200/60 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-brand-blue/5 hover:border-brand-blue/20 hover:-translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'rounded-xl shadow-sm',
        bordered: 'rounded-xl border-2',
        flat: 'rounded-lg',
        glass: 'rounded-xl bg-white/60 backdrop-blur-md border-white/20 shadow-xl',
        gradient: 'rounded-xl bg-gradient-to-br from-white to-gray-50/50 shadow-md',
      },
      padding: {
        none: '',
        sm: 'p-3 sm:p-4',
        md: 'p-4 sm:p-5',
        lg: 'p-5 sm:p-6',
        xl: 'p-6 sm:p-8',
      },
      size: {
        default: '',
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      size: 'default',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  loading?: boolean;
}

const Card = memo(
  React.forwardRef<HTMLDivElement, CardProps>(
    (
      {
        className = '',
        variant,
        padding,
        size,
        as: Component = 'div',
        children,
        hover = true,
        loading = false,
        ...props
      },
      ref
    ) => {
      const baseClasses = cardVariants({ variant, padding, size });
      const hoverClasses = hover
        ? 'hover:shadow-lg hover:shadow-brand-blue/5 hover:border-brand-blue/20 hover:-translate-y-0.5'
        : '';
      const loadingClasses = loading ? 'animate-pulse' : '';

      return (
        <Component
          className={`${baseClasses} ${hoverClasses} ${loadingClasses} ${className}`}
          ref={ref}
          role={Component === 'div' ? 'article' : undefined}
          {...props}
        >
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {children}
        </Component>
      );
    }
  )
);

Card.displayName = 'Card';

// Enhanced CardHeader with better typography
const CardHeader = memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', children, ...props }, ref) => (
      <div ref={ref} className={`pb-4 border-b border-gray-200/60 ${className}`} {...props}>
        {children}
      </div>
    )
  )
);

CardHeader.displayName = 'CardHeader';

// Enhanced CardTitle with gradient text support
interface CardTitleProps extends React.ComponentPropsWithoutRef<'h2'> {
  gradient?: boolean;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const CardTitle = memo(
  React.forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className = '', gradient = false, level = 2, children, ...props }, ref) => {
      const Component = `h${level}` as any;
      const gradientClasses = gradient
        ? 'bg-gradient-to-r from-brand-blue to-brand-blue/80 bg-clip-text text-transparent'
        : '';

      return (
        <Component
          ref={ref}
          className={`text-lg font-semibold text-gray-900 leading-tight ${gradientClasses} ${className}`}
          {...props}
        >
          {children}
        </Component>
      );
    }
  )
);

CardTitle.displayName = 'CardTitle';

// Enhanced CardDescription with better contrast
const CardDescription = memo(
  React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className = '', children, ...props }, ref) => (
      <p ref={ref} className={`text-sm text-gray-600 leading-relaxed ${className}`} {...props}>
        {children}
      </p>
    )
  )
);

CardDescription.displayName = 'CardDescription';

// Enhanced CardContent with better spacing
const CardContent = memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', children, ...props }, ref) => (
      <div ref={ref} className={`pt-4 ${className}`} {...props}>
        {children}
      </div>
    )
  )
);

CardContent.displayName = 'CardContent';

// Enhanced CardFooter with border and spacing
const CardFooter = memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', children, ...props }, ref) => (
      <div ref={ref} className={`pt-4 mt-4 border-t border-gray-200/60 ${className}`} {...props}>
        {children}
      </div>
    )
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

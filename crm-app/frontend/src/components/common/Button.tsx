import React, { memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.02] focus:ring-blue-500/30 active:scale-[0.98] font-medium',
        destructive:
          'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 hover:scale-[1.02] focus:ring-red-500/30 active:scale-[0.98]',
        outline:
          'border-2 border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 hover:scale-[1.02] focus:ring-gray-400/30 active:scale-[0.98]',
        secondary:
          'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 shadow-sm hover:shadow-md hover:from-gray-200 hover:to-gray-300 hover:scale-[1.02] focus:ring-gray-400/30 active:scale-[0.98]',
        ghost:
          'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400/30 hover:scale-[1.02] active:scale-[0.98]',
        link: 'text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 focus:ring-blue-500/30',
        success:
          'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/25 hover:scale-[1.02] focus:ring-green-500/30 active:scale-[0.98]',
        warning:
          'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:shadow-xl hover:shadow-amber-500/25 hover:scale-[1.02] focus:ring-amber-500/30 active:scale-[0.98]',
        gradient:
          'bg-gradient-to-r from-brand-blue via-purple-600 to-brand-blue text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.02] focus:ring-purple-500/30 active:scale-[0.98]',
        accent:
          'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-gray-900 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/40 hover:scale-[1.05] hover:from-yellow-300 hover:to-yellow-500 hover:brightness-110 focus:ring-yellow-500/50 active:scale-[0.98] font-semibold transform',
      },
      size: {
        'xs': 'h-7 px-2 text-xs rounded-md',
        'sm': 'h-8 px-3 text-xs rounded-lg',
        'default': 'h-10 px-4 py-2 text-sm rounded-lg',
        'lg': 'h-12 px-6 text-base rounded-xl',
        'xl': 'h-14 px-8 text-lg rounded-xl',
        'icon': 'h-10 w-10 rounded-lg',
        'icon-xs': 'h-7 w-7 rounded-md',
        'icon-sm': 'h-8 w-8 rounded-lg',
        'icon-lg': 'h-12 w-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  asChild?: boolean;
}

const Button = memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        className = '',
        variant,
        size,
        leftIcon,
        rightIcon,
        isLoading = false,
        loadingText,
        fullWidth = false,
        disabled,
        children,
        asChild = false,
        ...props
      },
      ref
    ) => {
      const baseClasses = buttonVariants({ variant, size });
      const widthClasses = fullWidth ? 'w-full' : '';
      const isDisabled = disabled || isLoading;

      const content = (
        <>
          {/* Shimmer effect for gradient buttons */}
          {(variant === 'default' || variant === 'gradient') && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          )}

          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {loadingText || 'Loading...'}
            </>
          ) : (
            <>
              {leftIcon && <span className="mr-2 flex-shrink-0">{leftIcon}</span>}
              {children}
              {rightIcon && <span className="ml-2 flex-shrink-0">{rightIcon}</span>}
            </>
          )}
        </>
      );

      if (asChild) {
        return <span className={`${baseClasses} ${widthClasses} ${className}`}>{content}</span>;
      }

      return (
        <button
          className={`${baseClasses} ${widthClasses} ${className}`}
          ref={ref}
          disabled={isDisabled}
          aria-busy={isLoading}
          {...props}
        >
          {content}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';

// Enhanced IconButton for better icon handling
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  'icon': React.ReactNode;
  'aria-label': string;
  'tooltip'?: string;
}

const IconButton = memo(
  React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon, className = '', size = 'icon', ...props }, ref) => (
      <Button ref={ref} size={size} className={className} {...props}>
        {icon}
      </Button>
    )
  )
);

IconButton.displayName = 'IconButton';

// Button Group for related actions
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'default' | 'lg';
}

const ButtonGroup = memo(
  ({
    children,
    className = '',
    orientation = 'horizontal',
    size = 'default',
  }: ButtonGroupProps) => {
    const orientationClasses = orientation === 'horizontal' ? 'flex-row' : 'flex-col';
    const sizeClasses = {
      sm: 'space-x-2 space-y-0',
      default: 'space-x-3 space-y-0',
      lg: 'space-x-4 space-y-0',
    }[size];

    return (
      <div className={`flex ${orientationClasses} ${sizeClasses} ${className}`} role="group">
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

export { Button, IconButton, ButtonGroup, buttonVariants };

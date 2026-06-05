import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'purple' | 'gold' | 'red' | 'default';
  delay?: number;
}

export default function InteractiveCard({ 
  children, 
  className, 
  onClick, 
  variant = 'default',
  delay = 0 
}: InteractiveCardProps) {
  const variants = {
    purple: 'hover:border-vibrant-purple/50 shadow-vibrant-purple/0 hover:shadow-vibrant-purple/10',
    gold: 'hover:border-gold-accent/50 shadow-gold-accent/0 hover:shadow-gold-accent/10',
    red: 'hover:border-red-500/50 shadow-red-500/0 hover:shadow-red-500/10',
    default: 'hover:border-white/20 shadow-white/0 hover:shadow-white/5'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative bg-surface-dark border border-white/5 p-8 transition-all duration-300 cursor-pointer overflow-hidden group",
        variants[variant],
        className
      )}
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute -inset-px opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl z-0",
        variant === 'purple' && "bg-vibrant-purple",
        variant === 'gold' && "bg-gold-accent",
        variant === 'red' && "bg-red-500",
        variant === 'default' && "bg-white"
      )} />

      {/* Inner Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Interactive Border Gradient */}
      <div className={cn(
        "absolute bottom-0 left-0 h-1 bg-gradient-to-r transition-all duration-500 w-0 group-hover:w-full",
        variant === 'purple' && "from-vibrant-purple to-indigo-600",
        variant === 'gold' && "from-gold-accent to-yellow-600",
        variant === 'red' && "from-red-500 to-orange-600",
        variant === 'default' && "from-slate-500 to-slate-200"
      )} />
    </motion.div>
  );
}

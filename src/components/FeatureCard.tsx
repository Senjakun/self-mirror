import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="group relative p-6 bg-card border border-border rounded-lg transition-all duration-300 hover:border-primary/50 hover:box-glow">
      {/* Icon */}
      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-primary mb-4 group-hover:text-glow transition-all duration-300">
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>

      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
    </div>
  );
};

export default FeatureCard;

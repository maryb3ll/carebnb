import React from 'react';
import Icon from '../../../components/AppIcon';

const StatCard = ({ icon, label, count, color = 'var(--color-primary)' }) => {
  return (
    <div className="bg-card rounded-2xl p-6 md:p-8 shadow-organic transition-base hover:shadow-organic-md">
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon name={icon} size={24} color={color} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-sm md:text-base text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl md:text-3xl font-semibold text-foreground">{count}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
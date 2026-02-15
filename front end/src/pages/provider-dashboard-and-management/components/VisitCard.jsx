import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VisitCard = ({ visit, onViewDetails }) => {
  // Get first letter of patient name for avatar
  const initial = (visit?.patientName || 'P')[0].toUpperCase();

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-organic hover:shadow-organic-md transition-base">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div
          className="w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-lg md:text-xl"
          style={{ backgroundColor: '#FFC0CB' }}
        >
          {initial}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">{visit?.patientName}</h3>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Icon name="Stethoscope" size={16} color="var(--color-muted-foreground)" />
              <span>{visit?.service}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="Clock" size={16} color="var(--color-muted-foreground)" />
              <span>{visit?.time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="MapPin" size={16} color="var(--color-muted-foreground)" />
              <span>{visit?.distance}</span>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onViewDetails(visit)}
          className="w-full sm:w-auto"
        >
          View Details
        </Button>
      </div>
    </div>
  );
};

export default VisitCard;
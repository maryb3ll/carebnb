import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';

const ProviderCard = ({ provider, onClick }) => {
  return (
    <div
      onClick={() => onClick(provider)}
      className="flex-shrink-0 w-72 md:w-80 lg:w-96 bg-white rounded-2xl shadow-organic hover:shadow-organic-md transition-all duration-250 cursor-pointer overflow-hidden"
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e?.key === 'Enter' && onClick(provider)}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <Image
          src={provider?.image}
          alt={provider?.imageAlt}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 md:p-5 lg:p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-foreground truncate mb-1">
              {provider?.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {provider?.specialty}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            <Icon name="Star" size={16} color="var(--color-primary)" fill="var(--color-primary)" strokeWidth={0} />
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {provider?.rating}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Icon name="MapPin" size={14} strokeWidth={2} />
            <span className="whitespace-nowrap">{provider?.distance} miles</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="Clock" size={14} strokeWidth={2} />
            <span className="whitespace-nowrap">{provider?.nextAvailable}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${provider?.available ? 'bg-success' : 'bg-muted'}`} />
          <span className="text-xs md:text-sm text-muted-foreground">
            {provider?.available ? 'Available today' : 'Book in advance'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;
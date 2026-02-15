import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestStatus = ({ requests, onViewAlternatives }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'accepted':
        return {
          icon: 'CheckCircle',
          color: 'var(--color-success)',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          text: 'Accepted'
        };
      case 'declined':
        return {
          icon: 'XCircle',
          color: 'var(--color-error)',
          bgColor: 'bg-error/10',
          borderColor: 'border-error/20',
          text: 'Declined'
        };
      default:
        return {
          icon: 'Clock',
          color: 'var(--color-warning)',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          text: 'Pending'
        };
    }
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
          Your Requests
        </h2>

        <div className="space-y-4">
          {requests?.map((request) => {
            const statusConfig = getStatusConfig(request?.status);
            
            return (
              <div
                key={request?.id}
                className={`bg-white rounded-2xl shadow-organic p-6 md:p-8 border-2 ${statusConfig?.borderColor}`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden">
                      <Image
                        src={request?.providerImage}
                        alt={request?.providerImageAlt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">
                          {request?.providerName}
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          {request?.serviceType}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 ${statusConfig?.bgColor} rounded-full flex-shrink-0`}>
                        <Icon name={statusConfig?.icon} size={18} color={statusConfig?.color} strokeWidth={2} />
                        <span className="text-sm font-medium" style={{ color: statusConfig?.color }}>
                          {statusConfig?.text}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon name="Calendar" size={16} strokeWidth={2} />
                        <span>{request?.requestedDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon name="Clock" size={16} strokeWidth={2} />
                        <span>{request?.requestedTime}</span>
                      </div>
                    </div>

                    {request?.status === 'accepted' && (
                      <div className="flex items-start gap-2 p-4 bg-success/5 rounded-xl mb-4">
                        <Icon name="Info" size={18} color="var(--color-success)" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">
                          Your appointment is confirmed. The provider will arrive at your location on {request?.requestedDate} at {request?.requestedTime}.
                        </p>
                      </div>
                    )}

                    {request?.status === 'declined' && (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 p-4 bg-error/5 rounded-xl">
                          <Icon name="Info" size={18} color="var(--color-error)" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-foreground">
                            Unfortunately, this provider is not available. We've found similar providers who can help.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => onViewAlternatives(request?.id)}
                          iconName="Users"
                          iconPosition="left"
                          fullWidth
                        >
                          View Alternative Providers
                        </Button>
                      </div>
                    )}

                    {request?.status === 'pending' && (
                      <div className="flex items-start gap-2 p-4 bg-warning/5 rounded-xl">
                        <Icon name="Info" size={18} color="var(--color-warning)" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">
                          Waiting for provider response. You'll be notified once they accept or decline your request.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RequestStatus;
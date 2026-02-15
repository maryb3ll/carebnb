import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const STATUS_ORDER = { accepted: 0, pending: 1, cancelled: 2, declined: 3, completed: 4 };

const STATUS_CONFIG = {
  accepted: {
    label: 'Accepted',
    icon: 'CheckCircle',
    iconBg: 'bg-emerald-100',
    iconColor: 'var(--color-success)',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    calloutBg: 'bg-emerald-50 border border-emerald-100',
    calloutIcon: 'var(--color-success)',
  },
  declined: {
    label: 'Declined',
    icon: 'XCircle',
    iconBg: 'bg-red-100',
    iconColor: 'var(--color-error)',
    badge: 'bg-red-50 text-red-700 border border-red-200',
    calloutBg: 'bg-red-50 border border-red-100',
    calloutIcon: 'var(--color-error)',
  },
  pending: {
    label: 'Pending',
    icon: 'Clock',
    iconBg: 'bg-amber-100',
    iconColor: 'var(--color-warning)',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    calloutBg: 'bg-amber-50 border border-amber-100',
    calloutIcon: 'var(--color-warning)',
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'Ban',
    iconBg: 'bg-stone-200',
    iconColor: 'var(--color-muted-foreground)',
    badge: 'bg-stone-50 text-stone-700 border border-stone-200',
    calloutBg: 'bg-stone-50 border border-stone-100',
    calloutIcon: 'var(--color-muted-foreground)',
  },
  completed: {
    label: 'Completed',
    icon: 'CheckCircle2',
    iconBg: 'bg-blue-100',
    iconColor: 'var(--color-primary)',
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    calloutBg: 'bg-blue-50 border border-blue-100',
    calloutIcon: 'var(--color-primary)',
  },
};

const RequestStatus = ({ requests, onViewAlternatives }) => {
  const sorted = [...(requests || [])].sort(
    (a, b) => (STATUS_ORDER[a?.status] ?? 3) - (STATUS_ORDER[b?.status] ?? 3)
  );

  if (!requests?.length) {
    return (
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10" aria-label="Your care requests">
        <div className="max-w-[1440px] mx-auto">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 md:p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <Icon name="ClipboardList" size={28} className="text-stone-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No requests yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              When you request care from a provider, your requests will appear here with their status.
            </p>
            <p className="text-xs text-muted-foreground">
              Go to <span className="font-medium text-foreground">Request care</span> to submit a new request.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10" aria-label="Your care requests">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Your Requests
          </h2>
          <span className="text-sm text-muted-foreground">
            {requests.length} request{requests.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-4">
          {sorted.map((request) => {
            const config = STATUS_CONFIG[request?.status] || STATUS_CONFIG.pending;
            return (
              <article
                key={request?.id}
                className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100">
                        <Image
                          src={request?.providerImage}
                          alt={request?.providerImageAlt ?? request?.providerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-foreground">
                            {request?.providerName}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {request?.serviceType}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${config.badge}`}
                        >
                          <Icon
                            name={config.icon}
                            size={14}
                            color={config.iconColor}
                            strokeWidth={2}
                          />
                          {config.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="Calendar" size={14} strokeWidth={2} />
                          {request?.requestedDate}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="Clock" size={14} strokeWidth={2} />
                          {request?.requestedTime}
                        </span>
                      </div>

                      {request?.status === 'accepted' && (
                        <div
                          className={`flex items-start gap-3 p-3 rounded-lg border ${config.calloutBg}`}
                        >
                          <Icon
                            name="Info"
                            size={18}
                            color={config.calloutIcon}
                            strokeWidth={2}
                            className="flex-shrink-0 mt-0.5"
                          />
                          <p className="text-sm text-foreground leading-relaxed">
                            Your appointment is confirmed. The provider will arrive at your location on{' '}
                            <span className="font-medium">{request?.requestedDate}</span> at{' '}
                            <span className="font-medium">{request?.requestedTime}</span>.
                          </p>
                        </div>
                      )}

                      {request?.status === 'declined' && (
                        <div className="space-y-3">
                          <div
                            className={`flex items-start gap-3 p-3 rounded-lg border ${config.calloutBg}`}
                          >
                            <Icon
                              name="Info"
                              size={18}
                              color={config.calloutIcon}
                              strokeWidth={2}
                              className="flex-shrink-0 mt-0.5"
                            />
                            <p className="text-sm text-foreground leading-relaxed">
                              This provider isn’t available. We’ve found similar providers who can help.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewAlternatives?.(request?.id)}
                            iconName="Users"
                            iconPosition="left"
                          >
                            View alternative providers
                          </Button>
                        </div>
                      )}

                      {request?.status === 'pending' && (
                        <div
                          className={`flex items-start gap-3 p-3 rounded-lg border ${config.calloutBg}`}
                        >
                          <Icon
                            name="Info"
                            size={18}
                            color={config.calloutIcon}
                            strokeWidth={2}
                            className="flex-shrink-0 mt-0.5"
                          />
                          <p className="text-sm text-foreground leading-relaxed">
                            Waiting for the provider to respond. You'll be notified when they accept or decline.
                          </p>
                        </div>
                      )}

                      {request?.status === 'cancelled' && (
                        <div
                          className={`flex items-start gap-3 p-3 rounded-lg border ${config.calloutBg}`}
                        >
                          <Icon
                            name="Info"
                            size={18}
                            color={config.calloutIcon}
                            strokeWidth={2}
                            className="flex-shrink-0 mt-0.5"
                          />
                          <p className="text-sm text-foreground leading-relaxed">
                            This appointment was cancelled.
                          </p>
                        </div>
                      )}

                      {request?.status === 'completed' && (
                        <div
                          className={`flex items-start gap-3 p-3 rounded-lg border ${config.calloutBg}`}
                        >
                          <Icon
                            name="Info"
                            size={18}
                            color={config.calloutIcon}
                            strokeWidth={2}
                            className="flex-shrink-0 mt-0.5"
                          />
                          <p className="text-sm text-foreground leading-relaxed">
                            This appointment has been completed.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RequestStatus;

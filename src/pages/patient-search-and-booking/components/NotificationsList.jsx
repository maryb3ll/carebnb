import React from 'react';
import Icon from '../../../components/AppIcon';

const NotificationsList = ({ notifications }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'confirmation':
        return { name: 'CheckCircle', color: 'var(--color-success)' };
      case 'reminder':
        return { name: 'Bell', color: 'var(--color-warning)' };
      case 'update':
        return { name: 'Info', color: 'var(--color-primary)' };
      default:
        return { name: 'MessageSquare', color: 'var(--color-muted-foreground)' };
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
          Notifications
        </h2>

        <div className="space-y-3">
          {notifications?.map((notification) => {
            const iconConfig = getNotificationIcon(notification?.type);
            
            return (
              <div
                key={notification?.id}
                className={`bg-white rounded-2xl shadow-organic p-4 md:p-6 transition-all duration-250 hover:shadow-organic-md ${
                  !notification?.read ? 'border-l-4 border-primary' : ''
                }`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-muted rounded-xl">
                      <Icon name={iconConfig?.name} size={20} color={iconConfig?.color} strokeWidth={2} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-base md:text-lg font-semibold text-foreground">
                        {notification?.title}
                      </h3>
                      <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                        {getTimeAgo(notification?.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {notification?.message}
                    </p>
                    {!notification?.read && (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          New
                        </span>
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

export default NotificationsList;
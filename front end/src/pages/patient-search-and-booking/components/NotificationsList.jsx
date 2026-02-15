import React from 'react';
import Icon from '../../../components/AppIcon';

const TYPE_CONFIG = {
  confirmation: {
    label: 'Confirmed',
    icon: 'CheckCircle',
    iconBg: 'bg-emerald-100',
    iconColor: 'var(--color-success)',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  reminder: {
    label: 'Reminder',
    icon: 'Bell',
    iconBg: 'bg-amber-100',
    iconColor: 'var(--color-warning)',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  update: {
    label: 'Update',
    icon: 'Info',
    iconBg: 'bg-sky-100',
    iconColor: 'var(--color-primary)',
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
  },
};

const DEFAULT_TYPE = {
  label: 'Notification',
  icon: 'MessageSquare',
  iconBg: 'bg-stone-100',
  iconColor: 'var(--color-muted-foreground)',
  badge: 'bg-stone-100 text-stone-600 border border-stone-200',
};

const NotificationsList = ({ notifications }) => {
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const t = new Date(timestamp);
    const diffMs = now - t;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const sorted = [...(notifications || [])].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  if (!notifications?.length) {
    return (
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10" aria-label="Notifications">
        <div className="max-w-[1440px] mx-auto">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 md:p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <Icon name="Bell" size={28} className="text-stone-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No notifications yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              When you book appointments or get updates from providers, they’ll show up here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10" aria-label="Notifications">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-white text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </h2>
        </div>

        <div className="space-y-3">
          {sorted.map((notification) => {
            const config = TYPE_CONFIG[notification?.type] || DEFAULT_TYPE;
            return (
              <article
                key={notification?.id}
                className={`rounded-xl border bg-white transition-all duration-200 hover:shadow-md overflow-hidden ${
                  !notification?.read
                    ? 'border-l-4 border-l-primary border-stone-200 shadow-sm'
                    : 'border-stone-200'
                }`}
              >
                <div className="p-4 md:p-5">
                  <div className="flex gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center ${config.iconBg}`}
                      aria-hidden
                    >
                      <Icon
                        name={config.icon}
                        size={22}
                        color={config.iconColor}
                        strokeWidth={2}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${config.badge}`}
                        >
                          {config.label}
                        </span>
                        {!notification?.read && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            New
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                          {getTimeAgo(notification?.timestamp)}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        {notification?.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notification?.message}
                      </p>
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

export default NotificationsList;

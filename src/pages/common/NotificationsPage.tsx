import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { NotificationRow } from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../lib/utils';
import { Bell, CheckCheck, ExternalLink, RefreshCw } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications((data || []) as NotificationRow[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (n: NotificationRow) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      await loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    await supabase.rpc('mark_all_notifications_read');
    await loadNotifications();
  };

  const categories = Array.from(new Set(notifications.map((n) => n.category)));

  const filtered = notifications.filter((n) => {
    if (filter === 'unread' && n.is_read) return false;
    if (categoryFilter !== 'ALL' && n.category !== categoryFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">Notifications Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            In-app workflow alerts stored in PostgreSQL ({unreadCount} unread)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadNotifications}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="primary" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filter === 'all' ? 'bg-[#002B49] text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filter === 'unread' ? 'bg-[#002B49] text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="notif-cat-filter" className="text-xs font-medium text-slate-600">
            Category:
          </label>
          <select
            id="notif-cat-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
          >
            <option value="ALL">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bell className="h-4 w-4 text-teal-600" />
            <span>Notification History</span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading notifications...</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">
            No notifications match your current filter.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !n.is_read ? 'bg-teal-50/40' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                      {n.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    {!n.is_read && (
                      <span className="inline-flex items-center rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{n.body}</p>
                  <p className="text-[11px] text-slate-400">{formatDateTime(n.created_at)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.is_read && (
                    <Button variant="outline" size="sm" onClick={() => handleMarkRead(n)}>
                      Mark Read
                    </Button>
                  )}
                  {n.link && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        await handleMarkRead(n);
                        navigate(n.link!);
                      }}
                    >
                      <span>Open</span>
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

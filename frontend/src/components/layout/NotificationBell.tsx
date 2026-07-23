import { Menu, Transition } from "@headlessui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "@/lib/api-client";
import { cn, formatDateTime } from "@/lib/utils";
import type { AppNotification, PaginatedResponse } from "@/types";

async function fetchUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ unread_count: number }>("/notifications/unread-count/");
  return data.unread_count;
}

async function fetchRecentNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<PaginatedResponse<AppNotification>>("/notifications/", {
    params: { page_size: 6 },
  });
  return data.results;
}

export function NotificationBell() {
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: fetchRecentNotifications,
  });

  const markAllRead = async () => {
    await apiClient.post("/notifications/read-all/");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-surface-3 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[0.6rem] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-30 mt-2 w-80 origin-top-right rounded-card border border-line bg-canvas shadow-hover focus:outline-none">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">You&apos;re all caught up.</p>
            ) : (
              notifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  {({ active }) => (
                    <Link
                      to={notification.action_url || "#"}
                      className={cn("block border-b border-line px-4 py-3 last:border-0", active && "bg-surface-3")}
                    >
                      <p className={cn("text-sm", !notification.is_read && "font-semibold")}>{notification.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{notification.body}</p>
                      <p className="mt-1 text-[0.7rem] text-slate-400/70">{formatDateTime(notification.created_at)}</p>
                    </Link>
                  )}
                </Menu.Item>
              ))
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

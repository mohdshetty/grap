
import React, { createContext, useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Notification } from '../types';
import { MOCK_NOTIFICATIONS } from '../constants';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: number) => void;
    markAllAsRead: () => void;
    handleNotificationClick: (notification: Notification, setActivePage: (page: string) => void, closeModal: () => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (user) {
            const userNotifications = MOCK_NOTIFICATIONS
                .filter(n => n.userId === user.id)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setNotifications(userNotifications);
        } else {
            setNotifications([]);
        }
    }, [user]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    const markAsRead = useCallback((id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);
    
    const handleNotificationClick = useCallback((notification: Notification, setActivePage: (page: string) => void, closeModal: () => void) => {
        markAsRead(notification.id);
        if (notification.link) {
            setActivePage(notification.link);
        }
        closeModal();
    }, [markAsRead]);

    const value = useMemo(() => ({ notifications, unreadCount, markAsRead, markAllAsRead, handleNotificationClick }), [notifications, unreadCount, markAsRead, markAllAsRead, handleNotificationClick]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

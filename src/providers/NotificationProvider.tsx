import React from 'react';

import { Notification } from 'components/atoms/Notification';
import { Portal } from 'components/atoms/Portal';
import { DOM } from 'helpers/config';

export type NotificationKind = 'success' | 'warning' | 'info';

interface NotificationItem {
	id: string;
	message: string;
	type: NotificationKind;
	timestamp: number;
	persistent?: boolean;
}

interface NotificationOptions {
	persistent?: boolean;
}

interface NotificationContextState {
	notifications: NotificationItem[];
	addNotification: (message: string, type: NotificationKind, opts?: NotificationOptions) => string;
	removeNotification: (id: string) => void;
}

type NotificationGlobal = typeof globalThis & {
	__lunarNotificationContext?: React.Context<NotificationContextState | undefined>;
};

const notificationGlobal = globalThis as NotificationGlobal;

const NotificationContext =
	notificationGlobal.__lunarNotificationContext ??
	(notificationGlobal.__lunarNotificationContext = React.createContext<NotificationContextState | undefined>(
		undefined
	));

export function useNotifications() {
	const context = React.useContext(NotificationContext);
	if (!context) {
		throw new Error('useNotifications must be used within a NotificationProvider');
	}
	return context;
}

export function NotificationProvider(props: { children: React.ReactNode }) {
	const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

	const addNotification = React.useCallback((message: string, type: NotificationKind, opts?: NotificationOptions) => {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
		const newNotification: NotificationItem = {
			id,
			message,
			type,
			timestamp: Date.now(),
			persistent: opts?.persistent,
		};

		setNotifications((prev) => [...prev, newNotification]);
		return id;
	}, []);

	const removeNotification = React.useCallback((id: string) => {
		setNotifications((prev) => prev.filter((notification) => notification.id !== id));
	}, []);

	const contextValue = React.useMemo(
		() => ({
			notifications,
			addNotification,
			removeNotification,
		}),
		[notifications, addNotification, removeNotification]
	);

	return <NotificationContext.Provider value={contextValue}>{props.children}</NotificationContext.Provider>;
}

export function NotificationViewport() {
	const { notifications, removeNotification } = useNotifications();

	if (!notifications.length) return null;

	return (
		<Portal node={DOM.notification}>
			<div
				style={{
					position: 'fixed',
					bottom: '20px',
					left: '50%',
					transform: 'translateX(-50%)',
					zIndex: 2147483647,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '15px',
				}}
			>
				{notifications.map((notification) => (
					<Notification
						key={notification.id}
						message={notification.message}
						type={notification.type}
						persistent={notification.persistent}
						callback={() => removeNotification(notification.id)}
					/>
				))}
			</div>
		</Portal>
	);
}

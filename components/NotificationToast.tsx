import { Snackbar } from "react-native-paper"
import type { Notification } from "../hooks/useNotification"


// === TYPES & INTERFACES ==================================================================

interface NotificationToastProps {
    notification: Notification | null
    onClose: () => void
    autoHideDuration?: number
}


// === COMPONENT: NOTIFICATIONTOAST ========================================================

export function NotificationToast({
    notification,
    onClose,
    autoHideDuration = 6000
}: NotificationToastProps) {

    if (!notification) return null

    return (
        // `key` remounts the Snackbar for each new message so its auto-hide timer restarts
        <Snackbar
            key={notification.id}
            visible={notification.open}
            duration={autoHideDuration}
            onDismiss={onClose}
            action={{
                label: 'Close',
                // Snackbar already calls `onDismiss` when the action is pressed,
                // so we don't need an explicit onPress here.
            }}
        >
            {notification.message}
        </Snackbar>
    )
}

import { StyleSheet } from "react-native"
import { Snackbar, Text } from "react-native-paper"
import type { Notification, NotificationSeverity } from "../hooks/useNotification"


// === TYPES & INTERFACES ==================================================================

interface NotificationToastProps {
    notification: Notification | null
    onClose: () => void
    autoHideDuration?: number
}


// === CONSTANTS ===========================================================================

// Background per severity: the web app's MUI filled Alert colors
const SEVERITY_COLORS: Record<NotificationSeverity, string> = {
    error: '#d32f2f',
    warning: '#ed6c02',
    info: '#0288d1',
    success: '#2e7d32',
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
            style={{ backgroundColor: SEVERITY_COLORS[notification.severity] }}
            action={{
                label: 'Close',
                textColor: '#fff',
                // Snackbar already calls `onDismiss` when the action is pressed,
                // so we don't need an explicit onPress here.
            }}
        >
            {/* "alert" so screen readers announce it right away, like the web app's MUI Alert */}
            <Text accessibilityRole="alert" style={styles.message}>
                {notification.message}
            </Text>
        </Snackbar>
    )
}

const styles = StyleSheet.create({
    message: {
        color: '#fff',
    },
})

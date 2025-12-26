import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastNotificationProps {
    message: string;
    type: ToastType;
    isVisible: boolean;
    onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
    message,
    type,
    isVisible,
    onClose,
}) => {
    const icons = {
        success: <CheckCircle className="text-emerald-400" size={20} />,
        error: <AlertCircle className="text-red-400" size={20} />,
        info: <AlertCircle className="text-cyan-400" size={20} />,
    };

    const backgrounds = {
        success: 'bg-emerald-500/10 border-emerald-500/30',
        error: 'bg-red-500/10 border-red-500/30',
        info: 'bg-cyan-500/10 border-cyan-500/30',
    };

    const glows = {
        success: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
        error: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
        info: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]',
    };

    return (
        <div
            className={`
        fixed top-4 right-4 z-[100] max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
        >
            <div
                className={`
          flex items-center gap-3 p-4 rounded-xl border backdrop-blur-xl
          ${backgrounds[type]} ${glows[type]}
        `}
            >
                {icons[type]}
                <p className="flex-1 text-sm text-white font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

// Toast hook for easy usage
export const useToast = () => {
    const [toast, setToast] = React.useState<{
        message: string;
        type: ToastType;
        isVisible: boolean;
    }>({
        message: '',
        type: 'info',
        isVisible: false,
    });

    const showToast = React.useCallback((message: string, type: ToastType = 'info') => {
        setToast({ message, type, isVisible: true });

        // Auto-hide after 4 seconds
        setTimeout(() => {
            setToast(prev => ({ ...prev, isVisible: false }));
        }, 4000);
    }, []);

    const hideToast = React.useCallback(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
    }, []);

    const ToastComponent = (
        <ToastNotification
            message={toast.message}
            type={toast.type}
            isVisible={toast.isVisible}
            onClose={hideToast}
        />
    );

    return { showToast, hideToast, ToastComponent };
};

// Toast utility that provides a consistent API for both react-hot-toast and shadcn toast
export const toast = {
  success: (message: string, options?: { description?: string }) => {
    if (options?.description) {
      // Use shadcn toast for messages with descriptions
      shadcnToast({ 
        title: message,
        description: options.description,
        variant: 'default'}
      });
    } else {
      // Use react-hot-toast for simple messages
      hotToast.success(message);
    }
  },

  error: (message: string, options?: { description?: string }) => {
    if (options?.description) {
      // Use shadcn toast for messages with descriptions
      shadcnToast({ 
        title: message,
        description: options.description,
        variant: 'destructive'}
      });
    } else {
      // Use react-hot-toast for simple messages
      hotToast.error(message);
    }
  },

  info: (message: string, options?: { description?: string }) => {
    if (options?.description) {
      // Use shadcn toast for messages with descriptions
      shadcnToast({ 
        title: message,
        description: options.description,
        variant: 'default'}
      });
    } else {
      // Use react-hot-toast for simple messages
      hotToast(message);
    }
  },

  warning: (message: string, options?: { description?: string }) => {
    if (options?.description) {
      // Use shadcn toast for messages with descriptions
      shadcnToast({ 
        title: message,
        description: options.description,
        variant: 'default'}
      });
    } else {
      // Use react-hot-toast for simple messages
      hotToast(message, {
        icon: '⚠️'}
    }
  },

  // Direct access to underlying toast systems
  hot: hotToast,
  shadcn: shadcnToast,
};

// Export individual functions for convenience
export const { success, error, info, warning } = toast;
import { useState, useCallback } from 'react';

export interface DialogState<T = any> {
    isOpen: boolean;
    data: T | null;
    isLoading: boolean;
    error: string | null;
}

export interface UseDialogStateOptions<T = any> {
    initialData?: T | null;
    onClose?: () => void;
    onOpen?: (data?: T) => void;
}

/**
 * A custom hook for managing dialog state consistently across components.
 * 
 * @param options Configuration options for the dialog state
 * @returns Dialog state and control functions
 */
export function useDialogState<T = any>(options: UseDialogStateOptions<T> = {}) {
    const { initialData = null, onClose, onOpen } = options;

    const [state, setState] = useState<DialogState<T>>({
        isOpen: false,
        data: initialData,
        isLoading: false,
        error: null,
    });

    const openDialog = useCallback((data?: T) => {
        setState(prev => ({
            ...prev,
            isOpen: true,
            data: data !== undefined ? data : prev.data,
            error: null,
        }));

        if (onOpen) {
            onOpen(data);
        }
    }, [onOpen]);

    const closeDialog = useCallback(() => {
        setState(prev => ({
            ...prev,
            isOpen: false,
        }));

        if (onClose) {
            onClose();
        }
    }, [onClose]);

    const setLoading = useCallback((isLoading: boolean) => {
        setState(prev => ({
            ...prev,
            isLoading,
        }));
    }, []);

    const setError = useCallback((error: string | null) => {
        setState(prev => ({
            ...prev,
            error,
            isLoading: false,
        }));
    }, []);

    const setData = useCallback((data: T | null) => {
        setState(prev => ({
            ...prev,
            data,
        }));
    }, []);

    const reset = useCallback(() => {
        setState({
            isOpen: false,
            data: initialData,
            isLoading: false,
            error: null,
        });
    }, [initialData]);

    return {
        // State
        isOpen: state.isOpen,
        data: state.data,
        isLoading: state.isLoading,
        error: state.error,

        // Actions
        openDialog,
        closeDialog,
        setLoading,
        setError,
        setData,
        reset,
    };
}

/**
 * A hook for managing multiple dialogs in a component.
 * 
 * @param dialogNames Array of dialog names to manage
 * @returns An object with dialog states and control functions for each dialog
 */
export function useMultipleDialogs(dialogNames: string[]) {
    const initialState = dialogNames.reduce((acc, name) => {
        acc[name] = {
            isOpen: false,
            data: null,
            isLoading: false,
            error: null,
        };
        return acc;
    }, {} as Record<string, DialogState>);

    const [dialogs, setDialogs] = useState<Record<string, DialogState>>(initialState);

    const openDialog = useCallback((name: string, data?: any) => {
        setDialogs(prev => ({
            ...prev,
            [name]: {
                ...prev[name],
                isOpen: true,
                data: data !== undefined ? data : prev[name].data,
                error: null,
            },
        }));
    }, []);

    const closeDialog = useCallback((name: string) => {
        setDialogs(prev => ({
            ...prev,
            [name]: {
                ...prev[name],
                isOpen: false,
            },
        }));
    }, []);

    const setLoading = useCallback((name: string, isLoading: boolean) => {
        setDialogs(prev => ({
            ...prev,
            [name]: {
                ...prev[name],
                isLoading,
            },
        }));
    }, []);

    const setError = useCallback((name: string, error: string | null) => {
        setDialogs(prev => ({
            ...prev,
            [name]: {
                ...prev[name],
                error,
                isLoading: false,
            },
        }));
    }, []);

    const setData = useCallback((name: string, data: any) => {
        setDialogs(prev => ({
            ...prev,
            [name]: {
                ...prev[name],
                data,
            },
        }));
    }, []);

    const reset = useCallback((name?: string) => {
        if (name) {
            setDialogs(prev => ({
                ...prev,
                [name]: initialState[name],
            }));
        } else {
            setDialogs(initialState);
        }
    }, [initialState]);

    return {
        // States
        dialogs,

        // Actions
        openDialog,
        closeDialog,
        setLoading,
        setError,
        setData,
        reset,
    };
}
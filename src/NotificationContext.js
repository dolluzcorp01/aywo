import { createContext, useState, useContext } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [showNotification, setShowNotification] = useState(false);

    return (
        <NotificationContext.Provider value={{ showNotification, setShowNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);

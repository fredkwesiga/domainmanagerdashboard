import { createContext } from "react";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    const value = {
        message: "Welcome to Tek Juice",
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;

import React, { createContext, useContext, useState, useMemo } from 'react'

const dict = {
  en: {
    appName: 'SafeShop',
    products: 'Products',
    cart: 'Cart',
    chat: 'Chat',
    login: 'Login',
    searchProducts: 'Search products',
    addToCart: 'Add to Cart',
    yourCart: 'Your Cart',
    continueShopping: 'Continue shopping',
    checkout: 'Checkout',
  },
  rw: {
    appName: 'SafeShop',
    products: 'Ibicuruzwa',
    cart: 'Agasanduku',
    chat: 'Ikiganiro',
    login: 'Injira',
    searchProducts: 'Shakisha ibicuruzwa',
    addToCart: 'Ongeraho mu gasanduku',
    yourCart: 'Agasanduku kawe',
    continueShopping: 'Komeza kugura',
    checkout: 'Kwishyura',
  }
}

const I18nCtx = createContext()
export function I18nProvider({ children }){
  const [lang, setLang] = useState('en')
  const value = useMemo(()=>({
    lang,
    setLang,
    t: (k) => dict[lang][k] || k
  }), [lang])
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}
export function useI18n(){ return useContext(I18nCtx) }

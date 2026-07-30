import React, { createContext, useContext, useState } from 'react';

type SubTab = 'himnos' | 'estribillos' | 'indice';

interface HymnFilterContextType {
  search: string;
  setSearch: (text: string) => void;
  searchFilter: string;
  setSearchFilter: (filter: string) => void;
  activeSubTab: SubTab;
  setActiveSubTab: (tab: SubTab) => void;
  resetFilter: () => void;
}

const HymnFilterContext = createContext<HymnFilterContextType>({
  search: '',
  setSearch: () => {},
  searchFilter: 'Todos',
  setSearchFilter: () => {},
  activeSubTab: 'himnos',
  setActiveSubTab: () => {},
  resetFilter: () => {},
});

export function HymnFilterProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState('');
  const [searchFilter, setSearchFilter] = useState('Todos');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('himnos');

  const resetFilter = () => {
    setSearch('');
    setSearchFilter('Todos');
  };

  return (
    <HymnFilterContext.Provider
      value={{
        search,
        setSearch,
        searchFilter,
        setSearchFilter,
        activeSubTab,
        setActiveSubTab,
        resetFilter,
      }}
    >
      {children}
    </HymnFilterContext.Provider>
  );
}

export const useHymnFilter = () => useContext(HymnFilterContext);

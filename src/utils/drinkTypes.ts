import { DrinkType } from '../types';

export const DRINK_TYPES: DrinkType[] = [
  {
    id: 'beer',
    name: 'Beer',
    icon: '🍺',
    defaultVolume: 355, // 12 oz
    defaultABV: 0.05, // 5%
    color: '#F5A623',
  },
  {
    id: 'shot',
    name: 'Shot',
    icon: '🥃',
    defaultVolume: 44, // 1.5 oz
    defaultABV: 0.40, // 40%
    color: '#D97A3A',
  },
  {
    id: 'wine',
    name: 'Wine',
    icon: '🍷',
    defaultVolume: 148, // 5 oz
    defaultABV: 0.12, // 12%
    color: '#8B2E5F',
  },
  {
    id: 'cocktail',
    name: 'Cocktail',
    icon: '🍹',
    defaultVolume: 120, // 4 oz
    defaultABV: 0.15, // 15%
    color: '#FF6B6B',
  },
];

export const BAC_THRESHOLDS = {
  IMPAIRMENT_STARTS: 0.03, // Impairment in reaction time, judgment starts
  LEGALLY_IMPAIRED: 0.08, // U.S. legal limit for driving (some countries use 0.05%)
  BLACKOUT: 0.15, // Alcohol-induced blackout/memory loss begins
  ALCOHOL_POISONING: 0.30, // Serious alcohol poisoning begins
  LIFE_THREATENING: 0.40, // Life-threatening: suppressed breathing, reduced gag reflex
};


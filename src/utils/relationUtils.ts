import { Cardinality } from '../types/schema';

/**
 * Returns standard default relationship label based on cardinality
 */
export function getDefaultLabelForCardinality(cardinality: Cardinality): string {
  switch (cardinality) {
    case '1:N':
      return 'has many';
    case 'M:N':
      return 'many to many';
    case '1:1':
      return 'has one';
    default:
      return 'has many';
  }
}

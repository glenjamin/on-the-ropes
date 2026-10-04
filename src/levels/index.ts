import type { LevelData } from '../level'
import level1_1 from './1-1'
import level1_2 from './1-2'
import level1_3 from './1-3'
import level1_4 from './1-4'
import level1_5 from './1-5'
import level2_1 from './2-1'

/** Levels grouped into sets; each set gets harder as it goes, and the next set introduces something new. */
export const SETS: { name: string; levels: LevelData[] }[] = [
  { name: 'Lava', levels: [level1_1, level1_2, level1_3, level1_4, level1_5] },
  { name: 'Clouds', levels: [level2_1] },
]

/** Every level in play order. Ids are "set-position", e.g. "1-4" is the fourth level of the first set. */
export const LEVELS: LevelData[] = SETS.flatMap((s) => s.levels)

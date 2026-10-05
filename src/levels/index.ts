import type { LevelData } from '../level'
import level1_1 from './1-1'
import level1_2 from './1-2'
import level1_3 from './1-3'
import level1_4 from './1-4'
import level1_5 from './1-5'
import level2_1 from './2-1'
import level2_2 from './2-2'
import level2_3 from './2-3'
import level2_4 from './2-4'
import level2_5 from './2-5'

/** Levels grouped into sets; each set gets harder as it goes, and the next set introduces something new. */
export const SETS: { name: string; levels: LevelData[] }[] = [
  { name: 'Lava', levels: [level1_1, level1_2, level1_3, level1_4, level1_5] },
  { name: 'Clouds', levels: [level2_1, level2_2, level2_3, level2_4, level2_5] },
]

/** Every level in play order. Ids are "set-position", e.g. "1-4" is the fourth level of the first set. */
export const LEVELS: LevelData[] = SETS.flatMap((s) => s.levels)

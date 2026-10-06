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
import level3_1 from './3-1'
import level3_2 from './3-2'
import level3_3 from './3-3'
import level3_4 from './3-4'
import level3_5 from './3-5'
import level4_1 from './4-1'
import level4_2 from './4-2'
import level4_3 from './4-3'
import level4_4 from './4-4'
import level4_5 from './4-5'
import level5_1 from './5-1'
import level5_2 from './5-2'
import level5_3 from './5-3'
import level5_4 from './5-4'
import level5_5 from './5-5'
import level6_1 from './6-1'
import level6_2 from './6-2'
import level6_3 from './6-3'
import level6_4 from './6-4'
import level6_5 from './6-5'
import level7_1 from './7-1'
import level7_2 from './7-2'
import level7_3 from './7-3'
import level7_4 from './7-4'
import level7_5 from './7-5'

/** Levels grouped into sets; each set gets harder as it goes, and the next set introduces something new. */
export const SETS: { name: string; levels: LevelData[] }[] = [
  { name: 'Lava', levels: [level1_1, level1_2, level1_3, level1_4, level1_5] },
  { name: 'Clouds', levels: [level2_1, level2_2, level2_3, level2_4, level2_5] },
  { name: 'Ice', levels: [level3_1, level3_2, level3_3, level3_4, level3_5] },
  { name: 'Jungle', levels: [level4_1, level4_2, level4_3, level4_4, level4_5] },
  { name: 'Pinball', levels: [level5_1, level5_2, level5_3, level5_4, level5_5] },
  { name: 'Factory', levels: [level6_1, level6_2, level6_3, level6_4, level6_5] },
  { name: 'Space', levels: [level7_1, level7_2, level7_3, level7_4, level7_5] },
]

/** Every level in play order. Ids are "set-position", e.g. "1-4" is the fourth level of the first set. */
export const LEVELS: LevelData[] = SETS.flatMap((s) => s.levels)

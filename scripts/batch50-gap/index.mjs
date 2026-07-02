export { mathGap } from "./数学.mjs";
export { physicsGap } from "./物理.mjs";
export { chemistryGap } from "./化学.mjs";
export { biologyGap } from "./生物.mjs";
export { earthGap } from "./地学.mjs";
export { engineeringGap } from "./工学.mjs";
export { agricultureGap } from "./農学.mjs";
export { csGap } from "./情報・計算機科学.mjs";
export { medicalGap } from "./医歯薬学.mjs";
export { humanitiesGap } from "./人文社会科学.mjs";

import { mathGap } from "./数学.mjs";
import { physicsGap } from "./物理.mjs";
import { chemistryGap } from "./化学.mjs";
import { biologyGap } from "./生物.mjs";
import { earthGap } from "./地学.mjs";
import { engineeringGap } from "./工学.mjs";
import { agricultureGap } from "./農学.mjs";
import { csGap } from "./情報・計算機科学.mjs";
import { medicalGap } from "./医歯薬学.mjs";
import { humanitiesGap } from "./人文社会科学.mjs";

export const gapQuestions = {
  数学: mathGap,
  物理: physicsGap,
  化学: chemistryGap,
  生物: biologyGap,
  地学: earthGap,
  工学: engineeringGap,
  農学: agricultureGap,
  "情報・計算機科学": csGap,
  医歯薬学: medicalGap,
  人文社会科学: humanitiesGap
};

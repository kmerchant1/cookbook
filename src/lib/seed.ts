// Seed content — the sample recipes, stores, and tags from the design board
// (cookbook.dc.html `renderVals`). Used to hydrate a first run so the app looks
// like the mockups out of the box. Cleared/overwritten once the user edits data.

import type { AppState, Hue, Ingredient, Recipe, Step, Store, Tag } from '../types'
import { uid } from './id'

let seq = 0
const nid = (p: string) => `${p}_seed_${(seq++).toString(36)}`

function tag(label: string, hue: Hue): Tag {
  return { id: nid('tag'), label, hue }
}

// One canonical tag list; recipes reference copies so each recipe owns its chips.
const TAGS: Tag[] = [
  tag('Dinner', 'terra'),
  tag('Vegetarian', 'green'),
  tag('Quick', 'amber'),
  tag('Comfort', 'terra'),
  tag('Baking', 'amber'),
  tag('Pasta', 'green'),
  tag('Side', 'green'),
  tag('Fish', 'neutral'),
]

function findTag(label: string): Tag {
  const t = TAGS.find((x) => x.label === label)!
  return { ...t, id: nid('tag') }
}

function ing(quantity: string, name: string, have = false): Ingredient {
  return { id: nid('ing'), quantity, name, have }
}

function steps(...texts: string[]): Step[] {
  return texts.map((text) => ({ id: nid('step'), text }))
}

const now = 1_719_000_000_000 // fixed base so seed order is stable

function recipe(
  index: number,
  data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>,
): Recipe {
  return { ...data, id: nid('rec'), createdAt: now - index * 86_400_000, updatedAt: now - index * 86_400_000 }
}

const curry = recipe(2, {
  name: 'Weeknight Chickpea Curry',
  time: '40 MIN',
  serves: '4 SERVES',
  favorite: true,
  photoBg: '#f1e4cd',
  tags: [findTag('Vegetarian'), findTag('Comfort')],
  ingredients: [
    ing('2 tbsp', 'olive oil', true),
    ing('1', 'yellow onion, diced'),
    ing('3 cloves', 'garlic, minced', true),
    ing('1 tbsp', 'fresh ginger, grated'),
    ing('2 tbsp', 'curry powder'),
    ing('1 can', 'chickpeas, drained'),
    ing('400 ml', 'coconut milk'),
    ing('1 can', 'diced tomatoes'),
    ing('2 cups', 'baby spinach'),
    ing('to serve', 'cilantro & steamed rice'),
  ],
  steps: steps(
    'Warm the oil in a deep pan over medium heat. Add the onion and cook 5 minutes until soft and translucent.',
    'Stir in garlic, ginger, and curry powder. Bloom for 1 minute until fragrant.',
    'Add chickpeas, coconut milk, and tomatoes. Simmer 20 minutes, stirring occasionally.',
    'Fold in the spinach until just wilted. Season with salt to taste.',
    'Serve over rice, finished with a handful of torn cilantro.',
  ),
})

const cuke = recipe(5, {
  name: 'Sesame Cucumber Salad',
  time: '10 MIN',
  serves: '2 SERVES',
  favorite: false,
  photoBg: '#dde6dd',
  tags: [findTag('Quick'), findTag('Side')],
  ingredients: [
    ing('2', 'cucumbers, sliced'),
    ing('2 tbsp', 'rice vinegar', true),
    ing('1 tbsp', 'toasted sesame seeds'),
    ing('1 tbsp', 'soy sauce'),
    ing('1 tsp', 'sesame oil'),
    ing('1 tsp', 'sugar'),
  ],
  steps: steps(
    'Toss cucumbers with salt; rest 10 min, then drain.',
    'Whisk vinegar, soy sauce, sesame oil, and sugar.',
    'Toss cucumbers in the dressing and top with sesame seeds.',
  ),
})

const salmon = recipe(0, {
  name: 'Miso-Glazed Salmon',
  time: '30 MIN',
  serves: '2 SERVES',
  favorite: true,
  photoBg: '#e8d6cc',
  tags: [findTag('Dinner'), findTag('Fish')],
  ingredients: [
    ing('2 fillets', 'salmon'),
    ing('2 tbsp', 'white miso'),
    ing('1 tbsp', 'mirin'),
    ing('1 tbsp', 'soy sauce'),
    ing('1 tsp', 'honey'),
    ing('2', 'scallions, sliced'),
  ],
  steps: steps(
    'Whisk miso, mirin, soy sauce, and honey into a glaze.',
    'Coat salmon and marinate 15 minutes.',
    'Broil 8–10 minutes until caramelized. Top with scallions.',
  ),
})

const orecc = recipe(1, {
  name: 'Charred Broccoli Orecchiette',
  time: '25 MIN',
  serves: '4 SERVES',
  favorite: false,
  photoBg: '#d9e2d9',
  tags: [findTag('Vegetarian'), findTag('Pasta')],
  ingredients: [
    ing('1 lb', 'orecchiette'),
    ing('1 head', 'broccoli, cut into florets'),
    ing('4 cloves', 'garlic, sliced'),
    ing('1/2 tsp', 'red pepper flakes'),
    ing('1/4 cup', 'olive oil'),
    ing('1/2 cup', 'parmesan, grated'),
  ],
  steps: steps(
    'Boil orecchiette until al dente; reserve pasta water.',
    'Char broccoli in a hot pan with oil until deeply browned.',
    'Add garlic and pepper flakes; toss with pasta, water, and parmesan.',
  ),
})

const harissa = recipe(3, {
  name: 'Sheet-Pan Harissa Chicken',
  time: '45 MIN',
  serves: '4 SERVES',
  favorite: false,
  photoBg: '#ecd7cd',
  tags: [findTag('Dinner')],
  ingredients: [
    ing('8', 'chicken thighs'),
    ing('3 tbsp', 'harissa paste'),
    ing('2', 'red onions, wedged'),
    ing('1 lb', 'baby potatoes'),
    ing('2 tbsp', 'olive oil'),
    ing('1', 'lemon'),
  ],
  steps: steps(
    'Toss chicken with harissa and oil; marinate 20 minutes.',
    'Spread with onions and potatoes on a sheet pan.',
    'Roast at 425°F for 35 minutes. Finish with lemon.',
  ),
})

const banana = recipe(4, {
  name: 'Brown Butter Banana Bread',
  time: '60 MIN',
  serves: '8 SLICES',
  favorite: true,
  photoBg: '#f0e6d2',
  tags: [findTag('Baking')],
  ingredients: [
    ing('1/2 cup', 'butter'),
    ing('3', 'ripe bananas'),
    ing('3/4 cup', 'brown sugar'),
    ing('2', 'eggs'),
    ing('1 3/4 cups', 'flour'),
    ing('1 tsp', 'baking soda'),
  ],
  steps: steps(
    'Brown the butter until nutty; cool slightly.',
    'Mash bananas, whisk in sugar, eggs, and butter.',
    'Fold in dry ingredients; bake at 350°F for 55 minutes.',
  ),
})

const SEED_RECIPES: Recipe[] = [salmon, orecc, curry, harissa, banana, cuke]

function gItem(name: string, quantity: string, done: boolean, order: number) {
  return { id: nid('gi'), name, quantity, done, sortOrder: order }
}

const SEED_STORES: Store[] = [
  {
    id: nid('store'),
    name: 'Costco',
    hue: 'terra',
    sortOrder: 0,
    items: [
      gItem('Chickpeas', '2 cans', false, 0),
      gItem('Coconut milk', '2 cans', false, 1),
      gItem('Olive oil', '1 bottle', true, 2),
      gItem('Jasmine rice', '5 lb', false, 3),
    ],
  },
  {
    id: nid('store'),
    name: "Trader Joe's",
    hue: 'green',
    sortOrder: 1,
    items: [
      gItem('Baby spinach', '2 cups', false, 0),
      gItem('Cilantro', '1 bunch', false, 1),
      gItem('Cucumbers', '2', true, 2),
      gItem('Fresh ginger', '1 knob', false, 3),
      gItem('Sesame seeds', '1 jar', false, 4),
    ],
  },
  {
    id: nid('store'),
    name: 'Local Market',
    hue: 'amber',
    sortOrder: 2,
    items: [gItem('Yellow onion', '2', false, 0), gItem('Diced tomatoes', '1 can', true, 1)],
  },
]

export function makeSeedState(): AppState {
  return {
    recipes: SEED_RECIPES,
    stores: SEED_STORES,
    tags: TAGS.map((t) => ({ ...t, id: uid('tag') })),
    selectedForCook: [],
    cookServings: {},
    appearance: 'system',
    account: {
      name: 'Sam Rivera',
      email: 'sam@cookbook.app',
      supabaseUserId: null,
    },
    syncStatus: 'idle',
    lastSyncedAt: null,
  }
}

/** Empty state (README "Recipe Library empty state") — used by "reset to empty". */
export function makeEmptyState(): AppState {
  const s = makeSeedState()
  return { ...s, recipes: [], stores: [], selectedForCook: [], cookServings: {} }
}

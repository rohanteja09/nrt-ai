export interface BodyFact {
  key: string;
  name: string;
  distanceFromSun: string;
  dayLength: string;
  moons: string;
  fact: string;
}

export const BODY_FACTS: Record<string, BodyFact> = {
  sun: {
    key: "sun",
    name: "The Sun",
    distanceFromSun: "—",
    dayLength: "~27 Earth days (rotation)",
    moons: "8 planets orbit it",
    fact: "The Sun accounts for about 99.8% of all the mass in the entire solar system.",
  },
  mercury: {
    key: "mercury",
    name: "Mercury",
    distanceFromSun: "57.9 million km (0.39 AU)",
    dayLength: "176 Earth days",
    moons: "0",
    fact: "A year on Mercury (88 Earth days) is shorter than one of its days.",
  },
  venus: {
    key: "venus",
    name: "Venus",
    distanceFromSun: "108.2 million km (0.72 AU)",
    dayLength: "243 Earth days",
    moons: "0",
    fact: "Venus spins backwards compared to most planets and is the hottest planet in the solar system.",
  },
  earth: {
    key: "earth",
    name: "Earth",
    distanceFromSun: "149.6 million km (1 AU)",
    dayLength: "24 hours",
    moons: "1",
    fact: "Earth is the only known planet with liquid water on its surface and confirmed life.",
  },
  mars: {
    key: "mars",
    name: "Mars",
    distanceFromSun: "227.9 million km (1.52 AU)",
    dayLength: "24.6 hours",
    moons: "2",
    fact: "Mars is home to Olympus Mons, the tallest volcano in the solar system.",
  },
  jupiter: {
    key: "jupiter",
    name: "Jupiter",
    distanceFromSun: "778.5 million km (5.2 AU)",
    dayLength: "9.9 hours",
    moons: "more than 90",
    fact: "Jupiter's Great Red Spot is a storm larger than Earth that has raged for centuries.",
  },
  saturn: {
    key: "saturn",
    name: "Saturn",
    distanceFromSun: "1.43 billion km (9.5 AU)",
    dayLength: "10.7 hours",
    moons: "more than 140",
    fact: "Saturn's rings are made mostly of ice and rock, from dust-sized grains to house-sized chunks.",
  },
  uranus: {
    key: "uranus",
    name: "Uranus",
    distanceFromSun: "2.87 billion km (19.2 AU)",
    dayLength: "17.2 hours",
    moons: "27",
    fact: "Uranus spins almost completely on its side, likely from a massive collision billions of years ago.",
  },
  neptune: {
    key: "neptune",
    name: "Neptune",
    distanceFromSun: "4.5 billion km (30.1 AU)",
    dayLength: "16.1 hours",
    moons: "14",
    fact: "Neptune has the strongest winds in the solar system, reaching over 2,000 km/h.",
  },
  pluto: {
    key: "pluto",
    name: "Pluto",
    distanceFromSun: "5.9 billion km avg (39.5 AU)",
    dayLength: "6.4 Earth days",
    moons: "5",
    fact: "Pluto was reclassified from a planet to a dwarf planet in 2006.",
  },
};

export const BODY_ORDER = [
  "sun",
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
];

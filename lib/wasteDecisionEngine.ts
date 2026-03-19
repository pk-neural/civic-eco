/**
 * Waste Decision Engine — lib/wasteDecisionEngine.ts
 * Category-specific multi-step questionnaire + dynamic recommendations.
 */

export type WasteCategory = "e-waste" | "dry" | "wet" | "hazardous" | "mixed"

// ─── Question Definitions ───────────────────────────────────────────────────

export interface WasteQuestion {
  id:       string
  question: string
  options:  WasteOption[]
}

export interface WasteOption {
  id:    string
  label: string
  icon?: string
}

export type WasteAnswers = Record<string, string>

export const WASTE_QUESTIONS: Record<WasteCategory, WasteQuestion[]> = {
  "e-waste": [
    {
      id:       "device_type",
      question: "What type of electronic device is this?",
      options: [
        { id: "phone",    label: "Smartphone / Tablet",  icon: "📱" },
        { id: "laptop",   label: "Laptop / Computer",    icon: "💻" },
        { id: "cable",    label: "Cables / Chargers",    icon: "🔌" },
        { id: "appliance",label: "Home Appliance",       icon: "🖨️" },
        { id: "battery",  label: "Battery / Power Bank", icon: "🔋" },
      ],
    },
    {
      id:       "battery_included",
      question: "Does it contain a battery?",
      options: [
        { id: "yes", label: "Yes, battery included", icon: "🔋" },
        { id: "no",  label: "No battery",            icon: "✅" },
        { id: "removed", label: "Battery removed",   icon: "🔧" },
      ],
    },
    {
      id:       "repairable",
      question: "Is the device repairable or still usable?",
      options: [
        { id: "yes",       label: "Yes, can be repaired",     icon: "🔧" },
        { id: "partially", label: "Some parts still useful",  icon: "♻️" },
        { id: "no",        label: "Completely non-functional",icon: "🗑️" },
      ],
    },
  ],

  "wet": [
    {
      id:       "food_type",
      question: "What type of wet/food waste is this?",
      options: [
        { id: "vegetable", label: "Vegetable / Fruit peels", icon: "🥦" },
        { id: "cooked",    label: "Cooked food leftovers",   icon: "🍲" },
        { id: "garden",    label: "Garden / Leaf waste",     icon: "🍃" },
        { id: "dairy",     label: "Dairy / Egg waste",       icon: "🥛" },
      ],
    },
    {
      id:       "compost_available",
      question: "Do you have composting facilities available?",
      options: [
        { id: "home",    label: "Yes, home composting bin",      icon: "🌱" },
        { id: "society", label: "Yes, housing society composter",icon: "🏘️" },
        { id: "none",    label: "No composting available",       icon: "❌" },
      ],
    },
    {
      id:       "quantity",
      question: "How much wet waste is generated daily?",
      options: [
        { id: "small",  label: "Small (< 500g)", icon: "🥢" },
        { id: "medium", label: "Medium (0.5–2 kg)", icon: "⚖️" },
        { id: "large",  label: "Large (> 2 kg)",  icon: "📦" },
      ],
    },
  ],

  "dry": [
    {
      id:       "material_type",
      question: "What type of dry waste is this?",
      options: [
        { id: "plastic", label: "Plastic bottles / containers", icon: "🍶" },
        { id: "paper",   label: "Paper / Cardboard",            icon: "📰" },
        { id: "metal",   label: "Metal / Tin cans",             icon: "🥫" },
        { id: "glass",   label: "Glass",                        icon: "🫙" },
        { id: "textile", label: "Old clothes / Textiles",       icon: "👕" },
      ],
    },
    {
      id:       "recyclable_condition",
      question: "What is the condition of the item?",
      options: [
        { id: "clean",      label: "Clean and uncontaminated",   icon: "✨" },
        { id: "dirty",      label: "Dirty but washable",         icon: "🚿" },
        { id: "contaminated",label: "Contaminated / soiled",     icon: "⚠️" },
      ],
    },
    {
      id:       "reuse_possible",
      question: "Can any part of it be reused at home?",
      options: [
        { id: "yes", label: "Yes, can repurpose",        icon: "🔄" },
        { id: "no",  label: "No, must dispose",          icon: "🗑️" },
        { id: "donate", label: "Can donate (clothes etc.)", icon: "💝" },
      ],
    },
  ],

  "hazardous": [
    {
      id:       "hazard_type",
      question: "What type of hazardous waste is this?",
      options: [
        { id: "medicine",  label: "Expired medicines",           icon: "💊" },
        { id: "paint",     label: "Paints / Solvents",           icon: "🎨" },
        { id: "chemical",  label: "Household chemicals / Pesticides", icon: "☠️" },
        { id: "needle",    label: "Sharps / Medical waste",      icon: "💉" },
        { id: "battery",   label: "Large batteries (car/UPS)",   icon: "🔋" },
      ],
    },
    {
      id:       "container_sealed",
      question: "Is it in a sealed/original container?",
      options: [
        { id: "yes",      label: "Yes, sealed and labeled",  icon: "✅" },
        { id: "open",     label: "Open but stable",          icon: "⚠️" },
        { id: "leaking",  label: "Leaking or damaged",       icon: "🚨" },
      ],
    },
    {
      id:       "quantity_hazard",
      question: "What is the approximate quantity?",
      options: [
        { id: "small",  label: "Small amount (< 1L / few items)", icon: "🥢" },
        { id: "medium", label: "Medium (1–5L)",                   icon: "⚖️" },
        { id: "large",  label: "Large quantity (> 5L)",           icon: "🚨" },
      ],
    },
  ],

  "mixed": [
    {
      id:       "can_sort",
      question: "Can you sort this waste before disposal?",
      options: [
        { id: "yes_now",  label: "Yes, I can sort it now",        icon: "✅" },
        { id: "partially",label: "Partially — some easy items",   icon: "⚡" },
        { id: "no",       label: "No, too difficult to sort",     icon: "❌" },
      ],
    },
    {
      id:       "dominant_type",
      question: "What is the dominant waste type in the mix?",
      options: [
        { id: "mostly_dry",  label: "Mostly dry (plastic, paper)",  icon: "📰" },
        { id: "mostly_wet",  label: "Mostly wet (food scraps)",     icon: "🍲" },
        { id: "equal",       label: "Equal mix of wet and dry",     icon: "⚖️" },
        { id: "contains_hazard", label: "Contains hazardous items", icon: "⚠️" },
      ],
    },
    {
      id:       "frequency",
      question: "How often does this mixed waste accumulate?",
      options: [
        { id: "daily",   label: "Daily",         icon: "📅" },
        { id: "weekly",  label: "Weekly",        icon: "🗓️" },
        { id: "oneoff",  label: "One-time event",icon: "🎉" },
      ],
    },
  ],
}

// ─── Recommendation Engine ────────────────────────────────────────────────────

export interface WasteRecommendation {
  action:       string    // "Reuse" | "Recycle" | "Compost" | "Safe Disposal" | "Segregate"
  actionIcon:   string
  actionColor:  string    // Tailwind color class
  ecoCredits:   number
  whatToDo:     string[]
  whatToAvoid:  string[]
  whyItMatters: string
  facilities:   string[]  // Where to take it
}

export function getWasteRecommendation(
  category: WasteCategory,
  answers: WasteAnswers,
): WasteRecommendation {
  switch (category) {
    case "e-waste": return resolveEWaste(answers)
    case "wet":     return resolveWetWaste(answers)
    case "dry":     return resolveDryWaste(answers)
    case "hazardous": return resolveHazardous(answers)
    case "mixed":   return resolveMixed(answers)
  }
}

function resolveEWaste(answers: WasteAnswers): WasteRecommendation {
  const repairable = answers.repairable
  const hasBattery = answers.battery_included === "yes"
  const deviceType = answers.device_type

  if (repairable === "yes") {
    return {
      action: "Reuse",
      actionIcon: "🔧",
      actionColor: "text-emerald-400 bg-emerald-500/20",
      ecoCredits: 20,
      whatToDo: [
        "Take to a certified repair shop to extend device life",
        "Consider donating to NGOs like Goonj or local schools",
        "Reset and sell on OLX / Quikr to give a second life",
      ],
      whatToAvoid: [
        "Do not throw in regular trash bins",
        "Avoid burning or dismantling yourself (toxic fumes)",
      ],
      whyItMatters: "Repairing electronics extends product lifespan by years, preventing 60–80 kg of CO₂ that manufacturing a new device would emit.",
      facilities: ["Authorized service centers", "iFixit network", "Local repair shops"],
    }
  }

  if (repairable === "partially") {
    return {
      action: "Recycle",
      actionIcon: "♻️",
      actionColor: "text-amber-400 bg-amber-500/20",
      ecoCredits: 15,
      whatToDo: [
        hasBattery ? "Remove and separately dispose of the battery at a battery collection point" : "Proceed to e-waste collection",
        "Take to nearest E-waste collection center (check https://ewasteindia.com)",
        `Look for ${deviceType === "phone" ? "brand take-back programs (Apple, Samsung etc.)" : "government e-waste drives in your city"}`,
      ],
      whatToAvoid: [
        "Do not disassemble unless trained — toxic materials inside",
        "Avoid selling to informal scrap dealers who may burn components",
      ],
      whyItMatters: "Recycling 1 million mobile phones recovers 15,000 kg of copper, 340 kg of gold and 3,500 kg of silver — keeping toxic metals out of landfills.",
      facilities: ["E-waste collection centers", "Brand take-back programs", "Authorized recyclers (CPCB-approved)"],
    }
  }

  return {
    action: "Safe Disposal",
    actionIcon: "🗑️",
    actionColor: "text-blue-400 bg-blue-500/20",
    ecoCredits: 10,
    whatToDo: [
      "Contact your municipal corporation for e-waste drives",
      hasBattery ? "MANDATORY: Take battery to CPCB-authorized battery recycler first" : "Hand over to e-waste aggregator",
      "Never place in regular bins — use designated e-waste drop points",
    ],
    whatToAvoid: [
      "Never dump in open areas or water bodies",
      "Do not allow informal waste pickers to handle without protective gear",
    ],
    whyItMatters: "E-waste contains lead, mercury, and cadmium that leach into soil and groundwater, contaminating drinking water for communities nearby.",
    facilities: ["Municipal e-waste collection drives", "CPCB authorized e-waste recyclers", "Retailer take-back schemes"],
  }
}

function resolveWetWaste(answers: WasteAnswers): WasteRecommendation {
  const compost    = answers.compost_available
  const foodType   = answers.food_type
  const isGarden   = foodType === "garden"
  const isDairy    = foodType === "dairy"

  if (compost === "home" || compost === "society") {
    return {
      action: "Compost",
      actionIcon: "🌱",
      actionColor: "text-green-400 bg-green-500/20",
      ecoCredits: 18,
      whatToDo: [
        isGarden ? "Add leaves/garden waste in layers with kitchen scraps for faster composting" : "Add wet waste to compost bin daily",
        isDairy ? "Add dairy waste in small quantities mixed with dry leaves to avoid odors" : "Mix with dry leaves for balanced compost",
        compost === "home" ? "Turn the compost pile every 3-4 days for faster decomposition" : "Carry it to the society composter every day",
      ],
      whatToAvoid: [
        "Avoid adding meat or oily food to compost (attracts pests)",
        "Do not let wet waste sit — add daily",
      ],
      whyItMatters: "Home composting diverts food waste from landfills where it would produce methane — a greenhouse gas 25x more potent than CO₂. The compost also enriches soil.",
      facilities: ["Your home compost bin", "Housing society composting unit", "Kirloskar Bio-Composters"],
    }
  }

  return {
    action: "Compost",
    actionIcon: "🌿",
    actionColor: "text-teal-400 bg-teal-500/20",
    ecoCredits: 12,
    whatToDo: [
      "Segregate wet waste into a separate green bin",
      "Contact your municipal corporation for wet waste collection schedule",
      "Consider starting a simple 2-pot compost system at home (costs ~₹500)",
    ],
    whatToAvoid: [
      "Do not mix with dry or hazardous waste",
      "Do not throw down the drain — blocks sewage and causes water pollution",
    ],
    whyItMatters: "India generates ~62 million tonnes of municipal solid waste annually. Proper wet waste segregation enables composting and reduces landfill burden by up to 60%.",
    facilities: ["Municipal wet waste collection", "BBMP / BMC collection vans", "Community composting sites"],
  }
}

function resolveDryWaste(answers: WasteAnswers): WasteRecommendation {
  const material = answers.material_type
  const condition = answers.recyclable_condition
  const canReuse = answers.reuse_possible

  if (canReuse === "donate") {
    return {
      action: "Reuse",
      actionIcon: "💝",
      actionColor: "text-pink-400 bg-pink-500/20",
      ecoCredits: 22,
      whatToDo: [
        "Donate clothes to NGOs like Goonj, iCall, or local shelters",
        "List usable items on platforms like FreeCycle, OLX or Facebook Marketplace",
        "Pass items to friends, family or neighbours who may need them",
      ],
      whatToAvoid: [
        "Don't donate torn, soiled or unusable items — it burdens the receiving organization",
        "Avoid burning old textiles — releases toxic dioxins",
      ],
      whyItMatters: "The fashion industry emits 10% of global CO₂. Extending a garment's life by just 9 months reduces its environmental impact by 20-30%.",
      facilities: ["Goonj collection points", "Local temple / mosque donation drives", "Online donation platforms"],
    }
  }

  if (condition === "contaminated") {
    return {
      action: "Safe Disposal",
      actionIcon: "🗑️",
      actionColor: "text-slate-400 bg-slate-500/20",
      ecoCredits: 5,
      whatToDo: [
        "Wash and clean items if possible before recycling",
        "If uncleanable, dispose in dry waste bin for landfill (last resort)",
        "For plastic: check resin code (bottom of container) — codes 1, 2, 5 are most recyclable",
      ],
      whatToAvoid: [
        "Do not mix contaminated items with clean recyclables — it ruins entire batches",
        "Avoid burning plastic — releases carcinogenic dioxins",
      ],
      whyItMatters: `${material === "plastic" ? "Plastic takes 400-1000 years to decompose. Even contaminated plastic can be down-cycled if properly managed." : "Proper disposal prevents toxic leachate from entering groundwater."}`,
      facilities: ["Dry waste collection centers", "Kabadiwala network", "ITC Wealth Recycling"],
    }
  }

  return {
    action: "Recycle",
    actionIcon: "♻️",
    actionColor: "text-amber-400 bg-amber-500/20",
    ecoCredits: 15,
    whatToDo: [
      "Rinse food containers before recycling",
      material === "paper" ? "Flatten cardboard boxes to save space" : `Check local ${material} recycling acceptance`,
      "Bundle and give to your local kabadiwala (recycler) or dry waste collection",
    ],
    whatToAvoid: [
      "Don't mix wet food waste with dry recyclables",
      material === "glass" ? "Wrap broken glass carefully before disposal" : "Don't shred items before recycling",
    ],
    whyItMatters: `Recycling ${material === "paper" ? "1 tonne of paper saves 17 trees and 50% energy vs. virgin paper production" : material === "metal" ? "aluminum saves 95% of the energy needed to produce it from bauxite ore" : "reduces demand for virgin raw materials and cuts manufacturing emissions"}.`,
    facilities: ["Blue dry waste bins", "Kabadiwala / scrap dealers", "ITC WOW stores", "Swachh app pickup"],
  }
}

function resolveHazardous(answers: WasteAnswers): WasteRecommendation {
  const hazardType = answers.hazard_type
  const isLeaking = answers.container_sealed === "leaking"

  if (isLeaking) {
    return {
      action: "Safe Disposal",
      actionIcon: "🚨",
      actionColor: "text-red-400 bg-red-500/20",
      ecoCredits: 8,
      whatToDo: [
        "IMMEDIATE: Place in a secondary sealed container (zip-lock bag / plastic box)",
        "Wear gloves when handling — avoid skin contact",
        "Call your municipal hazardous waste helpline for emergency pickup",
        "Do NOT pour down drain or into soil",
      ],
      whatToAvoid: [
        "Do not attempt to mix with other chemicals",
        "Do not place in regular waste collection",
        "Keep away from children and pets",
      ],
      whyItMatters: "Even small quantities of leaking hazardous waste can contaminate thousands of litres of groundwater, affecting drinking water quality for an entire community.",
      facilities: ["CPCB-authorized hazardous waste handlers", "Municipal hazardous waste helpline", "Hospital waste disposal for medical items"],
    }
  }

  const facilityMap: Record<string, string[]> = {
    medicine: ["Pharmacies with medicine take-back", "PHC / government hospitals", "Drug Disposal Day events"],
    paint:    ["Hardware stores with solvent take-back", "CPCB-licensed hazardous waste handlers"],
    chemical: ["Municipal hazardous waste drop-off", "Manufacturer take-back programs"],
    needle:   ["Hospital puncture-proof disposal", "PHC waste bins"],
    battery:  ["Exide / Amara Raja dealer take-back", "CPCB battery recyclers"],
  }

  return {
    action: "Safe Disposal",
    actionIcon: "⚠️",
    actionColor: "text-orange-400 bg-orange-500/20",
    ecoCredits: 10,
    whatToDo: [
      `For ${hazardType === "medicine" ? "medicines: crush and mix with soil/cat litter before disposal OR return to pharmacy" : hazardType === "needle" ? "sharps: use a rigid puncture-proof container first" : "this waste: keep in original sealed container"}`,
      "Never pour down drains or flush toilets",
      "Contact CPCB or local authority for authorized disposal facility",
    ],
    whatToAvoid: [
      "Never burn hazardous waste — produces toxic fumes",
      "Do not bury in ground or throw in open areas",
      "Never mix different chemicals",
    ],
    whyItMatters: hazardType === "medicine"
      ? "Pharmaceutical compounds in water affect aquatic life and can create antibiotic-resistant bacteria strains in the environment."
      : "Hazardous chemicals contaminate soil for decades, and can cause serious neurological and developmental issues in nearby communities.",
    facilities: facilityMap[hazardType] || ["CPCB-authorized hazardous waste handlers", "Municipal special collection drives"],
  }
}

function resolveMixed(answers: WasteAnswers): WasteRecommendation {
  const canSort = answers.can_sort
  const dominant = answers.dominant_type

  if (canSort === "yes_now") {
    return {
      action: "Segregate",
      actionIcon: "⚡",
      actionColor: "text-teal-400 bg-teal-500/20",
      ecoCredits: 16,
      whatToDo: [
        "Separate into: Wet (food), Dry (paper/plastic), Hazardous (batteries/medicines)",
        "Use different colored bags: Green = Wet, Blue/White = Dry, Red = Hazardous",
        "Once segregated, handle each component as per its category",
      ],
      whatToAvoid: [
        "Don't rush and mix items back — accuracy matters more than speed",
        "Wash hands thoroughly after handling mixed waste",
      ],
      whyItMatters: "Properly segregated waste has a recycling rate of 60-80%. Mixed waste ends up entirely in landfills, releasing greenhouse gases for decades.",
      facilities: ["Your home with 3-bin system", "Society-level segregation facility", "Municipal door-to-door collection"],
    }
  }

  const isHazardous = dominant === "contains_hazard"
  return {
    action: isHazardous ? "Safe Disposal" : "Segregate",
    actionIcon: isHazardous ? "⚠️" : "♻️",
    actionColor: isHazardous ? "text-orange-400 bg-orange-500/20" : "text-amber-400 bg-amber-500/20",
    ecoCredits: isHazardous ? 8 : 10,
    whatToDo: [
      isHazardous
        ? "Extract any hazardous items FIRST and handle separately"
        : "Start with easy separations — remove any obvious recyclables",
      "Dispose remaining unsegregated waste via municipal mixed waste collection",
      "Consider setting up a 3-bin system at home to prevent this in future",
    ],
    whatToAvoid: [
      "Do not compact or crush mixed waste — makes sorting harder",
      "Never burn to reduce volume",
    ],
    whyItMatters: "India diverts less than 30% of its waste for processing — most goes to landfills. Better segregation at source is the single most impactful change households can make.",
    facilities: ["Municipal mixed waste collection", "Area sanitation worker collection", "Swachh Bharat drives"],
  }
}

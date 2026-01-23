// ---------- Data: Single-colour frames ----------
export const singleFrames = [
  {
    id: "white",
    name: "Unit Icon",
    src: "frames/white.png",
    usage: "In-game unit icon. Transparent (masked) areas will use the player colour.",
    description: "Standard unit icon used in building UI (barracks training queues, selection bar). Often used for home city unit shipments too, but most of them tend to use a standard version as well. For example, settler wagons don't have a separate non-transparent icon, but Landwehr do.\nMasked areas will be replaced with the current player colour while in-game. Note that it's best to use greys for the masked areas to replace, as strong colours can remain unchanged. Note the example settler wagon image.",
    usesAlpha: true,
    filename: (unit) => `${unit}_icon.png`,
    examples: [
      { label: "Any trainable unit in-game" },
      { label: "2 Settler Wagons", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=German_Home_City_1_%282_Settler_Wagons%29.png#New_World_Trading_Company" },
    ]
  },
  {
    id: "white-opaque",
    name: "White (HC)",
    src: "frames/white.png",
    usage: "Alternative non-transparent icon for HC unit shipments.",
    description: "Icon used for home city unit shipments. Seems to be present for newer units and missing for some older ones, such as the settler wagon?\nBest practice should be to include one of these in addition to the transparent one. Not a problem since you have this tool.",
    filename: (unit) => `${unit}_hc_icon.png`,
    examples: [
      { label: "8 Landwehr", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=German_Home_City_2_%288_Landwehr%2B2_Uhlans%29.png#Military_Academy" },
    ]
  },
  {
    id: "yellow",
    name: "Yellow",
    src: "frames/yellow.png",
    usage: "Techs or general improvement shipments.",
    description: "Used for most techs in the game, as well as most home city shipments that just provide improvements to something. Seems to be the general \"tech\" colour.",
    filename: (unit) => `tech_${unit}.png`,
    examples: [
      { label: "Hunting Dogs", url: "https://ageofempires.fandom.com/wiki/Hunting_Dogs_(Age_of_Empires_III)" },
      { label: "Guard Infantry (or any unit upgrade)", url: "https://ageofempires.fandom.com/wiki/Skirmisher_(Age_of_Empires_III)?file=Guard_infantry.png" },
      { label: "Advanced Artillery", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=Spanish_Home_City_2_%28Advanced_Artillery%29.png#Military_Academy" },
    ]
  },
  {
    id: "purple",
    name: "Purple",
    src: "frames/purple.png",
    usage: "Infinite shipments.",
    description: "Used for infinite shipments.",
    filename: (unit) => `hc_${unit}_infinite.png`,
    examples: [
      { label: "1 Settler Wagon", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=German_Home_City_1_%281_Settler_Wagon%29.png#New_World_Trading_Company" },
      { label: "2 Falconets", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=Mexican_Home_City_2_%282_Falconet_INF%29.png#Military_Academy" },
      { label: "Frontier Defences", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=Mexican_Home_City_3_%28Front_Defenses_INF%29.png#Cathedral" },
    ]
  },
  {
    id: "green",
    name: "Green",
    src: "frames/green.png",
    usage: "TEAM cards or livestock shipments.",
    description: "Usually used for TEAM shipments, but also used for cards that ship livestock.",
    filename: (unit) => `hc_${unit}_team.png`,
    examples: [
      { label: "TEAM Settler Wagons", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=German_Home_City_1_%282_Settler_Wagons_TEAM%29.png#New_World_Trading_Company" },
      { label: "20 Sheep", url: "https://ageofempires.fandom.com/wiki/Russians/HCC?file=Ottoman_Home_City_1_%2820_Sheep%29.png#New_World_Trading_Company_" },
    ]
  },
  {
    id: "blue",
    name: "Blue",
    src: "frames/blue.png",
    usage: "Shipments that grant special abilities.",
    description: "Used for shipments that give units new special abilities, or \"change the rules\" in some way that's more significant than yellow cards.\nSeems to be a rare choice: in cases where the entire unit is replaced, it seems that yellow or white-blue is used instead; or if unit stats are modified, then either yellow or yellow-blue are preferred instead.",
    filename: (unit) => `hc_${unit}_blue.png`,
    examples: [
      { label: "Hot Air Balloons", url: "https://ageofempires.fandom.com/wiki/Russians/HCC?file=Spanish_Home_City_1_%28Hot_Air_Balloon%29.png#New_World_Trading_Company_" },
      { label: "Mexican Standoff", url: "https://ageofempires.fandom.com/wiki/Mexicans/HCC?file=Mexican_Home_City_5_%28Mexican_Standoff%29.png#Harbor" },
    ]
  },
  {
    id: "red",
    name: "Red",
    src: "frames/red.png",
    usage: "2x shipments.",
    description: "Used for shipments that can be sent twice. Used to be a gimmick of the Japanese deck, but now found otherwhere as well.",
    usesAlpha: false,
    filename: (unit) => `hc_${unit}_red.png`,
    examples: [
      { label: "Tsar Cannon", url: "https://ageofempires.fandom.com/wiki/Russians/HCC?file=Russian_Home_City_2_%28Tsar_Cannon%29.png#Military_Academy_" },
      { label: "2 Villagers (Japanese)", url: "https://ageofempires.fandom.com/wiki/Japanese_(Age_of_Empires_III)/HCC?file=Japanese_Home_City_1_%282_Villagers%29.png" },
    ]
  },
  {
    id: "brown",
    name: "Brown",
    src: "frames/brown.png",
    usage: "Economic or defensive building shipments.",
    description: "Used for cards that ship economic or defensive buildings. A trading post seems to qualify as an eco building?\nSurprisingly, not used for cards such as Advanced Mill that also improve the shipped economic buildings. These are just yellow: seems to me the devs forgot or didn't bother to update the icons once they added the extra shipped unit in an update. Understandable, they didn't have this tool.",
    usesAlpha: false,
    filename: (unit) => `hc_${unit}_brown.png`,
    examples: [
      { label: "Factory", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=Spanish_Home_City_3_%28Factory%29.png#Cathedral" },
      { label: "Fort", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=Spanish_Home_City_3_%28Fort%29.png#Cathedral" },
      { label: "3 Trading Post Wagons (Mexicans)", url: "https://ageofempires.fandom.com/wiki/Mexicans/HCC?file=Sioux_Home_City_3_%283_Trading_Post_Travois%29.png" },
    ]
  },
  {
    id: "passive",
    name: "Passive",
    src: "frames/passive.png",
    fullSizePortrait: true,
    usage: "Passive abilities.",
    description: "Icon used for passive abilities that are always active, as well as charged attacks that don't require active targeting on behalf of the player.",
    filename: (unit) => `${unit}_passive.png`,
    examples: [
      { label: "Regeneration", url: "https://ageofempires.fandom.com/wiki/Ability_(Age_of_Empires_III)?file=Regenerate_ability_aoe3de.png#Charged" },
      { label: "Death Strike", url: "https://ageofempires.fandom.com/wiki/Ability_(Age_of_Empires_III)?file=Passive_death_strike.png#Charged" },
      { label: "Combat Promotion (and all other promotions)", url: "https://ageofempires.fandom.com/wiki/Ability_(Age_of_Empires_III)?file=Combat_Promotion.png#Charged" },
    ]
  },
];

export const mixedColours = [
  { id: "white", name: "White" },
  { id: "green", name: "Green" },
  { id: "purple", name: "Purple" },
  { id: "yellow", name: "Yellow" },
  { id: "blue", name: "Blue" },
  { id: "red", name: "Red" },
  { id: "brown", name: "Brown" },
];

export const mixedDescriptions = {
  "white-yellow": {
    usage: "Mixed unit delivery + enabling shipments.",
    description: "Mixed frame. Seems to be intended for use in cards that deliver units as well enable their production at a building.\nNot to be confused with white-blue, which ships a unit and transforms another unit into that one.",
    examples: [
      { label: "Contract Hessian Jaegers", url: "https://ageofempires.fandom.com/wiki/Swedes/HCC?file=Swedish_Home_City_5_%28Contract_Hessian_Jaegers%29.png#Harbor" },
      { label: "Nassau Regiment", url: "https://ageofempires.fandom.com/wiki/Dutch/HCC?file=Dutch_Home_City_2_%28Nassau_Regiment%29.png#Military_Academy" },
    ]
  },
  "white-blue": {
    usage: "Mixed unit delivery and ability shipments.",
    description: "Mixed frame. Seems to be intended for use in cards that deliver units and also give additional abilities, or transform the delivered unit (instead of enabling its production, which is governed by white-yellow).\nThen again, this is also used for the Imperator card, which delivers a unit but only applies a stat change that would usually warrant a yellow frame.",
    examples: [
      { label: "Princely Bavarian Chevaulegers", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=German_Home_City_2_%28Princely_Bavarian_Chevaulegers%29.png#Military_Academy" },
      { label: "Imperator", url: "https://ageofempires.fandom.com/wiki/Russians/HCC?file=Russian_Home_City_5_%28Imperator%29.png#Harbor_" },
      { label: "Sonora Cuatreros", url: "https://ageofempires.fandom.com/wiki/Federal_State?file=Federal_card_sonora_vaqueros.png" },
    ]
  },
  "white-brown": {
    usage: "Mixed unit and defensive/eco building shipments.",
    description: "Mixed frame. Seems to be intended for use in cards that deliver units as well as a \"defensive\"-type wagon. I'd imagine cards that ship units plus factory or eco building wagons should use this too.",
    examples: [
      { label: "Tula Arms Foundry", url: "https://ageofempires.fandom.com/wiki/Russians/HCC?file=Russian_Home_City_2_%28Tula_Arms_Foundry%29.png#Military_Academy_" },
    ]
  },
  "yellow-blue": {
    usage: "Mixed tech or improvement and an ability.",
    description: "Mixed frame. Seems to be intended for use in cards that ship a means of producing new units, which I suppose qualifies as \"conferring an ability\"... and cards that change research time, maybe?\nFor Annapolis Naval Academy (ship 1 sloop, benefits to minutemen) specifically, I have no idea why that isn't a white-blue card.",
    examples: [
      { label: "Mercenary Camps", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=German_Home_City_5_%28Mercenary_Camps%29.png#Harbor" },
      { label: "Annapolis Naval Academy", url: "https://ageofempires.fandom.com/wiki/Federal_State?file=Federal_card_annapolis_naval_academy.png" },
      { label: "Panuco Waterway", url: "https://ageofempires.fandom.com/wiki/Federal_State?file=Federal_card_panuco_waterway.png" },
    ]
  },
  "yellow-red": {
    usage: "Mixed: 2x improvement",
    description: "Mixed frame. Seems to be intended for use in cards that change something and can be shipped twice. I'm not sure there's more than one example of this in the entire game.",
    examples: [
      { label: "Leather Soldiers", url: "https://ageofempires.fandom.com/wiki/Mexicans/HCC?file=Mexico_card_Leather_Soldiers.png#National_Palace" },
    ]
  },
  "blue-green": {
    usage: "Mixed livestock and ability?",
    description: "Mixed frame. Seems to be intended for use in cards that ship livestock and impose some sort of rules change.",
    examples: [
      { label: "San Marcos Fair", url: "https://ageofempires.fandom.com/wiki/Mexicans/HCC?file=Mexican_Home_City_1_%28San_Marcos_Fair%29.png" },
    ]
  },
  "blue-brown": {
    usage: "Mixed building and ability shipment.",
    description: "Mixed frame. Seems to be intended for use in cards that ship a defensive/eco building and also provide it with a special ability.",
    examples: [
      { label: "Kalmar Castle", url: "https://ageofempires.fandom.com/wiki/Swedes/HCC?file=Swedish_Home_City_3_%28Kalmar_Castle%29.png#Cathedral" },
      { label: "Our Lady of the Light", url: "https://ageofempires.fandom.com/wiki/Federal_State?file=Federal_card_our_lady_of_the_light.png" },
    ]
  },
  "green-purple": {
    usage: "Infinite livestock shipments.",
    description: "Appears to be used for cards that ship infinite livestock.\nOddly, other infinite cards don\"t use mixed borders (for example, Frontier Defences is not brown-purple but just purple). For infinite TEAM cards, see the reverse, purple-green!",
    examples: [
      { label: "7 Sheep + 1 Homestead Wagon", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=Spanish_Home_City_1_%287_Sheep%29.png#New_World_Trading_Company" },
    ]
  },
  "purple-green": {
    usage: "Infinite TEAM cards.",
    description: "Appears to be used for infinite TEAM cards.\nFor infinite livestock, see the reverse, green-purple!",
    examples: [
      { label: "TEAM Soldier Trade (formerly Hire Hessian Jaegers)", url: "https://ageofempires.fandom.com/wiki/Germans/HCC?file=German_Home_City_5_%28Hire_Hessians%29.png#Harbor" },
    ]
  },
};

export const FRAME_SIZE = 128;
export const PORTRAIT_SIZE = 114;
export const PORTRAIT_OUTPUT_SIZE = 512;
export const BORDER_THICKNESS = (FRAME_SIZE - PORTRAIT_SIZE) / 2;

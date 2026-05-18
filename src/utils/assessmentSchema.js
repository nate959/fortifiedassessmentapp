export const SECTIONS = [
  {
    title: 'Foundation',
    questions: [
      { id: 'foundation_type', text: 'Select one of the following foundation types', type: 'radio', options: ['Slab on grade', 'Pier and beam/Piling', 'Concrete block'] },
      { id: 'foundation_mortar', text: 'If Concrete block: Are blocks mortared together?', type: 'radio', options: ['Yes', 'No'] },
    ]
  },
  {
    title: 'Roof Framing & Spacing',
    questions: [
      { id: 'framing_type', text: 'Select one of the following framing types', type: 'radio', options: ['Rafters', 'Trusses'] },
      { id: 'spacing', text: 'Select one of the following spacing options', type: 'radio', options: ['16" on center', '24" on center', '>24" on center'] },
    ]
  },
  {
    title: 'Roof Deck Type & Thickness',
    questions: [
      { id: 'sheathing_type', text: 'Select one of the following roof sheathing types', type: 'radio', options: ['OSB', 'Plywood', 'Tongue and Groove', '1x Planks'] },
      { id: 'sheathing_thickness', text: 'Select one of the following sheathing thicknesses', type: 'radio', options: ['7/16"', '15/32"', '19/32"', '3/8"', '1x planks with gaps > 1/8"'] },
      { id: 'deck_attachment', text: 'Roof Deck Attachment details (nail size/spacing)', type: 'text' },
      { id: 'sealed_deck', text: 'Sealed Roof Deck present?', type: 'radio', options: ['Yes', 'No'] },
    ]
  },
  {
    title: 'Roof Covering & Ventilation',
    questions: [
      { id: 'roof_covering', text: 'Select roof cover types homeowner would like quote for', type: 'radio', options: ['Asphalt shingles', 'Metal panels'] },
      { id: 'vent_types', text: 'Select the applicable vent types that are present', type: 'radio', options: ['Ridge', 'Off-ridge', 'Power', 'None or attic sealed'] },
      { id: 'gable_vents', text: 'Are gable end vents present?', type: 'radio', options: ['Yes', 'No'] },
    ]
  },
  {
    title: 'Attached Structures',
    questions: [
      { id: 'structure_type', text: 'Select the applicable structure type', type: 'radio', options: ['Porch', 'Carport', 'Breezeway', 'None'] },
      { id: 'structure_tie_in', text: 'Does structure tie into roof?', type: 'radio', options: ['Yes', 'No'] },
      { id: 'structure_living_space', text: 'Is space beneath structure living space? (heated/cooled)', type: 'radio', options: ['Yes', 'No'] },
      { id: 'structure_qualifying_deck', text: 'Does structure have a qualifying roof deck?', type: 'radio', options: ['Yes', 'No'] },
      { id: 'structure_slope', text: 'What is the slope of the attached structure?', type: 'text' },
    ]
  },
  {
    title: 'Roof Slope & Special Eligibility',
    questions: [
      { id: 'multiple_slopes', text: 'Are there multiple roof slopes?', type: 'radio', options: ['Yes', 'No'] },
      { id: 'special_eligibility', text: 'Are any of the following present?', type: 'radio', options: ['Solar panels', 'Roof-mounted AC unit', 'Roof-mounted deck', 'None'] },
    ]
  }
];

export const calculateUpgrades = (questions) => {
  const upgrades = [];

  if (questions['foundation_type'] === 'Concrete block' && questions['foundation_mortar'] === 'No') {
    upgrades.push('Foundation Blocks not mortared: Stop. Cannot proceed.');
  }

  if (questions['spacing'] === '>24" on center') {
    upgrades.push('Roof Framing Spacing >24": Requires engineer. Will incur additional cost.');
  }

  if (questions['sheathing_thickness'] === '3/8"' || questions['sheathing_thickness'] === '1x planks with gaps > 1/8"') {
    upgrades.push('Roof Deck Thickness insufficient: Redeck required.');
  } else if (questions['sheathing_thickness']) {
    upgrades.push('Roof Deck Attachment: Retrofit required. Must renail. For rotten or damaged sheathing, full sheet must be replaced. Patching is not permitted.');
  }

  upgrades.push('Sealed Roof Deck: Retrofit required.');
  
  if (questions['roof_covering']) {
    upgrades.push(`Roof Covering (${questions['roof_covering']}): Retrofit required.`);
  }

  if (['Ridge', 'Off-ridge', 'Power'].includes(questions['vent_types'])) {
    upgrades.push(`Roof Ventilation (${questions['vent_types']}): Retrofit required.`);
  }

  if (questions['gable_vents'] === 'Yes') {
    upgrades.push('Gable End Vents: Retrofit required. Must be permanently covered OR have removable covers installed.');
  }

  if (questions['structure_type'] && questions['structure_type'] !== 'None') {
    if (questions['structure_tie_in'] === 'Yes' || questions['structure_living_space'] === 'Yes') {
      upgrades.push(`Attached Structure (${questions['structure_type']}): Retrofit required. Structure must be reroofed.`);
    }
    if (questions['structure_qualifying_deck'] === 'No') {
      upgrades.push(`Attached Structure Deck (${questions['structure_type']}): Retrofit required. Must redeck.`);
    }
  }

  if (['Solar panels', 'Roof-mounted AC unit', 'Roof-mounted deck'].includes(questions['special_eligibility'])) {
    upgrades.push(`Special Eligibility (${questions['special_eligibility']}): Engineer required.`);
  }

  return upgrades;
};

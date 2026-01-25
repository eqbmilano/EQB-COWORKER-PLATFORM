/**
 * EQB Brand & Style Configuration
 * Central source for tone-of-voice, palette, typography, and positioning.
 */

export const brand = {
  name: 'EQB',
  meaning: 'Equilibrium',
  payoff: 'Wellness & Fitness Coworking',
  personality: ['Accogliente', 'Professionale', 'Moderna'],

  toneOfVoice: {
    clients: ['Professionale ma umano', 'Caldo e accogliente', 'Chiaro e rassicurante'],
    professionals: ['Chiaro', 'Diretto', 'Strutturato'],
  },

  positioning: {
    promise: 'Piattaforma fisica e relazionale per il benessere integrato',
    pillars: ['Professionalità', 'Cura', 'Calma', 'Modernità', 'Concretezza'],
    description: [
      'I professionisti crescono e si sviluppano',
      'Nascono collaborazioni multidisciplinari',
      'I clienti vengono indirizzati verso percorsi completi di benessere e movimento',
    ],
  },

  target: {
    therapyHealth: ['Fisioterapisti', 'Osteopati', 'Psicoterapeuti', 'Counselor'],
    movementPerformance: [
      'Personal trainer',
      'Insegnanti di Pilates',
      'Professionisti di allenamento funzionale',
      'Insegnanti di Calisthenics',
      'Insegnanti di Yoga',
      'Preparatori atletici',
    ],
    integratedWellness: [
      'Nutrizionisti',
      'Massoterapisti',
      'Operatori olistici',
      'Mental coach',
      'Esperti di Breathwork',
    ],
    clients: [
      'Persone orientate al benessere e al movimento',
      'Clienti che cercano percorsi integrati',
      'Target medio-alto attento alla qualità',
      'Persone interessate a trattamenti e allenamenti privati',
    ],
  },

  colors: {
    logoPrimaryWood: '#27201B',
    logoSecondaryWood: '#392D28',
    palettePrimary: '#382D28',
    paletteSecondary: '#392D28',
    warmWhite: '#F4F1EC',
    // Future extension: add neutral tones (e.g., taupe) for flexibility
  },

  typography: {
    logo: {
      family: 'Chopard',
      regular: 'Chopard Regular',
      accentQ: 'Chopard Bold',
    },
    text: 'Manrope Regular',
  },
};

export default brand;

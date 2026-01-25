/**
 * EQB Company Profile Data
 * Configuration file for company information
 */

export const companyProfile = {
  name: 'EQB Milano - Cinque Giornate',
  legalName: 'EQB Milano S.r.l.',
  address: {
    street: 'Viale Regina Margherita, 43',
    city: 'Milano',
    province: 'MI',
    zipCode: '20122',
    country: 'Italia',
    full: 'Viale Regina Margherita, 43, 20122, Milano MI',
  },
  contact: {
    email: 'info@eqbmilano.it',
    phone: '+39 02 XXXX XXXX', // TODO: Add real phone number
    website: 'https://eqbmilano.it',
  },
  business: {
    vatNumber: '', // TODO: Add P.IVA
    fiscalCode: '', // TODO: Add Codice Fiscale
    rea: '', // TODO: Add REA number
  },
  // Capacità centro (da documentazione)
  capacity: {
    trainingRoom: {
      stations: 4,
      hoursPerDay: 10,
      workingDaysPerMonth: 24,
      totalHoursPerMonth: 960, // 4 × 10 × 24
    },
    treatmentRooms: {
      rooms: 3,
      hoursPerDay: 7.5,
      workingDaysPerMonth: 24,
      totalHoursPerMonth: 540, // 3 × 7.5 × 24
    },
    total: {
      hoursPerMonth: 1500, // 960 + 540
    },
  },
};

export default companyProfile;

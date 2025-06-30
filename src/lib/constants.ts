export const COLLEGE_STRUCTURE = {
  'SOET': {
    name: 'School of Engineering and Technology',
    semesters: 8,
    departments: {
      'CSE': {
        name: 'Computer Science and Engineering',
        specializations: [
          'AIML',
          'DSML',
          'CSBS',
          'CN',
          'No Specialization'
        ]
      },
      'MECH': {
        name: 'Mechanical Engineering',
        specializations: ['No Specialization']
      },
      'ECE': {
        name: 'Electronics and Communication Engineering',
        specializations: ['No Specialization']
      }
    }
  },
  'SoPHAS': {
    name: 'School of Paramedics and Allied Health Sciences',
    semesters: 6,
    departments: {
      'BSc': {
        name: 'Bachelor of Science',
        specializations: [
          'Forensic Science',
          'Anesthesia',
          'Radiology',
          'Optometry',
          'Pharmacy',
          'Agriculture'
        ]
      }
    }
  },
  'SoM': {
    name: 'School of Management',
    semesters: 6,
    departments: {
      'BBA': {
        name: 'Bachelor of Business Administration',
        specializations: ['No Specialization']
      }
    }
  }
} as const;

export type School = 'SOET' | 'SoPHAS' | 'SoM';
export type Department = 'CSE' | 'MECH' | 'ECE' | 'BSc' | 'BBA';
export type Specialization = 
  | 'AIML' 
  | 'DSML' 
  | 'CSBS' 
  | 'CN' 
  | 'Forensic Science'
  | 'Anesthesia'
  | 'Radiology'
  | 'Optometry'
  | 'Pharmacy'
  | 'Agriculture'
  | 'No Specialization'; 
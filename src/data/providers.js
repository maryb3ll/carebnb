/**
 * PROVIDER DATA MANAGEMENT
 * 
 * This file contains all provider data for the patient search and booking system.
 * To update or replace the provider list:
 * 1. Replace the entire providersData array with your new dataset
 * 2. Ensure each provider object follows the structure below
 * 3. Save the file - changes will reflect immediately
 * 
 * Required fields for each provider:
 * - id: unique number
 * - name: string
 * - specialty: string
 * - image: URL string
 * - imageAlt: descriptive alt text for accessibility
 * - rating: number (0-5)
 * - reviews: number
 * - distance: number (miles)
 * - nextAvailable: string (e.g., "Today, 3:00 PM")
 * - available: boolean
 * - credentials: array of strings
 * - bio: string
 */

export const providersData = [
  {
    id: 1,
    name: "Dr. Sarah Mitchell",
    specialty: "Registered Nurse - Home Care Specialist",
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1787f0ff5-1764790614873.png",
    imageAlt: "Professional female nurse with warm smile wearing navy blue scrubs and stethoscope in modern medical facility",
    rating: 4.9,
    reviews: 127,
    distance: 2.3,
    nextAvailable: "Today, 3:00 PM",
    available: true,
    credentials: ["RN", "BSN", "10+ years experience", "HIPAA Certified"],
    bio: "Experienced registered nurse specializing in post-operative care, wound management, and chronic disease monitoring. I provide compassionate, professional care in the comfort of your home with a focus on patient education and recovery support."
  },
  {
    id: 2,
    name: "Michael Chen",
    specialty: "Licensed Practical Nurse - IV Therapy",
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1b1c04106-1763296347849.png",
    imageAlt: "Asian male nurse in white medical coat with professional demeanor standing in hospital corridor with medical equipment visible",
    rating: 4.8,
    reviews: 94,
    distance: 3.7,
    nextAvailable: "Tomorrow, 10:00 AM",
    available: false,
    credentials: ["LPN", "IV Certified", "8 years experience", "CPR Certified"],
    bio: "Specialized in IV therapy administration, blood draws, and injection services. I ensure safe, sterile procedures with minimal discomfort while maintaining the highest standards of patient care and safety protocols."
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    specialty: "Nurse Practitioner - Primary Care",
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_155748a5d-1763296653785.png",
    imageAlt: "Hispanic female nurse practitioner with confident smile wearing teal scrubs and white coat holding medical tablet in bright clinic setting",
    rating: 5.0,
    reviews: 156,
    distance: 1.8,
    nextAvailable: "Today, 5:00 PM",
    available: true,
    credentials: ["NP", "MSN", "Family Medicine", "15+ years experience"],
    bio: "Board-certified nurse practitioner offering comprehensive primary care services including health assessments, medication management, and chronic condition monitoring. I believe in building long-term relationships with patients through personalized, evidence-based care."
  },
  {
    id: 4,
    name: "James Thompson",
    specialty: "Physical Therapist - Home Rehabilitation",
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1adc98132-1763295638675.png",
    imageAlt: "African American male physical therapist in black athletic wear demonstrating exercise technique with professional equipment in modern therapy room",
    rating: 4.7,
    reviews: 83,
    distance: 4.2,
    nextAvailable: "Feb 16, 9:00 AM",
    available: false,
    credentials: ["PT", "DPT", "Orthopedic Specialist", "12 years experience"],
    bio: "Dedicated physical therapist specializing in post-surgical rehabilitation, mobility restoration, and pain management. I create customized treatment plans that help patients regain independence and improve quality of life through evidence-based therapeutic interventions."
  },
  {
    id: 5,
    name: "Dr. Amanda Foster",
    specialty: "Registered Nurse - Palliative Care",
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1787f0ff5-1764790614873.png",
    imageAlt: "Caucasian female nurse with compassionate expression wearing light blue scrubs and stethoscope in softly lit patient care environment",
    rating: 4.9,
    reviews: 142,
    distance: 2.9,
    nextAvailable: "Today, 2:00 PM",
    available: true,
    credentials: ["RN", "Palliative Care Certified", "Hospice Specialist", "18 years experience"],
    bio: "Compassionate palliative care nurse focused on comfort, dignity, and quality of life for patients with serious illnesses. I work closely with families to provide holistic support, symptom management, and end-of-life care with empathy and respect."
  },
  {
    id: 6,
    name: "Lisa Park",
    specialty: "Lactation Consultant - Postpartum Support",
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1c69fa735-1763301105383.png",
    imageAlt: "Asian female lactation consultant with gentle smile wearing casual professional attire holding infant care materials in warm home setting",
    rating: 5.0,
    reviews: 98,
    distance: 3.1,
    nextAvailable: "Tomorrow, 11:00 AM",
    available: false,
    credentials: ["IBCLC", "RN", "Postpartum Specialist", "9 years experience"],
    bio: "International Board Certified Lactation Consultant providing expert breastfeeding support, newborn care education, and postpartum guidance. I help new mothers navigate feeding challenges with patience, evidence-based techniques, and personalized care plans."
  }
];

export default providersData;
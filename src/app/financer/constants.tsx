import { User, Search, FileText, Check } from 'lucide-react'

export interface Aide {
  id: string
  nom: string
  type_aide: string
  profil_eligible: string[]
  situation_eligible: string[]
  montant_max: number | null
  url_officielle: string | null
  description: string
  region: string | null
  handicap_only: boolean
}

export const PROFILS = [
  { id: 'salarie', label: 'Salarie' },
  { id: 'demandeur_emploi', label: 'Demandeur d&apos;emploi' },
  { id: 'independant', label: 'Independant / auto-entrepreneur' },
  { id: 'etudiant', label: 'Etudiant' },
  { id: 'jeune', label: 'Jeune (16-25 ans)' },
  { id: 'parent', label: 'Parent' },
  { id: 'parent_isole', label: 'Parent isole' },
  { id: 'retraite', label: 'Retraite' },
  { id: 'senior', label: 'Senior (60+)' },
  { id: 'handicape', label: 'Personne en situation de handicap' },
  { id: 'etranger', label: 'Etranger' },
  { id: 'createur', label: 'Createur d&apos;entreprise' },
  { id: 'apprenti', label: 'Apprenti / alternant' },
]

export const SITUATIONS = [
  { id: 'faibles_revenus', label: 'Faibles revenus' },
  { id: 'sans_emploi', label: 'Sans emploi' },
  { id: 'perte_emploi_involontaire', label: 'Perte d&apos;emploi involontaire' },
  { id: 'fin_droits_chomage', label: 'Fin de droits chomage' },
  { id: 'handicap', label: 'Handicap reconnu' },
  { id: 'enfant_handicape', label: 'Enfant handicape' },
  { id: 'perte_autonomie', label: 'Perte d&apos;autonomie' },
  { id: '2_enfants_plus', label: '2 enfants ou plus' },
  { id: 'naissance', label: 'Naissance / adoption recente' },
  { id: 'enfant_moins_6ans', label: 'Enfant de moins de 6 ans' },
  { id: 'enfant_6_18ans', label: 'Enfant de 6 a 18 ans' },
  { id: 'renovation_energetique', label: 'Travaux de renovation energetique' },
  { id: 'recherche_logement', label: 'Recherche de logement' },
  { id: 'creation_entreprise', label: 'Creation d&apos;entreprise' },
  { id: 'situation_urgente', label: 'Situation d&apos;urgence' },
  { id: 'reprise_emploi_loin', label: 'Reprise d&apos;emploi loin de chez moi' },
]

export const STEPS = [
  { id: 1, label: 'Ton profil', icon: User },
  { id: 2, label: 'Aides disponibles', icon: Search },
  { id: 3, label: 'Ton dossier', icon: FileText },
  { id: 4, label: 'Suivi', icon: Check },
]

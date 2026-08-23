import {
  HelpCircle, MessageSquare, CreditCard,
  Users, Wrench, Sparkles,
} from 'lucide-react'

export const CATEGORIES: { id: string; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'general', label: 'General', icon: <HelpCircle className="h-5 w-5" />, color: '#00d4ff' },
  { id: 'chat', label: 'Chat IA', icon: <MessageSquare className="h-5 w-5" />, color: '#a855f7' },
  { id: 'creation', label: 'Creation', icon: <Sparkles className="h-5 w-5" />, color: '#f59e0b' },
  { id: 'agents', label: 'Agents', icon: <Wrench className="h-5 w-5" />, color: '#10b981' },
  { id: 'billing', label: 'Facturation', icon: <CreditCard className="h-5 w-5" />, color: '#ef4444' },
  { id: 'referral', label: 'Parrainage', icon: <Users className="h-5 w-5" />, color: '#ec4899' },
  { id: 'wallet', label: 'Wallet', icon: <CreditCard className="h-5 w-5" />, color: '#3b82f6' },
  { id: 'points', label: 'Points', icon: <Sparkles className="h-5 w-5" />, color: '#f97316' },
  { id: 'support', label: 'Support', icon: <HelpCircle className="h-5 w-5" />, color: '#6366f1' },
]

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

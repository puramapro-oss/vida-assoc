import { Nav, Hero, Stats, Features, HowItWorks, Pricing, AssociationsList, Promise, FAQ, FinalCTA, Footer } from './components-landing'

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main className="relative overflow-x-clip">
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Pricing />
        <AssociationsList />
        <Promise />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}

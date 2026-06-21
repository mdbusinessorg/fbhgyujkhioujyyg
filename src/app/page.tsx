import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Categories from '@/components/Categories'
import FeaturedJobs from '@/components/FeaturedJobs'
import HowItWorks from '@/components/HowItWorks'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Hero />
        <Categories />
        <FeaturedJobs />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  )
}

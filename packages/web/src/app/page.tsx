import Footer from '@/components/footer'
import Header from '@/components/header'
import Hero from '@/components/hero'
import { Spotlight } from '@/components/ui/spotlight'

const Page = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden">
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />
        <Hero />
      </main>
      <Footer />
    </div>
  )
}

export default Page

import Footer from '@/components/footer'
import Header from '@/components/header'
import Hero from '@/components/hero'
import { Spotlight } from '@/components/ui/spotlight'

const Page = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative flex flex-1 items-center justify-center overflow-x-hidden overflow-y-auto px-4 pb-10 pt-24 sm:px-6 sm:pb-12 sm:pt-28 lg:px-8">
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />
        <Hero />
      </main>
      <Footer />
    </div>
  )
}

export default Page
